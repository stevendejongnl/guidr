from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pydantic_settings import BaseSettings
from typing import Optional, List
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from enum import Enum
from pathlib import Path
import os
import tomllib
import uvicorn
import uuid
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

# ==================
# Configuration
# ==================

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "guidr_test"
    jwt_secret_key: str = "dev-secret-key-change-in-production-min-32-characters"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 10080  # 7 days
    guidr_version: str = "0.1.0"
    root_path: str = ""

    class Config:
        env_file = ".env.local"
        env_file_encoding = "utf-8"

settings = Settings()
VERSION = os.getenv("GUIDR_VERSION", settings.guidr_version)
ROOT_PATH = settings.root_path

# ==================
# Database Connection
# ==================

mongodb_client: Optional[AsyncIOMotorClient] = None
mongodb_database: Optional[AsyncIOMotorDatabase] = None

# ==================
# Authentication Utilities
# ==================

password_hasher = PasswordHasher(
    time_cost=2,        # Number of iterations
    memory_cost=65536,  # 64 MB
    parallelism=1,      # Single thread (sufficient for FastAPI async)
    hash_len=32,        # 32 bytes output
    salt_len=16         # 16 bytes salt
)

def hash_password(password: str) -> str:
    """Hash password using Argon2"""
    return password_hasher.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against Argon2 hash"""
    try:
        password_hasher.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.jwt_expiration_minutes))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

# ==================
# Database Utilities
# ==================

def document_to_model(doc: Optional[dict]) -> Optional[dict]:
    """Convert MongoDB document to API model format"""
    if doc is None:
        return None
    doc.pop('_id', None)  # Remove MongoDB internal ID
    # Convert datetime to ISO string
    for key in ['created_at', 'updated_at', 'started_at', 'completed_at']:
        if key in doc and isinstance(doc[key], datetime):
            doc[key] = doc[key].isoformat()
    return doc

def generate_id() -> str:
    """Generate UUID for application entities"""
    return str(uuid.uuid4())

# ==================
# FastAPI Application Setup
# ==================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager for startup/shutdown events"""
    # Startup
    global mongodb_client, mongodb_database
    print(f"Connecting to MongoDB at {settings.mongodb_url}")
    mongodb_client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb_database = mongodb_client[settings.mongodb_database]

    # Ensure indexes
    await ensure_indexes()

    # Initialize example data if collections are empty
    await init_example_data()

    print("MongoDB connected successfully")

    yield

    # Shutdown
    if mongodb_client:
        mongodb_client.close()
        print("MongoDB connection closed")

app = FastAPI(title="Guidr Test Server", version=VERSION, root_path=ROOT_PATH, lifespan=lifespan)

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    token: str
    email: str
    id: str

class UserModel(BaseModel):
    id: str
    email: str
    password: str
    createdAt: str
    updatedAt: str

# Configuration Models
class ServerConfigResponse(BaseModel):
    debugMode: bool
    minAppVersion: Optional[str] = None
    maxAppVersion: Optional[str] = None

# Test credentials for authentication
TEST_CREDENTIALS = {
    "test@example.com": "password123",
    "admin@guidr.com": "admin123"
}

# Data Models
class CategoryModel(BaseModel):
    id: str
    name: str
    parentId: Optional[str] = None
    createdAt: str
    updatedAt: str

class GuideModel(BaseModel):
    id: str
    categoryId: str
    title: str
    description: Optional[str] = None
    stepIds: List[str] = []
    createdAt: str
    updatedAt: str

class StepModel(BaseModel):
    id: str
    guideId: str
    order: int
    title: str
    description: Optional[str] = None
    duration: int
    createdAt: str
    updatedAt: str

class SessionStatus(str, Enum):
    NotStarted = "NotStarted"
    InProgress = "InProgress"
    Paused = "Paused"
    Completed = "Completed"
    Cancelled = "Cancelled"

class SessionModel(BaseModel):
    id: str
    guideId: str
    status: SessionStatus
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    currentStepId: Optional[str] = None
    createdAt: str
    updatedAt: str

# ==================
# Database Index Management
# ==================

async def ensure_indexes():
    """Create MongoDB indexes for all collections"""
    if mongodb_database is None:
        return

    print("Creating database indexes...")

    # Users collection indexes
    await mongodb_database.users.create_index("id", unique=True)
    await mongodb_database.users.create_index("email", unique=True)

    # Categories collection indexes
    await mongodb_database.categories.create_index("id", unique=True)
    await mongodb_database.categories.create_index("parent_id")

    # Guides collection indexes
    await mongodb_database.guides.create_index("id", unique=True)
    await mongodb_database.guides.create_index("category_id")

    # Steps collection indexes
    await mongodb_database.steps.create_index("id", unique=True)
    await mongodb_database.steps.create_index([("guide_id", 1), ("order", 1)])

    # Sessions collection indexes
    await mongodb_database.sessions.create_index("id", unique=True)
    await mongodb_database.sessions.create_index("guide_id")
    await mongodb_database.sessions.create_index("status")

    print("Database indexes created successfully")

