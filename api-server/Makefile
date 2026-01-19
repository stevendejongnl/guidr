.PHONY: install lock test run docker-build docker-run clean lint typecheck up up-detached down logs build ps restart help

# Install dependencies
install:
	uv sync

lock:
	uv lock

# Run tests
test:
	uv run pytest

# Start all services with docker-compose
up:
	docker compose up --build -d

# Stop all services
down:
	docker compose down

# View logs from all services
logs:
	docker compose logs -f

# Build docker-compose services
build:
	docker compose build

# Show running services
ps:
	docker compose ps

# Restart all services
restart:
	docker compose restart

# Run server locally with UV
run:
	@VERSION=$$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/'); \
	GUIDR_VERSION=$$VERSION uv run guidr-server

# Lint with ruff
lint:
	uv run ruff check .

# Type check with mypy
typecheck:
	uv run mypy src/

# Build Docker image
docker-build:
	docker build -t guidr-api-server:latest -f Dockerfile ..

# Build Docker image with version
docker-build-version:
	@echo "Building Docker image with version..."
	@VERSION=$$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/'); \
	docker build -t guidr-api-server:$$VERSION --build-arg GUIDR_VERSION=$$VERSION -f Dockerfile ..

# Run Docker container
docker-run:
	docker run -p 8000:8000 guidr-api-server:latest

# Clean build artifacts
clean:
	rm -rf __pycache__ .pytest_cache .ruff_cache .mypy_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Help
help:
	@echo "Available targets:"
	@echo ""
	@echo "Docker Compose (recommended):"
	@echo "  up                  Start all services (MongoDB + api-server) with docker-compose"
	@echo "  up-detached         Start all services in background"
	@echo "  down                Stop all services"
	@echo "  logs                View logs from all services"
	@echo "  build               Build docker-compose services"
	@echo "  ps                  Show running services"
	@echo "  restart             Restart all services"
	@echo ""
	@echo "Local Development:"
	@echo "  install             Install dependencies with UV"
	@echo "  run                 Run server locally with UV (requires MongoDB running)"
	@echo "  test                Run tests with pytest"
	@echo "  lint                Run ruff linter"
	@echo "  typecheck           Run mypy type checker"
	@echo ""
	@echo "Docker (standalone):"
	@echo "  docker-build        Build Docker image (latest)"
	@echo "  docker-build-version Build Docker image with version from pyproject.toml"
	@echo "  docker-run          Run Docker container"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean               Clean build artifacts"
	@echo "  help                Show this help message"
