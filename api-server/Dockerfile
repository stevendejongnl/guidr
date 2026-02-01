# Stage 1: Build Web App
FROM node:24-slim AS web-builder

WORKDIR /app

# Copy root files for npm workspaces
COPY package*.json ./
COPY scripts ./scripts
COPY shared/package*.json ./shared/
COPY shared/src ./shared/src
COPY shared/tsconfig.json ./shared/
COPY mobile/ ./mobile/
COPY web-app ./web-app

# Install dependencies with workspace support
# Use npm install (not npm ci) to ensure optional dependencies are installed for the
# current architecture. npm ci skips optional deps in some cases, causing issues like
# "Cannot find module @rollup/rollup-linux-arm64-gnu" on ARM64 builds.
# The --workspaces flag installs @guidr/shared, mobile, and web-app dependencies.
# This is required because the web-app package depends on @guidr/shared from the workspace.
# See: docs/CI_CD_TROUBLESHOOTING.md#issue-docker-build-fails
RUN npm install --workspaces

# Build web app
RUN npm run web:build

# Stage 2: Build Python Dependencies
FROM python:3.12-slim AS python-builder

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependency files
COPY api-server/pyproject.toml api-server/uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev --no-install-project

# Stage 3: Runtime - Minimal image
FROM python:3.12-slim

# Copy UV from builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy installed packages from python-builder
COPY --from=python-builder /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY api-server/src ./src
# Copy config from root (if needed)
COPY default-configuration.toml .

# Copy built web app from web-builder
COPY --from=web-builder /app/web-app/dist ./web-app/dist

# Set version as build argument (injected during build)
ARG GUIDR_VERSION=0.1.0
ENV GUIDR_VERSION=${GUIDR_VERSION}

# Expose port
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run server with uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
