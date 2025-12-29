.PHONY: install test run docker-build docker-run clean lint typecheck

# Install dependencies
install:
	poetry install

# Run tests
test:
	poetry run pytest

# Run server
run:
	@VERSION=$$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/'); \
	GUIDR_VERSION=$$VERSION poetry run guidr-server

# Lint with ruff
lint:
	poetry run ruff check .

# Type check with mypy
typecheck:
	poetry run mypy server.py

# Build Docker image
docker-build:
	docker build -t guidr-test-server:latest .

# Build Docker image with version
docker-build-version:
	@echo "Building Docker image with version..."
	@VERSION=$$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/'); \
	docker build -t guidr-test-server:$$VERSION --build-arg GUIDR_VERSION=$$VERSION .

# Run Docker container
docker-run:
	docker run -p 8000:8000 guidr-test-server:latest

# Clean build artifacts
clean:
	rm -rf __pycache__ .pytest_cache .ruff_cache .mypy_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Help
help:
	@echo "Available targets:"
	@echo "  install             Install dependencies with Poetry"
	@echo "  test                Run tests with pytest"
	@echo "  run                 Run the server"
	@echo "  lint                Run ruff linter"
	@echo "  typecheck           Run mypy type checker"
	@echo "  docker-build        Build Docker image (latest)"
	@echo "  docker-build-version Build Docker image with version from pyproject.toml"
	@echo "  docker-run          Run Docker container"
	@echo "  clean               Clean build artifacts"
	@echo "  help                Show this help message"
