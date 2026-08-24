from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import get_db
from .routers import alerts, auth, incidents, trips, tourist, users, zones


app = FastAPI(
    title="Smart Tourist Safety API",
    description="Backend API for the Smart Tourist Safety System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Smart Tourist Safety API is running"
    }


@app.get("/health/database")
def database_health(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "result": result.scalar()
    }


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(trips.router)
app.include_router(zones.router)
app.include_router(incidents.router)
app.include_router(alerts.router)
app.include_router(tourist.router)
