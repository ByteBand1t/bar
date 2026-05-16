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

## Production Deployment

```bash
# 1. DNS: A-Record für bar.franzi.app auf Server-IP setzen
# 2. data-Verzeichnis erstellen (vor dem ersten Start!)
mkdir -p ./data/images

# 3. Starten (Caddy holt Let's Encrypt Zertifikat automatisch)
docker compose up -d --build
```

Seed-Daten laden (einmalig nach erstem Start):

```bash
docker compose exec app node_modules/.bin/tsx prisma/seed.ts
```

## Gesundheitscheck

```bash
curl http://localhost/api/health
# mit Host-Header:
curl -H "Host: bar.franzi.app" http://<server-ip>/api/health
```

## Backup

`./data/app.db` regelmäßig sichern – das ist die einzige persistente Datei.

```bash
cp ./data/app.db ./backups/app-$(date +%Y%m%d-%H%M).db
```

## Routen

| Route | Beschreibung |
|---|---|
| `/` | Cocktailkarte für Gäste |
| `/cart` | Warenkorb + Bestellung absenden |
| `/status/[id]` | Bestellstatus (pollt alle 5 Sek.) |
| `/api/cocktails` | Verfügbare Cocktails (GET) |
| `/api/orders` | Bestellung erstellen (POST) |
| `/api/orders/[id]` | Bestellstatus abrufen (GET) |
| `/api/health` | Healthcheck (GET) |
