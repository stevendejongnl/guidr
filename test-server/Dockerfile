# Stage 1: Builder - Install dependencies
FROM python:3.12-slim AS builder

# Install Poetry
RUN pip install --no-cache-dir poetry==1.8.2

WORKDIR /app

# Copy dependency files
COPY test-server/pyproject.toml test-server/poetry.lock* ./

# Configure Poetry for Docker
RUN poetry config virtualenvs.create false

# Install dependencies only
RUN poetry install --no-dev --no-interaction --no-ansi

# Stage 2: Runtime - Minimal image
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY test-server/src ./src
# Copy config from root (if needed)
COPY default-configuration.toml .

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
