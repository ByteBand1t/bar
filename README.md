# Franzis Geburtstags-Bar

Cocktail-Bestellsystem für eine Party. Gäste bestellen per Handy, der Barkeeper sieht Bestellungen live.

## Quickstart (lokal)

```bash
pnpm install
pnpm prisma migrate dev
DATABASE_URL="file:./data/dev.db" pnpm tsx prisma/seed.ts
pnpm dev
```

Öffne http://localhost:3000

## PIN-Setup (vor der Party!)

Kopiere `.env.example` nach `.env` und passe die Werte an:

```bash
cp .env.example .env
```

### Session-Secret generieren

```bash
openssl rand -hex 32
```

Den generierten Wert in `.env` als `SESSION_SECRET` eintragen.

### PINs setzen

```env
BAR_PIN=1234       # PIN für Barkeeper-Zugang (/bar)
ADMIN_PIN=9999     # PIN für Admin-Zugang (/admin) – auch für /bar nutzbar
```

**Wichtig:** Beide PINs vor der Party auf sichere Werte ändern!

## Production Deployment

```bash
# 1. DNS: A-Record für bar.franzi.app auf Server-IP setzen
# 2. .env mit echten Werten anlegen (SESSION_SECRET, BAR_PIN, ADMIN_PIN)
mkdir -p ./data/images

# 3. Starten (Caddy holt Let's Encrypt Zertifikat automatisch)
docker compose up -d --build
```

`docker compose up` schlägt mit klarer Fehlermeldung fehl, wenn `SESSION_SECRET` nicht gesetzt ist.

Seed-Daten laden (einmalig nach erstem Start):

```bash
docker compose exec app node_modules/.bin/tsx prisma/seed.ts
```

## Backup

Beide Verzeichnisse sichern:

```bash
# Datenbank
cp ./data/app.db ./backups/app-$(date +%Y%m%d-%H%M).db

# Bilder
tar -czf ./backups/images-$(date +%Y%m%d-%H%M).tar.gz ./data/images/
```

### Verwaiste Bilder aufräumen

Bilder werden beim Löschen/Ersetzen automatisch entfernt. Wurde ein Upload gestartet,
aber der Cocktail nie gespeichert, bleibt ein verwaistes `.webp` in `/data/images` liegen.
Das ist für eine Party unkritisch – bei Bedarf manuell bereinigen:

```bash
# Liste der referenzierten Dateinamen aus der DB:
sqlite3 ./data/app.db "SELECT imageFilename FROM Cocktail WHERE imageFilename IS NOT NULL;"
# Dann mit ls /data/images/ vergleichen
```

## Gesundheitscheck

```bash
curl http://localhost/api/health
```

## Pause-Modus

Über den Status-Button oben rechts im Bar-Dashboard (`Aktiv` / `Pausiert`)
kann die Bestellannahme global gestoppt werden (Pinkelpause,
Tortenanschnitt). Optional mit Nachricht und Auto-Resume nach
5/10/15/30 Min. Gäste sehen sofort (live via SSE) einen Banner; der
Bestell-Button ist gesperrt. Beim Fortsetzen verschwindet der Banner mit
grüner Bestätigung.

## Schnell-Verfügbarkeit

Im Bar-Dashboard öffnet der Button „Verfügbarkeit“ einen Drawer mit allen
Cocktails und einem Toggle pro Drink. Umschalten wirkt sofort (live) auf
der Gäste-Seite – Karten werden ausgegraut, Warenkorb-Items markiert.

## Statistik

`/bar/stats` (Bar+Admin): Live-Auswertung der Partynacht – KPIs,
Bestellungen pro Zeit, Top-Cocktails, Gäste-Bestenliste,
Wartezeit-Verteilung, Stornos. Zeitraum-Filter (Heute / Letzte Stunde /
Letzten 15 Min / Alle). Aktualisiert sich live (debounced).

## Party-Screen

`/screen` (ohne Login, für Beamer/TV): Fullscreen-Bestenliste + Live-Ticker
der letzten Bestellungen. Zeigt bewusst nur Vornamen und Zahlen, keine
Notizen/Tags.

## Export &amp; Backup

`/admin/export` (Admin): CSV (Bestellungen, Items, Events, Cocktails –
UTF-8 BOM, `;`-Separator für deutsches Excel), JSON-Dump der ganzen DB,
und ein komplettes ZIP-Backup (`dump.json` + konsistente
`db/app.db`-Kopie + alle Bilder).

**Empfehlung:** Backup vor der Party (leerer Stand), einmal mittendrin
und nach der Party ziehen.

### Auto-Backup (optional, nicht implementiert – nur Doku)

Stündliches Cron auf dem Host (Header-Secret in ENV setzen und in einer
kleinen Auth-Erweiterung prüfen):

```bash
0 * * * * curl -sS -H "X-Backup-Secret: $BACKUP_SECRET" \
  https://bar.franzi.app/api/admin/export/backup.zip \
  -o /backups/bar-$(date +\%Y\%m\%d-\%H\%M).zip
```

## Vor der Party – Checkliste

1. PINs in `.env` ändern (`BAR_PIN`, `ADMIN_PIN`)
2. `SESSION_SECRET` generieren (`openssl rand -hex 32`) – App startet in
   Production ohne nicht
3. DNS (`bar.franzi.app`) auf Server-IP zeigen lassen
4. `docker compose up -d --build`
5. Cocktails im Admin (`/admin`) anlegen
6. Test-Bestellung machen (`/` → `/cart` → `/status/[id]`)
7. Backup ziehen (`/admin/export`)
8. Sound an der Bar testen (`/bar`, Sound-Toggle)
9. `/screen` auf Beamer/TV öffnen

## Routen

| Route | Beschreibung | Auth |
|---|---|---|
| `/` | Cocktailkarte für Gäste | – |
| `/cart` | Warenkorb + Bestellung | – |
| `/status/[id]` | Bestellstatus | – |
| `/bar` | Bar-Dashboard (Kanban) | Bar-PIN |
| `/bar/stats` | Statistik-Dashboard | Bar-PIN |
| `/bar/login` | Bar-Anmeldung | – |
| `/screen` | Party-Screen (Beamer) | – |
| `/admin` | Cocktail-Verwaltung | Admin-PIN |
| `/admin/export` | Export &amp; Backup | Admin-PIN |
| `/admin/cocktails/new` | Neuer Cocktail | Admin-PIN |
| `/admin/cocktails/[id]` | Cocktail bearbeiten | Admin-PIN |
| `/api/cocktails` | Verfügbare Cocktails (GET) | – |
| `/api/orders` | Bestellung erstellen (POST) | – |
| `/api/bar-state` | Pause-Status (GET) | – |
| `/api/guest/stream` | Gäste-SSE (Pause/Verfügbarkeit) | – |
| `/api/bar/pause` · `/api/bar/resume` | Pause steuern (POST) | Bar-PIN |
| `/api/bar/stats` | Aggregierte Statistik (GET) | Bar-PIN |
| `/api/screen` · `/api/screen/stream` | Party-Screen-Daten | – |
| `/api/admin/export/*` | CSV/JSON/ZIP-Export | Admin-PIN |
| `/api/auth/login` | Anmelden (POST) | – |
| `/api/auth/logout` | Abmelden (POST) | – |
| `/api/health` | Healthcheck (GET) | – |
