# Docker Container Setup

Initial setup and diagnostics for SearXNG and Camofox containers.
Containers are configured to start automatically on boot (`--restart unless-stopped`).

## Initial Setup

```bash
# SearXNG (via docker-compose)
# Follow: https://docs.searxng.org/admin/installation-docker.html
# In searxng/.env set SEARXNG_HOST=127.0.0.1 so :8080 is not exposed on 0.0.0.0
cd <searxng-directory> && docker compose up -d

# Camofox (official GHCR image)
# ⚠️  SECURITY: Use --env-file for API keys (never pass on command line)
# Create .env file: echo "CAMOFOX_API_KEY=your-key" > .env
docker start camofox-browser 2>/dev/null || docker run -d \
  --name camofox-browser \
  --restart unless-stopped \
  --tmpfs /tmp \
  --tmpfs /home/camofox/.cache \
  --memory 2g \
  --cpus 2 \
  --pids-limit 200 \
  --security-opt no-new-privileges \
  --ulimit core=0 \
  --log-opt max-size=10m --log-opt max-file=3 \
  -v camofox-data:/root/.camofox \
  -e CAMOFOX_CRASH_REPORT_ENABLED=false \
  -e MAX_OLD_SPACE_SIZE=512 \
  -p 127.0.0.1:9377:9377 \
  --env-file .env \
  ghcr.io/jo-inc/camofox-browser:1.18.1
```

> Sul Raspberry Pi di Alessio il kernel ha `cgroup_disable=memory`: `--memory 2g` viene ignorato (Docker avvisa "No memory limit support"). Il container attuale è stato creato senza quel flag; il server ha comunque una soglia RSS interna (1500 MB) che riavvia il browser.

## Security Notes

- **Port binding:** Always use `127.0.0.1:` prefix to bind to localhost only. Never expose to `0.0.0.0`.
- **API keys:** Use `--env-file .env` instead of `-e` on command line. Keys in command line appear in `ps aux` and shell history.
- **Resource limits:** `--memory`, `--cpus`, and `--pids-limit` prevent container runaway.
- **Writable dirs:** `--tmpfs /tmp` and `--tmpfs /home/camofox/.cache` provide writable temp/cache for browser profiles. `--read-only` is intentionally omitted as Camofox needs writable profile storage.
- **No new privileges:** `--security-opt no-new-privileges` prevents privilege escalation.
- **Core dump disabilitati:** `--ulimit core=0` è indispensabile. Firefox (Camoufox) ogni tanto crasha e si riavvia da solo; senza questo flag ogni crash scrive un file `core.*` da 10 MB–1,2 GB in `/app` (con `core_pattern=core` e `LimitCORE=infinity` di Docker). Tra luglio e ottobre 2026 se ne sono accumulati 403 = 28 GB. Con `core=0` il browser si riavvia come prima ma non scrive nulla.
- **Heap di Node:** `-e MAX_OLD_SPACE_SIZE=512` alza il limite dell'heap del server (default dell'immagine: 128 MB). Con 128 MB il server va in `FATAL ERROR: Reached heap limit` quando ricrea la sessione e rilegge `storage-state.json` (il 21-10-2026 il file era di 7 MB). Su macchine con poca RAM bastano 256.
- **Storage persistito:** il volume `camofox-data` contiene cookie e localStorage di ogni sito visitato e cresce senza limite. Gli script lo azzerano da soli ogni 7 giorni (vedi `data/advanced-browsing-reference.md`, nota "Storage"); non serve intervenire a mano.
- **Rotazione log:** `--log-opt max-size=10m --log-opt max-file=3` limita i log del container a 30 MB.
- **Volume `camofox-data`:** conserva cookie/profili (`/root/.camofox`) quando il container viene ricreato (es. per un aggiornamento immagine).
- **Telemetria off:** `CAMOFOX_CRASH_REPORT_ENABLED=false` impedisce l'invio di report di crash anonimizzati a un server esterno.
- **Versione fissa:** usare il tag esplicito (`1.18.1`), non `latest`, così gli aggiornamenti sono sempre una scelta. Verificare la skill dopo ogni upgrade (vedi sotto).

## Aggiornamento / ricreazione del container

```bash
docker pull ghcr.io/jo-inc/camofox-browser:<nuova-versione>
docker tag ghcr.io/jo-inc/camofox-browser:1.18.1 camofox-browser:<versione-corrente>-backup   # per il rollback
docker stop camofox-browser && docker rm camofox-browser
# poi rilanciare il docker run sopra con il nuovo tag (il volume camofox-data mantiene i cookie)
```

Dopo l'upgrade eseguire `bash <skill_dir>/scripts/check.sh` e un `smart-extract.mjs` di prova. Diagnostica crash: `docker exec camofox-browser sh -c 'ls /app/core.* 2>/dev/null | wc -l'` deve restituire `0`.

## Diagnostics

```bash
# Check running containers
docker ps | grep -E 'searxng|camofox'

# Individual health checks
curl -s http://localhost:9377/health   # Camofox
curl -s http://localhost:8080/health   # SearXNG
```
