# Projects

A small self-hosted project and task tracker designed for a single user.

The application runs as one Docker container:

- Vite builds the React frontend.
- FastAPI serves the frontend and the `/api` routes.
- SQLite stores all application data.
- Docker Compose persists the database in a named volume.

There is no MongoDB container, separate frontend container, runtime CORS configuration, or external web server inside the stack.

## Requirements

- Docker Engine
- Docker Compose v2
- Portainer is optional
- An existing reverse proxy is optional

## Repository layout

```text
project-web/
├── backend/
├── frontend/
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

React files that contain JSX use the `.jsx` extension. Do not rename them back to `.js`, because Vite will fail to parse JSX stored in `.js` files.

Examples:

```text
frontend/src/App.jsx
frontend/src/index.jsx
frontend/src/components/TaskCard.jsx
frontend/src/pages/Dashboard.jsx
```

## Quick start with Docker Compose

Clone the repository:

```bash
git clone https://github.com/Dubzing/project-web.git
cd project-web
```

Create the environment file:

```bash
cp .env.example .env
```

Build and start the application:

```bash
docker compose up -d --build
```

Open:

```text
http://YOUR_DOCKER_SERVER:8080
```

The default host port is configured in `.env`:

```env
APP_PORT=8080
```

Change that value if port `8080` is already in use.

## Deploy with Portainer

In Portainer:

1. Open the target Docker environment.
2. Go to **Stacks**.
3. Select **Add stack**.
4. Choose **Git repository**.
5. Enter the repository details below.

```text
Repository URL: https://github.com/Dubzing/project-web.git
Repository reference: refs/heads/main
Compose path: docker-compose.yml
```

6. Add this environment variable if you want to override the default port:

```text
APP_PORT=8080
```

7. Select **Deploy the stack**.

The stack builds the image directly from the repository using the root `Dockerfile`.

### Updating through Portainer

After pushing changes to GitHub:

1. Open the stack in Portainer.
2. Select **Update the stack** or **Pull and redeploy**.
3. Enable pulling the latest repository changes.
4. Rebuild and redeploy the stack.

The SQLite database is stored in the named volume `projects_app_data`, so replacing the container does not delete application data.

## Reverse proxy

Point the reverse proxy upstream to:

```text
http://YOUR_DOCKER_SERVER:8080
```

The application itself uses plain HTTP. Keep HTTPS and certificate handling in the existing reverse proxy.

No path rewriting, CORS configuration, or WebSocket settings are required. Proxy the entire domain root to the container.

Example:

```text
projects.example.com -> http://192.168.1.50:8080
```

## Verify the deployment

Check the running service:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs --tail=100 projects
```

Follow logs continuously:

```bash
docker compose logs -f projects
```

Test the health endpoint:

```bash
curl http://127.0.0.1:8080/api/health
```

Expected response:

```json
{"status":"ok"}
```

Test the frontend:

```bash
curl -I http://127.0.0.1:8080/
```

Interactive FastAPI documentation is available at:

```text
http://YOUR_DOCKER_SERVER:8080/docs
```

## Update from the Docker server CLI

From the cloned repository directory:

```bash
git pull --ff-only
docker compose up -d --build
```

For a completely clean rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

Check the result:

```bash
docker compose ps
docker compose logs --tail=100 projects
```

## Stop or remove the Compose deployment

Stop and remove the container and Compose network while preserving the database:

```bash
docker compose down
```

Also remove the locally built image:

```bash
docker compose down --rmi local
```

Delete the container, network, image, and database volume:

```bash
docker compose down --volumes --rmi local
```

Warning: `--volumes` permanently deletes the SQLite database stored in `projects_app_data`.

## Data persistence

The Compose stack mounts this named volume:

```text
projects_app_data
```

The SQLite database is stored inside the container at:

```text
/data/projects.db
```

Inspect the volume:

```bash
docker volume inspect projects_app_data
```

Inspect the database directory from the running container:

```bash
docker compose exec projects ls -lah /data
```

## Backup

Stop the application briefly and archive the data volume:

```bash
docker compose stop

docker run --rm \
  -v projects_app_data:/data:ro \
  -v "$PWD":/backup \
  alpine:3.22 \
  tar czf /backup/projects-backup.tar.gz -C /data .
docker compose start
```

The backup file will be created in the current directory:

```text
projects-backup.tar.gz
```

## Restore

Place `projects-backup.tar.gz` in the repository directory, then run:

```bash
docker compose down

docker run --rm \
  -v projects_app_data:/data \
  -v "$PWD":/backup:ro \
  alpine:3.22 \
  sh -c 'rm -rf /data/* && tar xzf /backup/projects-backup.tar.gz -C /data'

docker compose up -d
```

## Reset all application data

This permanently deletes the SQLite database:

```bash
docker compose down -v
docker compose up -d --build
```

## Local development without Docker

### Backend

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

On Windows PowerShell, activate the virtual environment with:

```powershell
.venv\Scripts\Activate.ps1
```

### Frontend

Run this in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to the backend on port `8000` during development.

## Frontend build troubleshooting

Test only the frontend Docker build stage:

```bash
docker build \
  --no-cache \
  --progress=plain \
  --target frontend-build \
  -t projects-frontend-test .
```

Save the full output to a log:

```bash
docker build \
  --no-cache \
  --progress=plain \
  --target frontend-build \
  -t projects-frontend-test . 2>&1 | tee frontend-build.log
```

Inspect the last lines:

```bash
tail -n 100 frontend-build.log
```

### JSX filename requirement

A previous deployment failed with an error similar to:

```text
Failed to parse source for import analysis because the content contains invalid JS syntax.
If you are using JSX, make sure to name the file with the .jsx or .tsx extension.
```

This happens when React JSX is stored in files ending in `.js`.

Find `.js` files that may still contain JSX:

```bash
grep -RIl --include="*.js" -E '<[A-Z][A-Za-z0-9]*|</[A-Za-z]' frontend/src
```

The command should return no files.

React source files containing JSX must use `.jsx`, and `frontend/index.html` must load:

```html
<script type="module" src="/src/index.jsx"></script>
```

When renaming files in Git, use `git mv` so the changes are committed correctly:

```bash
git mv frontend/src/App.js frontend/src/App.jsx
```

Then commit and push all renames:

```bash
git add -A
git commit -m "Rename React JSX files"
git push origin main
```

## Portainer troubleshooting

### Compose file not found

If Portainer reports:

```text
open .../docker-compose.yml: no such file or directory
```

Confirm the stack uses this exact Compose path:

```text
docker-compose.yml
```

Also confirm the repository URL does not contain a trailing `#`:

```text
https://github.com/Dubzing/project-web.git
```

### Portainer appears to use old files

Portainer and Docker may reuse an existing Git checkout or build layers. First try **Update the stack** with the latest repository changes and a rebuild.

If it still uses old source files:

1. Delete the stack without deleting `projects_app_data`.
2. Create a new Git-based stack.
3. Use `refs/heads/main` and `docker-compose.yml`.
4. Deploy again.

To rule out Portainer entirely, clone the repository directly on the Docker server and run:

```bash
docker compose build --no-cache
docker compose up -d
```

## Architecture

The Dockerfile uses two stages:

1. Node builds the Vite frontend into `/frontend/dist`.
2. Python installs the backend, copies the compiled frontend into `/app/static`, and starts FastAPI with Uvicorn.

FastAPI serves:

```text
/       React application
/api    API routes
/docs   Interactive API documentation
```

## Data format

This version uses SQLite instead of MongoDB. Existing data from an older MongoDB-based deployment is not migrated automatically.
