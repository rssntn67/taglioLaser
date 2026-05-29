# Deploy su VPS

## Prima installazione

1. Copia il progetto sul VPS:
   ```bash
   git clone <repo> /opt/tagliolaser
   cd /opt/tagliolaser
   ```

2. Crea il file `.env.local` a partire da `.env.local.example` e compila tutti i valori.

3. Costruisci e avvia:
   ```bash
   docker compose build
   docker compose up -d
   ```

4. Esegui migration e seed:
   ```bash
   docker compose exec app npx prisma migrate deploy
   docker compose exec app npx prisma db seed
   ```

5. Configura Nginx come reverse proxy (vedi `nginx.conf`) e ottieni SSL con Let's Encrypt:
   ```bash
   certbot --nginx -d tuodominio.it
   ```

## Aggiornamenti

```bash
git pull
docker compose build app
docker compose up -d app
docker compose exec app npx prisma migrate deploy
```
