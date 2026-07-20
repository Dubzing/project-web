# Projects

A small self-hosted project and task tracker for one user.

The application is packaged as **one Docker container**:

- Vite builds the React frontend.
- FastAPI serves both the frontend and `/api`.
- SQLite stores all data in one persistent Docker volume.

There is no MongoDB service, frontend runtime configuration, CORS setup, or separate web server to maintain.

## Start

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://YOUR_DOCKER_SERVER:8080`.

To use another host port, edit `.env`:

```env
APP_PORT=8090
```

## Reverse proxy

Point your existing reverse proxy to:

```text
http://YOUR_DOCKER_SERVER:8080
```

The application itself only uses HTTP. Keep TLS certificates and HTTPS termination in your existing reverse proxy.

No special headers, WebSocket settings, path rewrites, or CORS rules are needed. Proxy the complete domain root to the container.

## Update

Replace the source files, then rebuild:

```bash
docker compose up -d --build
```

The database is stored separately in the named volume `projects_app_data`, so rebuilding or replacing the container does not remove your projects.

## Logs and status

```bash
docker compose ps
docker compose logs -f projects
```

Health endpoint:

```text
/api/health
```

Interactive API documentation remains available at:

```text
/docs
```

## Backup

Stop the app briefly and archive the data volume:

```bash
docker compose stop
docker run --rm \
  -v projects_app_data:/data:ro \
  -v "$PWD":/backup \
  alpine:3.22 \
  tar czf /backup/projects-backup.tar.gz -C /data .
docker compose start
```

## Restore

```bash
docker compose down
docker run --rm \
  -v projects_app_data:/data \
  -v "$PWD":/backup:ro \
  alpine:3.22 \
  sh -c 'rm -rf /data/* && tar xzf /backup/projects-backup.tar.gz -C /data'
docker compose up -d
```

## Reset all data

This permanently deletes the SQLite database:

```bash
docker compose down -v
docker compose up -d
```

## Local development without Docker

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to the backend on port 8000 during development.

## Data format change

This simplified version uses SQLite instead of MongoDB. Existing data from a previously deployed MongoDB instance is not migrated automatically. A fresh installation needs no migration.