# ==================
# Example Data Initialization
# ==================

async def init_example_data():
    """Initialize database with example data if empty (idempotent)"""
    if mongodb_database is None:
        return

    # Check if already initialized
    categories_count = await mongodb_database.categories.count_documents({})
    if categories_count > 0:
        print("Database already contains data, skipping initialization")
        return

    print("Initializing database with example data...")
    now = datetime.utcnow()

    # Example categories
    cat1_id = "cat-1"
    cat2_id = "cat-2"

    await mongodb_database.categories.insert_many([
        {
            "id": cat1_id,
            "name": "Cooking",
            "parent_id": None,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": cat2_id,
            "name": "Recipes",
            "parent_id": cat1_id,
            "created_at": now,
            "updated_at": now
        }
    ])

    # Example guide
    guide1_id = "guide-1"
    await mongodb_database.guides.insert_one({
        "id": guide1_id,
        "category_id": cat2_id,
        "title": "Perfect Pasta",
        "description": "How to cook perfect pasta every time",
        "step_ids": ["step-1", "step-2", "step-3"],
        "created_at": now,
        "updated_at": now
    })

    # Example steps
    await mongodb_database.steps.insert_many([
        {
            "id": "step-1",
            "guide_id": guide1_id,
            "order": 0,
            "title": "Boil water",
            "description": "Fill pot with water and bring to a rolling boil",
            "duration": 300,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "step-2",
            "guide_id": guide1_id,
            "order": 1,
            "title": "Add pasta",
            "description": "Add pasta to boiling water with salt",
            "duration": 60,
            "created_at": now,
            "updated_at": now
        },
        {
            "id": "step-3",
            "guide_id": guide1_id,
            "order": 2,
            "title": "Cook pasta",
            "description": "Cook according to package directions",
            "duration": 480,
            "created_at": now,
            "updated_at": now
        }
    ])

    print("Example data initialized successfully")

# Health check
@app.get("/")
def read_root():
    return {
        "name": "Guidr Test Server",
        "version": VERSION,
        "status": "running",
        "endpoints": {
            "config": "/config",
            "login": "/login",
            "register": "/register",
            "categories": "/categories",
            "guides": "/guides",
            "steps": "/steps",
            "sessions": "/sessions"
        }
    }

# Configuration endpoints
@app.get("/config", response_model=ServerConfigResponse)
def get_server_config():
    """
    Get server configuration including debug mode flag and app version requirements.

    Debug mode is always enabled for the test server to allow developers
    to access debug screens with cache clearing and diagnostics.

    Version fields:
    - minAppVersion: Read from default-configuration.toml if present, can be overridden
    - maxAppVersion: Always set to the current server version (VERSION env var or default)

    When set, clients with versions outside the range will be prompted to update.
    """
    min_version = None

    # Try multiple config paths: Docker container path, then local development path
    config_paths = [
        Path("/app/default-configuration.toml"),  # Docker container
        Path(__file__).parent.parent / "default-configuration.toml",  # Local development
        Path(__file__).parent / "default-configuration.toml",  # Same directory fallback
    ]

    for config_path in config_paths:
        if config_path.exists():
            with open(config_path, "rb") as f:
                config = tomllib.load(f)
                min_version = config.get("server", {}).get("minAppVersion")
            break

    # maxAppVersion is always the current server version
    max_version = VERSION

    return ServerConfigResponse(
        debugMode=True,
        minAppVersion=min_version,
        maxAppVersion=max_version
    )

