# Guidr Test Server

A FastAPI-based test server for local development and testing of the Guidr mobile app.

## Features

- In-memory storage (data resets on restart)
- Full CRUD operations for all domain entities (Categories, Guides, Steps, Sessions)
- Pre-loaded example data (cooking guide)
- Mock authentication for testing login flows
- CORS enabled for React Native development
- Interactive API documentation (Swagger/ReDoc)
- Docker support for easy deployment

## Version Compatibility

The test-server version is synchronized with the main Guidr app version to ensure client-server compatibility. Always use matching versions:

| Test Server | Guidr App | Notes |
|------------|-----------|-------|
| 0.x.x | 0.x.x | Early development |
| 1.x.x | 1.x.x | Stable API |
| 2.x.x | 2.x.x | Breaking changes |

---

## Quick Start (Docker - Recommended)

### Pull and Run from GitHub Container Registry

```bash
# Pull latest version
docker pull ghcr.io/stevendejongnl/guidr-test-server:latest

# Run server
docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-test-server:latest
```

**Available at**: http://localhost:8000

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  guidr-test-server:
    image: ghcr.io/stevendejongnl/guidr-test-server:latest
    ports:
      - "8000:8000"
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

---

## Local Development Setup

### Prerequisites

- **Python**: 3.12 or newer
- **Poetry**: 1.8+ ([installation guide](https://python-poetry.org/docs/#installation))

### Installation

1. Install dependencies:
```bash
cd test-server
poetry install
```

2. Run the server:
```bash
poetry run guidr-server
```

**Alternative**:
```bash
poetry shell  # Activate virtual environment
python server.py
```

### Development Commands

```bash
# Install dependencies
poetry install

# Run server
poetry run guidr-server

# Run tests (when implemented)
poetry run pytest

# Lint code
poetry run ruff check .

# Type check
poetry run mypy server.py

# Add a new dependency
poetry add <package-name>

# Add a dev dependency
poetry add --group dev <package-name>

# Update dependencies
poetry update
```

### Using Makefile

```bash
# Install dependencies
make install

# Run server
make run

# Run tests
make test

# Lint code
make lint

# Type check
make typecheck

# Build Docker image
make docker-build

# Run Docker container
make docker-run

# Clean build artifacts
make clean

# Show all available commands
make help
```

---

## Docker Development

### Build Locally

```bash
cd test-server

# Build with current version
docker build -t guidr-test-server:dev .

# Build with specific version
docker build -t guidr-test-server:1.2.3 --build-arg GUIDR_VERSION=1.2.3 .

# Run locally built image
docker run -p 8000:8000 guidr-test-server:dev
```

### Using Docker Compose for Development

```bash
cd test-server
docker-compose up --build
```

---

## API Documentation

Once running, visit:
- **Interactive docs (Swagger)**: http://localhost:8000/docs
- **Alternative docs (ReDoc)**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000

---

## Authentication

The server provides a mock authentication endpoint for testing.

### Test Credentials

| Email | Password |
|-------|----------|
| test@example.com | password123 |
| admin@guidr.com | admin123 |

### Login Endpoint

**POST /login**

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Success Response (200)**:
```json
{
  "token": "mock-jwt-test@example.com-1735041234.567",
  "email": "test@example.com"
}
```

**Error Response (401)**:
```json
{
  "detail": "Invalid email or password"
}
```

---

## Example Data

The server initializes with:
- 2 categories: "Cooking" (root), "Recipes" (child)
- 1 guide: "Perfect Pasta" with 3 steps
- 3 steps: "Boil water" (5 min), "Add pasta" (1 min), "Cook pasta" (8 min)

---

## API Endpoints

### Authentication
- `POST /login` - Authenticate user with email and password

### Categories
- `GET /categories` - List all categories
- `GET /categories/{id}` - Get category by ID
- `GET /categories/parent/{parentId}` - Get categories by parent (use "null" for root)
- `POST /categories` - Create category
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Delete category

### Guides
- `GET /guides` - List all guides
- `GET /guides/{id}` - Get guide by ID
- `GET /guides/category/{categoryId}` - Get guides by category
- `POST /guides` - Create guide
- `PUT /guides/{id}` - Update guide
- `DELETE /guides/{id}` - Delete guide

### Steps
- `GET /steps` - List all steps
- `GET /steps/{id}` - Get step by ID
- `GET /steps/guide/{guideId}` - Get steps by guide (sorted by order)
- `POST /steps` - Create step
- `PUT /steps/{id}` - Update step
- `DELETE /steps/{id}` - Delete step

### Sessions
- `GET /sessions` - List all sessions
- `GET /sessions/{id}` - Get session by ID
- `GET /sessions/guide/{guideId}` - Get sessions by guide
- `GET /sessions/status/{status}` - Get sessions by status
- `POST /sessions` - Create session
- `PUT /sessions/{id}` - Update session
- `DELETE /sessions/{id}` - Delete session

---

## Connecting from Guidr App

When the app prompts for a server URL on first launch:

| Environment | Server URL |
|------------|------------|
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://localhost:8000` |
| Physical device (same network) | `http://<your-computer-ip>:8000` |
| Docker container on same machine | `http://localhost:8000` |

**Finding your computer's IP**:
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

---

## Docker Image Tags

Images are published to GitHub Container Registry with multiple tags:

| Tag | Description | Example |
|-----|-------------|---------|
| `latest` | Most recent version | `ghcr.io/stevendejongnl/guidr-test-server:latest` |
| `<version>` | Full semantic version | `ghcr.io/stevendejongnl/guidr-test-server:1.2.3` |
| `<major>.<minor>` | Major.minor version | `ghcr.io/stevendejongnl/guidr-test-server:1.2` |
| `<major>` | Major version only | `ghcr.io/stevendejongnl/guidr-test-server:1` |

### Pulling Specific Versions

```bash
# Latest version (recommended for development)
docker pull ghcr.io/stevendejongnl/guidr-test-server:latest

# Specific version (recommended for production)
docker pull ghcr.io/stevendejongnl/guidr-test-server:1.2.3

# Latest in major version 1
docker pull ghcr.io/stevendejongnl/guidr-test-server:1
```

---

## Production Deployment

### Using Docker Run

```bash
# Pull latest version
docker pull ghcr.io/stevendejongnl/guidr-test-server:latest

# Run with restart policy
docker run -d \
  --name guidr-test-server \
  -p 8000:8000 \
  --restart unless-stopped \
  ghcr.io/stevendejongnl/guidr-test-server:latest
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  guidr-test-server:
    image: ghcr.io/stevendejongnl/guidr-test-server:latest
    container_name: guidr-test-server
    ports:
      - "8000:8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Deploy:
```bash
docker-compose up -d
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GUIDR_VERSION` | `0.1.0` | Server version (set automatically in Docker image) |

---

## Development Workflow

### Making Changes

1. Edit `server.py`
2. Test locally:
   ```bash
   poetry run guidr-server
   ```
3. Build Docker image:
   ```bash
   docker build -t guidr-test-server:dev .
   ```
4. Test Docker image:
   ```bash
   docker run -p 8000:8000 guidr-test-server:dev
   ```

### Release Process

The test-server version is automatically updated when the main Guidr app is released:

1. Commit changes to `main` branch using [conventional commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new endpoint"
   ```
2. Push to GitHub:
   ```bash
   git push origin main
   ```
3. Semantic-release automatically:
   - Determines new version based on commits
   - Updates `package.json`, iOS, Android, and `test-server/pyproject.toml`
   - Creates git tag (e.g., `v1.2.3`)
   - Publishes GitHub Release
4. Docker workflow automatically triggers:
   - Builds Docker image with new version
   - Publishes to GitHub Container Registry
   - Tags with version and `latest`

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Docker Image Not Found

Ensure the package is public:
1. Go to https://github.com/stevendejongnl/guidr/pkgs/container/guidr-test-server
2. Click "Package settings"
3. Change visibility to "Public"

### Version Mismatch

Always use matching versions of test-server and Guidr app:
```bash
# Check app version
cat package.json | grep version

# Check test-server version
cat test-server/pyproject.toml | grep version

# Pull matching Docker image
docker pull ghcr.io/stevendejongnl/guidr-test-server:<version>
```

### Poetry Installation Issues

If Poetry is not installed:
```bash
# Install Poetry (Unix/macOS)
curl -sSL https://install.python-poetry.org | python3 -

# Install Poetry (Windows PowerShell)
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -

# Add Poetry to PATH
export PATH="$HOME/.local/bin:$PATH"  # Add to ~/.bashrc or ~/.zshrc
```

---

## Legacy Files

The following files are deprecated and will be removed in a future version:

- `run.sh` - Use `poetry run guidr-server` or `make run` instead
- `requirements.txt` - Dependencies managed by Poetry in `pyproject.toml`

---

## Notes

- Data is stored in memory and will be lost when the server restarts
- The server runs on port 8000 by default
- CORS is configured to allow all origins for development
- All timestamps use ISO 8601 format
- Docker images are multi-platform (linux/amd64, linux/arm64)
- JWT tokens are mock tokens for testing only

---

## Contributing

When adding new features to the test-server:

1. Update `server.py` with new endpoints
2. Add tests (when test infrastructure is set up)
3. Update this README with new API endpoints
4. Follow conventional commits for version management
5. Test locally with Poetry and Docker before committing

## License

See the main Guidr project LICENSE file.
