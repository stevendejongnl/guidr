# Guidr Test Server

A FastAPI-based test server for local development and testing of the Guidr mobile app.

## Features

- **MongoDB persistence** - Full data persistence across restarts
- **Real authentication** - Argon2 password hashing + JWT tokens
- **Full CRUD operations** for all domain entities (Categories, Guides, Steps, Sessions)
- **Pre-loaded example data** - Cooking guide with 2 categories, 1 guide, 3 steps
- **CORS enabled** for React Native development
- **Interactive API documentation** (Swagger/ReDoc)
- **Docker support** with Docker Compose for easy deployment
- **Kubernetes ready** with secret management

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

## MongoDB Configuration

The test-server requires MongoDB for data persistence. You have several options:

### Option 1: Local MongoDB (Docker Compose - Recommended)

The included `docker-compose.yml` sets up both MongoDB and the test-server:

```bash
cd test-server
docker-compose up
```

This starts:
- **MongoDB** on port 27017
- **Test Server** on port 8000
- **Mongo Express** (optional UI) on port 8081

**Accessing Mongo Express**:
- URL: http://localhost:8081
- Username: `admin`
- Password: `admin123`

### Option 2: MongoDB Atlas (Cloud)

For production or remote development, use MongoDB Atlas:

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/guidr_test`)
3. Set environment variables (see below)

### Option 3: Local MongoDB Installation

Install MongoDB locally:

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0

# Ubuntu/Debian
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Verify
mongosh --eval "db.version()"
```

### Environment Variables

Create `.env.local` in the `test-server` directory:

```bash
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017  # or your Atlas connection string
MONGODB_DATABASE=guidr_test

# JWT Configuration (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET_KEY=your-generated-secret-key-min-32-characters
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080  # 7 days

# Application
GUIDR_VERSION=1.15.3
```

**Generate a secure JWT secret**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**For Docker Compose**: Environment variables are set in `docker-compose.yml`

**For Kubernetes**: Use Kubernetes Secrets (see Production Deployment section)

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

The server provides **real authentication** with Argon2 password hashing and JWT tokens.

### Security Features

- **Password Hashing**: Argon2 (time_cost=2, memory_cost=64MB)
- **JWT Tokens**: Real JWT with HS256 algorithm
- **Token Expiration**: 7 days (configurable)
- **Secure Storage**: Passwords stored as Argon2 hashes in MongoDB

### Test Credentials

For development, the following test credentials are available (even without database):

| Email | Password |
|-------|----------|
| test@example.com | password123 |
| admin@guidr.com | admin123 |

### Registration Endpoint

**POST /register**

```bash
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "securepassword"}'
```

**Success Response (201)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "newuser@example.com",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6InRlc3QtdXNlciIsImV4cCI6MTczNTY0NzIzNCwiaWF0IjoxNzM1MDQyNDM0fQ.signature",
  "email": "test@example.com"
}
```

**Error Response (401)**:
```json
{
  "detail": "Invalid email or password"
}
```

### JWT Token Structure

Tokens contain:
- `sub`: User email
- `user_id`: User UUID
- `exp`: Expiration timestamp
- `iat`: Issued at timestamp

**Decoding a JWT** (for debugging):
```bash
# Using jwt.io or
python -c "from jose import jwt; print(jwt.decode('YOUR_TOKEN', 'YOUR_SECRET', algorithms=['HS256']))"
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
- `POST /register` - Register new user (returns JWT token for auto-login)

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

### Using Kubernetes

The test-server includes Kubernetes manifests for production deployment with Nginx Ingress.

**Prerequisites**:
1. MongoDB instance (MongoDB Atlas recommended)
2. Kubernetes cluster with Nginx Ingress installed

**Step 1: Create MongoDB Secret**

First, generate a JWT secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Then create a Kubernetes secret with your MongoDB connection string:

```bash
# Create secret from template
cp mongodb-secret.yaml mongodb-secret-production.yaml

# Edit the file and replace placeholder values:
# - mongodb-url: Your MongoDB Atlas connection string
# - jwt-secret-key: The generated JWT secret

# Apply the secret
kubectl apply -f mongodb-secret-production.yaml -n guidr

# IMPORTANT: Never commit mongodb-secret-production.yaml to git!
```

**Alternative: Create secret from command line**:
```bash
kubectl create secret generic guidr-mongodb-secret \
  --from-literal=mongodb-url='mongodb+srv://user:pass@cluster.mongodb.net/guidr_test?retryWrites=true&w=majority' \
  --from-literal=jwt-secret-key='YOUR_GENERATED_SECRET' \
  -n guidr
```

**Step 2: Deploy Application**:
```bash
# Using the simple manifest (default namespace)
kubectl apply -f kubernetes-simple.yaml

# Or with dedicated namespace
kubectl apply -f kubernetes.yaml
```

**Features**:
- 2 replicas for high availability
- Health checks (liveness & readiness probes)
- Resource limits (128Mi-256Mi memory, 100m-500m CPU)
- Path-based routing: `guidr.madebysteven.nl/testing-server`
- Nginx Ingress with URL rewriting

**Check deployment**:
```bash
# Check pods
kubectl get pods -n guidr  # or kubectl get pods for default namespace

# Check service
kubectl get svc -n guidr

# Check ingress
kubectl get ingress -n guidr

# View logs
kubectl logs -f deployment/guidr-test-server -n guidr
```

**Access the server**:
- URL: https://guidr.madebysteven.nl/testing-server
- Health check: https://guidr.madebysteven.nl/testing-server/
- API docs: https://guidr.madebysteven.nl/testing-server/docs

**Update to new version**:
```bash
# Update image to specific version
kubectl set image deployment/guidr-test-server test-server=ghcr.io/stevendejongnl/guidr-test-server:1.5.0 -n guidr

# Or restart to pull latest
kubectl rollout restart deployment/guidr-test-server -n guidr
```

**Scale replicas**:
```bash
# Scale up
kubectl scale deployment/guidr-test-server --replicas=3 -n guidr

# Scale down
kubectl scale deployment/guidr-test-server --replicas=1 -n guidr
```

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
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DATABASE` | `guidr_test` | MongoDB database name |
| `JWT_SECRET_KEY` | `dev-secret-key-change-in-production-min-32-characters` | JWT signing secret (minimum 32 characters) |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `JWT_EXPIRATION_MINUTES` | `10080` | JWT token expiration (7 days) |
| `GUIDR_VERSION` | `1.15.3` | Server version (set automatically in Docker image) |
| `ROOT_PATH` | `` | FastAPI root path for reverse proxy deployments |

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

- **Data persistence**: All data is stored in MongoDB and persists across server restarts
- **Authentication**: Real JWT tokens with Argon2 password hashing (production-ready)
- **Port**: The server runs on port 8000 by default
- **CORS**: Configured to allow all origins for development
- **Timestamps**: All timestamps use ISO 8601 format
- **Docker images**: Multi-platform support (linux/amd64, linux/arm64)
- **MongoDB UI**: Mongo Express available at http://localhost:8081 when using Docker Compose
- **Security**: Never commit `.env.local` or MongoDB secrets to git

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
