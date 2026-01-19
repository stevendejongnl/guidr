# Stage 1: Build Web App
FROM node:24-slim AS web-builder

WORKDIR /web-app

# Copy web app files
COPY web-app/package*.json ./
COPY web-app/tsconfig.json ./
COPY web-app/vite.config.ts ./
COPY web-app/index.html ./
COPY web-app/public ./public
COPY web-app/src ./src

# Install and build
RUN npm ci
RUN npm run build

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
COPY --from=web-builder /web-app/dist ./web-app/dist

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
