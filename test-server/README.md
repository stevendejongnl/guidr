# Guidr Test Server

A simple Python FastAPI server for local testing of the Guidr mobile app.

## Features

- In-memory storage (data resets on restart)
- Full CRUD operations for all domain entities
- Pre-loaded example data (cooking guide)
- CORS enabled for React Native
- Interactive API documentation

## Setup

1. Create a virtual environment:
```bash
cd test-server
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Quick Start (Recommended)

```bash
./run.sh
```

The `run.sh` script will automatically:
- Create a virtual environment if it doesn't exist
- Install dependencies
- Start the server

### Manual Start

```bash
source venv/bin/activate  # Activate virtual environment
python server.py
```

The server will start on `http://localhost:8000`

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc
- Health check: http://localhost:8000

## Authentication

The server provides a mock authentication endpoint for testing the app's login flow.

### Test Credentials

| Email | Password |
|-------|----------|
| test@example.com | password123 |
| admin@guidr.com | admin123 |

### Login Endpoint

**POST /login**

Request:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Success Response (200):
```json
{
  "token": "mock-jwt-test@example.com-1735041234.567",
  "email": "test@example.com"
}
```

Error Response (401):
```json
{
  "detail": "Invalid email or password"
}
```

Example with curl:
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

## Example Data

The server initializes with:
- 2 categories: "Cooking" (root), "Recipes" (child)
- 1 guide: "Perfect Pasta" with 3 steps
- 3 steps: "Boil water" (5 min), "Add pasta" (1 min), "Cook pasta" (8 min)

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

## Testing with curl

```bash
# Health check
curl http://localhost:8000

# Get all categories
curl http://localhost:8000/categories

# Get a specific guide
curl http://localhost:8000/guides/guide-1

# Get steps for a guide
curl http://localhost:8000/steps/guide/guide-1

# Create a new category
curl -X POST http://localhost:8000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cat-3",
    "name": "Workouts",
    "parentId": null,
    "createdAt": "2025-12-24T10:00:00",
    "updatedAt": "2025-12-24T10:00:00"
  }'
```

## Connecting from the Guidr App

When the app prompts for a server URL on first launch, enter:
- For Android emulator: `http://10.0.2.2:8000`
- For iOS simulator: `http://localhost:8000`
- For physical device on same network: `http://<your-computer-ip>:8000`

## Notes

- Data is stored in memory and will be lost when the server restarts
- The server runs on port 8000 by default
- CORS is configured to allow all origins for development
- All timestamps use ISO 8601 format
