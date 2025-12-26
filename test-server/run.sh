#!/bin/bash

# Simple startup script for the Guidr test server

echo ""
echo "========================================================================"
echo "⚠️  DEPRECATED: This script is deprecated and will be removed soon."
echo "========================================================================"
echo ""
echo "Please use Poetry commands instead:"
echo "  poetry install"
echo "  poetry run guidr-server"
echo ""
echo "Or use Docker (recommended for deployment):"
echo "  docker pull ghcr.io/stevendejongnl/guidr-test-server:latest"
echo "  docker run -p 8000:8000 ghcr.io/stevendejongnl/guidr-test-server:latest"
echo ""
echo "Or use Make commands:"
echo "  make install"
echo "  make run"
echo ""
echo "========================================================================"
echo "Continuing with legacy startup..."
echo "========================================================================"
echo ""

echo "Starting Guidr Test Server..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start the server
python server.py