# Authentication endpoints
@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email and password.

    Checks registered users first, then falls back to test credentials.

    Test credentials:
    - test@example.com / password123
    - admin@guidr.com / admin123
    """
    # Check registered users first
    email_lower = request.email.lower()
    user_doc = await mongodb_database.users.find_one({"email": email_lower})

    if user_doc:
        # Verify password hash
        if verify_password(request.password, user_doc["password_hash"]):
            # Generate real JWT token
            token_data = {"sub": user_doc["email"], "user_id": user_doc["id"]}
            token = create_access_token(token_data)
            return LoginResponse(token=token, email=user_doc["email"])
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    # Fall back to test credentials for development
    if request.email in TEST_CREDENTIALS:
        if TEST_CREDENTIALS[request.email] == request.password:
            # Generate real JWT token for test users
            token_data = {"sub": request.email, "user_id": "test-user"}
            token = create_access_token(token_data)
            return LoginResponse(token=token, email=request.email)

    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/register", response_model=RegisterResponse, status_code=201)
async def register(request: RegisterRequest):
    """
    Register a new user with email and password.

    Returns auth token and user data for immediate login.
    """
    # Check for duplicate email (case-insensitive)
    email_lower = request.email.lower()
    existing_user = await mongodb_database.users.find_one({"email": email_lower})

    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create new user with hashed password
    user_id = generate_id()
    now = datetime.utcnow()
    password_hash = hash_password(request.password)

    user_doc = {
        "id": user_id,
        "email": email_lower,
        "password_hash": password_hash,
        "created_at": now,
        "updated_at": now
    }

    await mongodb_database.users.insert_one(user_doc)

    # Generate real JWT token for auto-login
    token_data = {"sub": email_lower, "user_id": user_id}
    token = create_access_token(token_data)

    return RegisterResponse(token=token, email=email_lower, id=user_id)

# Category endpoints
@app.get("/categories", response_model=List[CategoryModel])
async def get_categories():
    cursor = mongodb_database.categories.find({})
    categories_list = []
    async for doc in cursor:
        cat_dict = document_to_model(doc)
        categories_list.append(CategoryModel(
            id=cat_dict["id"],
            name=cat_dict["name"],
            parentId=cat_dict.get("parent_id"),
            createdAt=cat_dict["created_at"],
            updatedAt=cat_dict["updated_at"]
        ))
    return categories_list

@app.get("/categories/{category_id}", response_model=CategoryModel)
async def get_category(category_id: str):
    doc = await mongodb_database.categories.find_one({"id": category_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
    cat_dict = document_to_model(doc)
    return CategoryModel(
        id=cat_dict["id"],
        name=cat_dict["name"],
        parentId=cat_dict.get("parent_id"),
        createdAt=cat_dict["created_at"],
        updatedAt=cat_dict["updated_at"]
    )

@app.get("/categories/parent/{parent_id}", response_model=List[CategoryModel])
async def get_categories_by_parent(parent_id: str):
    if parent_id == "null":
        query = {"parent_id": None}
    else:
        query = {"parent_id": parent_id}

    cursor = mongodb_database.categories.find(query)
    categories_list = []
    async for doc in cursor:
        cat_dict = document_to_model(doc)
        categories_list.append(CategoryModel(
            id=cat_dict["id"],
            name=cat_dict["name"],
            parentId=cat_dict.get("parent_id"),
            createdAt=cat_dict["created_at"],
            updatedAt=cat_dict["updated_at"]
        ))
    return categories_list

@app.post("/categories", response_model=CategoryModel, status_code=201)
async def create_category(category: CategoryModel):
    now = datetime.utcnow()
    cat_doc = {
        "id": category.id,
        "name": category.name,
        "parent_id": category.parentId,
        "created_at": now,
        "updated_at": now
    }
    await mongodb_database.categories.insert_one(cat_doc)
    return category

@app.put("/categories/{category_id}", response_model=CategoryModel)
async def update_category(category_id: str, category: CategoryModel):
    existing = await mongodb_database.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")

    now = datetime.utcnow()
    cat_doc = {
        "id": category.id,
        "name": category.name,
        "parent_id": category.parentId,
        "created_at": existing["created_at"],
        "updated_at": now
    }
    await mongodb_database.categories.replace_one({"id": category_id}, cat_doc)
    return category

@app.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: str):
    result = await mongodb_database.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
    return None

# Guide endpoints
@app.get("/guides", response_model=List[GuideModel])
async def get_guides():
    cursor = mongodb_database.guides.find({})
    guides_list = []
    async for doc in cursor:
        guide_dict = document_to_model(doc)
        guides_list.append(GuideModel(
            id=guide_dict["id"],
            categoryId=guide_dict["category_id"],
            title=guide_dict["title"],
            description=guide_dict.get("description"),
            stepIds=guide_dict.get("step_ids", []),
            createdAt=guide_dict["created_at"],
            updatedAt=guide_dict["updated_at"]
        ))
    return guides_list

@app.get("/guides/{guide_id}", response_model=GuideModel)
async def get_guide(guide_id: str):
    doc = await mongodb_database.guides.find_one({"id": guide_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")
    guide_dict = document_to_model(doc)
    return GuideModel(
        id=guide_dict["id"],
        categoryId=guide_dict["category_id"],
        title=guide_dict["title"],
        description=guide_dict.get("description"),
        stepIds=guide_dict.get("step_ids", []),
        createdAt=guide_dict["created_at"],
        updatedAt=guide_dict["updated_at"]
    )

@app.get("/guides/category/{category_id}", response_model=List[GuideModel])
async def get_guides_by_category(category_id: str):
    cursor = mongodb_database.guides.find({"category_id": category_id})
    guides_list = []
    async for doc in cursor:
        guide_dict = document_to_model(doc)
        guides_list.append(GuideModel(
            id=guide_dict["id"],
            categoryId=guide_dict["category_id"],
            title=guide_dict["title"],
            description=guide_dict.get("description"),
            stepIds=guide_dict.get("step_ids", []),
            createdAt=guide_dict["created_at"],
            updatedAt=guide_dict["updated_at"]
        ))
    return guides_list

@app.post("/guides", response_model=GuideModel, status_code=201)
async def create_guide(guide: GuideModel):
    now = datetime.utcnow()
    guide_doc = {
        "id": guide.id,
        "category_id": guide.categoryId,
        "title": guide.title,
        "description": guide.description,
        "step_ids": guide.stepIds,
        "created_at": now,
        "updated_at": now
    }
    await mongodb_database.guides.insert_one(guide_doc)
    return guide

@app.put("/guides/{guide_id}", response_model=GuideModel)
async def update_guide(guide_id: str, guide: GuideModel):
    existing = await mongodb_database.guides.find_one({"id": guide_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")

    now = datetime.utcnow()
    guide_doc = {
        "id": guide.id,
        "category_id": guide.categoryId,
        "title": guide.title,
        "description": guide.description,
        "step_ids": guide.stepIds,
        "created_at": existing["created_at"],
        "updated_at": now
    }
    await mongodb_database.guides.replace_one({"id": guide_id}, guide_doc)
    return guide

@app.delete("/guides/{guide_id}", status_code=204)
async def delete_guide(guide_id: str):
    result = await mongodb_database.guides.delete_one({"id": guide_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")
    return None

# Step endpoints
@app.get("/steps", response_model=List[StepModel])
async def get_steps():
    cursor = mongodb_database.steps.find({})
    steps_list = []
    async for doc in cursor:
        step_dict = document_to_model(doc)
        steps_list.append(StepModel(
            id=step_dict["id"],
            guideId=step_dict["guide_id"],
            order=step_dict["order"],
            title=step_dict["title"],
            description=step_dict.get("description"),
            duration=step_dict["duration"],
            createdAt=step_dict["created_at"],
            updatedAt=step_dict["updated_at"]
        ))
    return steps_list

@app.get("/steps/{step_id}", response_model=StepModel)
async def get_step(step_id: str):
    doc = await mongodb_database.steps.find_one({"id": step_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")
    step_dict = document_to_model(doc)
    return StepModel(
        id=step_dict["id"],
        guideId=step_dict["guide_id"],
        order=step_dict["order"],
        title=step_dict["title"],
        description=step_dict.get("description"),
        duration=step_dict["duration"],
        createdAt=step_dict["created_at"],
        updatedAt=step_dict["updated_at"]
    )

@app.get("/steps/guide/{guide_id}", response_model=List[StepModel])
async def get_steps_by_guide(guide_id: str):
    cursor = mongodb_database.steps.find({"guide_id": guide_id}).sort("order", 1)
    steps_list = []
    async for doc in cursor:
        step_dict = document_to_model(doc)
        steps_list.append(StepModel(
            id=step_dict["id"],
            guideId=step_dict["guide_id"],
            order=step_dict["order"],
            title=step_dict["title"],
            description=step_dict.get("description"),
            duration=step_dict["duration"],
            createdAt=step_dict["created_at"],
            updatedAt=step_dict["updated_at"]
        ))
    return steps_list

@app.post("/steps", response_model=StepModel, status_code=201)
async def create_step(step: StepModel):
    now = datetime.utcnow()
    step_doc = {
        "id": step.id,
        "guide_id": step.guideId,
        "order": step.order,
        "title": step.title,
        "description": step.description,
        "duration": step.duration,
        "created_at": now,
        "updated_at": now
    }
    await mongodb_database.steps.insert_one(step_doc)
    return step

@app.put("/steps/{step_id}", response_model=StepModel)
async def update_step(step_id: str, step: StepModel):
    existing = await mongodb_database.steps.find_one({"id": step_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")

    now = datetime.utcnow()
    step_doc = {
        "id": step.id,
        "guide_id": step.guideId,
        "order": step.order,
        "title": step.title,
        "description": step.description,
        "duration": step.duration,
        "created_at": existing["created_at"],
        "updated_at": now
    }
    await mongodb_database.steps.replace_one({"id": step_id}, step_doc)
    return step

@app.delete("/steps/{step_id}", status_code=204)
async def delete_step(step_id: str):
    result = await mongodb_database.steps.delete_one({"id": step_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")
    return None

# Session endpoints
@app.get("/sessions", response_model=List[SessionModel])
async def get_sessions():
    cursor = mongodb_database.sessions.find({})
    sessions_list = []
    async for doc in cursor:
        session_dict = document_to_model(doc)
        sessions_list.append(SessionModel(
            id=session_dict["id"],
            guideId=session_dict["guide_id"],
            status=SessionStatus(session_dict["status"]),
            startedAt=session_dict.get("started_at"),
            completedAt=session_dict.get("completed_at"),
            currentStepId=session_dict.get("current_step_id"),
            createdAt=session_dict["created_at"],
            updatedAt=session_dict["updated_at"]
        ))
    return sessions_list

@app.get("/sessions/{session_id}", response_model=SessionModel)
async def get_session(session_id: str):
    doc = await mongodb_database.sessions.find_one({"id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
    session_dict = document_to_model(doc)
    return SessionModel(
        id=session_dict["id"],
        guideId=session_dict["guide_id"],
        status=SessionStatus(session_dict["status"]),
        startedAt=session_dict.get("started_at"),
        completedAt=session_dict.get("completed_at"),
        currentStepId=session_dict.get("current_step_id"),
        createdAt=session_dict["created_at"],
        updatedAt=session_dict["updated_at"]
    )

@app.get("/sessions/guide/{guide_id}", response_model=List[SessionModel])
async def get_sessions_by_guide(guide_id: str):
    cursor = mongodb_database.sessions.find({"guide_id": guide_id})
    sessions_list = []
    async for doc in cursor:
        session_dict = document_to_model(doc)
        sessions_list.append(SessionModel(
            id=session_dict["id"],
            guideId=session_dict["guide_id"],
            status=SessionStatus(session_dict["status"]),
            startedAt=session_dict.get("started_at"),
            completedAt=session_dict.get("completed_at"),
            currentStepId=session_dict.get("current_step_id"),
            createdAt=session_dict["created_at"],
            updatedAt=session_dict["updated_at"]
        ))
    return sessions_list

@app.get("/sessions/status/{status}", response_model=List[SessionModel])
async def get_sessions_by_status(status: SessionStatus):
    cursor = mongodb_database.sessions.find({"status": status.value})
    sessions_list = []
    async for doc in cursor:
        session_dict = document_to_model(doc)
        sessions_list.append(SessionModel(
            id=session_dict["id"],
            guideId=session_dict["guide_id"],
            status=SessionStatus(session_dict["status"]),
            startedAt=session_dict.get("started_at"),
            completedAt=session_dict.get("completed_at"),
            currentStepId=session_dict.get("current_step_id"),
            createdAt=session_dict["created_at"],
            updatedAt=session_dict["updated_at"]
        ))
    return sessions_list

@app.post("/sessions", response_model=SessionModel, status_code=201)
async def create_session(session: SessionModel):
    now = datetime.utcnow()
    session_doc = {
        "id": session.id,
        "guide_id": session.guideId,
        "status": session.status.value,
        "started_at": session.startedAt,
        "completed_at": session.completedAt,
        "current_step_id": session.currentStepId,
        "created_at": now,
        "updated_at": now
    }
    await mongodb_database.sessions.insert_one(session_doc)
    return session

@app.put("/sessions/{session_id}", response_model=SessionModel)
async def update_session(session_id: str, session: SessionModel):
    existing = await mongodb_database.sessions.find_one({"id": session_id})
    if not existing:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")

    now = datetime.utcnow()
    session_doc = {
        "id": session.id,
        "guide_id": session.guideId,
        "status": session.status.value,
        "started_at": session.startedAt,
        "completed_at": session.completedAt,
        "current_step_id": session.currentStepId,
        "created_at": existing["created_at"],
        "updated_at": now
    }
    await mongodb_database.sessions.replace_one({"id": session_id}, session_doc)
    return session

@app.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str):
    result = await mongodb_database.sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
    return None

def main():
    print("\n" + "="*60)
    print("Guidr Test Server Starting")
    print("="*60)
    print(f"Version: {VERSION}")
    print("Server will be available at: http://localhost:8000")
    print("Android emulator URL: http://10.0.2.2:8000")
    print("API documentation: http://localhost:8000/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
