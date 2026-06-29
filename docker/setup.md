# Docker Container Setup

Initial setup and diagnostics for SearXNG and Camofox containers.
Containers are configured to start automatically on boot (`--restart unless-stopped`).

## Initial Setup

```bash
# SearXNG (via docker-compose)
# Follow: https://docs.searxng.org/admin/installation-docker.html
cd <searxng-directory> && docker compose up -d

# Camofox
# Build from source or pull image, then:
# ⚠️  SECURITY: Use --env-file for API keys (never pass on command line)
# Create .env file: echo "CAMOFOX_API_KEY=your-key" > .env
docker start camofox-browser 2>/dev/null || docker run -d \
  --name camofox-browser \
  --restart unless-stopped \
  --read-only \
  --tmpfs /tmp \
  --memory 2g \
  --cpus 2 \
  --pids-limit 200 \
  --security-opt no-new-privileges \
  -p 127.0.0.1:9377:9377 \
  --env-file .env \
  camofox-browser:latest
```

## Security Notes

- **Port binding:** Always use `127.0.0.1:` prefix to bind to localhost only. Never expose to `0.0.0.0`.
- **API keys:** Use `--env-file .env` instead of `-e` on command line. Keys in command line appear in `ps aux` and shell history.
- **Resource limits:** `--memory`, `--cpus`, and `--pids-limit` prevent container runaway.
- **Read-only filesystem:** `--read-only` + `--tmpfs /tmp` limits container write access.
- **No new privileges:** `--security-opt no-new-privileges` prevents privilege escalation.

## Diagnostics

```bash
# Check running containers
docker ps | grep -E 'searxng|camofox'

# Individual health checks
curl -s http://localhost:9377/health   # Camofox
curl -s http://localhost:8080/health   # SearXNG
```
