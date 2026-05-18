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

## Routen

| Route | Beschreibung | Auth |
|---|---|---|
| `/` | Cocktailkarte für Gäste | – |
| `/cart` | Warenkorb + Bestellung | – |
| `/status/[id]` | Bestellstatus | – |
| `/bar` | Bar-Dashboard (Kanban) | Bar-PIN |
| `/bar/login` | Bar-Anmeldung | – |
| `/admin` | Cocktail-Verwaltung | Admin-PIN |
| `/admin/cocktails/new` | Neuer Cocktail | Admin-PIN |
| `/admin/cocktails/[id]` | Cocktail bearbeiten | Admin-PIN |
| `/api/cocktails` | Verfügbare Cocktails (GET) | – |
| `/api/orders` | Bestellung erstellen (POST) | – |
| `/api/auth/login` | Anmelden (POST) | – |
| `/api/auth/logout` | Abmelden (POST) | – |
| `/api/health` | Healthcheck (GET) | – |
