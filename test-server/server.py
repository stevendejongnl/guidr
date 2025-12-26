from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum
import os
import uvicorn

VERSION = os.getenv("GUIDR_VERSION", "0.1.0")
app = FastAPI(title="Guidr Test Server", version=VERSION)

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

# In-memory storage
categories: dict[str, CategoryModel] = {}
guides: dict[str, GuideModel] = {}
steps: dict[str, StepModel] = {}
sessions: dict[str, SessionModel] = {}

# Initialize with example data
def init_example_data():
    now = datetime.now().isoformat()

    # Example categories
    categories["cat-1"] = CategoryModel(
        id="cat-1",
        name="Cooking",
        parentId=None,
        createdAt=now,
        updatedAt=now
    )
    categories["cat-2"] = CategoryModel(
        id="cat-2",
        name="Recipes",
        parentId="cat-1",
        createdAt=now,
        updatedAt=now
    )

    # Example guide
    guides["guide-1"] = GuideModel(
        id="guide-1",
        categoryId="cat-2",
        title="Perfect Pasta",
        description="How to cook perfect pasta every time",
        stepIds=["step-1", "step-2", "step-3"],
        createdAt=now,
        updatedAt=now
    )

    # Example steps
    steps["step-1"] = StepModel(
        id="step-1",
        guideId="guide-1",
        order=0,
        title="Boil water",
        description="Fill pot with water and bring to a rolling boil",
        duration=300,
        createdAt=now,
        updatedAt=now
    )
    steps["step-2"] = StepModel(
        id="step-2",
        guideId="guide-1",
        order=1,
        title="Add pasta",
        description="Add pasta to boiling water with salt",
        duration=60,
        createdAt=now,
        updatedAt=now
    )
    steps["step-3"] = StepModel(
        id="step-3",
        guideId="guide-1",
        order=2,
        title="Cook pasta",
        description="Cook according to package directions",
        duration=480,
        createdAt=now,
        updatedAt=now
    )

init_example_data()

# Health check
@app.get("/")
def read_root():
    return {
        "name": "Guidr Test Server",
        "version": VERSION,
        "status": "running",
        "endpoints": {
            "login": "/login",
            "categories": "/categories",
            "guides": "/guides",
            "steps": "/steps",
            "sessions": "/sessions"
        }
    }

# Authentication endpoints
@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """
    Authenticate user with email and password.

    Test credentials:
    - test@example.com / password123
    - admin@guidr.com / admin123
    """
    if request.email not in TEST_CREDENTIALS:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if TEST_CREDENTIALS[request.email] != request.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Generate mock JWT token
    token = f"mock-jwt-{request.email}-{datetime.now().timestamp()}"

    return LoginResponse(token=token, email=request.email)

# Category endpoints
@app.get("/categories", response_model=List[CategoryModel])
def get_categories():
    return list(categories.values())

@app.get("/categories/{category_id}", response_model=CategoryModel)
def get_category(category_id: str):
    if category_id not in categories:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
    return categories[category_id]

@app.get("/categories/parent/{parent_id}", response_model=List[CategoryModel])
def get_categories_by_parent(parent_id: str):
    if parent_id == "null":
        return [c for c in categories.values() if c.parentId is None]
    return [c for c in categories.values() if c.parentId == parent_id]

@app.post("/categories", response_model=CategoryModel, status_code=201)
def create_category(category: CategoryModel):
    categories[category.id] = category
    return category

@app.put("/categories/{category_id}", response_model=CategoryModel)
def update_category(category_id: str, category: CategoryModel):
    if category_id not in categories:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
    categories[category_id] = category
    return category

@app.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: str):
    if category_id not in categories:
        raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
    del categories[category_id]
    return None

# Guide endpoints
@app.get("/guides", response_model=List[GuideModel])
def get_guides():
    return list(guides.values())

@app.get("/guides/{guide_id}", response_model=GuideModel)
def get_guide(guide_id: str):
    if guide_id not in guides:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")
    return guides[guide_id]

@app.get("/guides/category/{category_id}", response_model=List[GuideModel])
def get_guides_by_category(category_id: str):
    return [g for g in guides.values() if g.categoryId == category_id]

@app.post("/guides", response_model=GuideModel, status_code=201)
def create_guide(guide: GuideModel):
    guides[guide.id] = guide
    return guide

@app.put("/guides/{guide_id}", response_model=GuideModel)
def update_guide(guide_id: str, guide: GuideModel):
    if guide_id not in guides:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")
    guides[guide_id] = guide
    return guide

@app.delete("/guides/{guide_id}", status_code=204)
def delete_guide(guide_id: str):
    if guide_id not in guides:
        raise HTTPException(status_code=404, detail=f"Guide with id {guide_id} not found")
    del guides[guide_id]
    return None

# Step endpoints
@app.get("/steps", response_model=List[StepModel])
def get_steps():
    return list(steps.values())

@app.get("/steps/{step_id}", response_model=StepModel)
def get_step(step_id: str):
    if step_id not in steps:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")
    return steps[step_id]

@app.get("/steps/guide/{guide_id}", response_model=List[StepModel])
def get_steps_by_guide(guide_id: str):
    return sorted(
        [s for s in steps.values() if s.guideId == guide_id],
        key=lambda s: s.order
    )

@app.post("/steps", response_model=StepModel, status_code=201)
def create_step(step: StepModel):
    steps[step.id] = step
    return step

@app.put("/steps/{step_id}", response_model=StepModel)
def update_step(step_id: str, step: StepModel):
    if step_id not in steps:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")
    steps[step_id] = step
    return step

@app.delete("/steps/{step_id}", status_code=204)
def delete_step(step_id: str):
    if step_id not in steps:
        raise HTTPException(status_code=404, detail=f"Step with id {step_id} not found")
    del steps[step_id]
    return None

# Session endpoints
@app.get("/sessions", response_model=List[SessionModel])
def get_sessions():
    return list(sessions.values())

@app.get("/sessions/{session_id}", response_model=SessionModel)
def get_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
    return sessions[session_id]

@app.get("/sessions/guide/{guide_id}", response_model=List[SessionModel])
def get_sessions_by_guide(guide_id: str):
    return [s for s in sessions.values() if s.guideId == guide_id]

@app.get("/sessions/status/{status}", response_model=List[SessionModel])
def get_sessions_by_status(status: SessionStatus):
    return [s for s in sessions.values() if s.status == status]

@app.post("/sessions", response_model=SessionModel, status_code=201)
def create_session(session: SessionModel):
    sessions[session.id] = session
    return session

@app.put("/sessions/{session_id}", response_model=SessionModel)
def update_session(session_id: str, session: SessionModel):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
    sessions[session_id] = session
    return session

@app.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"Session with id {session_id} not found")
    del sessions[session_id]
    return None

def main():
    print("\n" + "="*60)
    print("Guidr Test Server Starting")
    print("="*60)
    print(f"Version: {VERSION}")
    print("Server will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
