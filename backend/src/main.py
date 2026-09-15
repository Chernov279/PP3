import asyncio
import logging

from backend.src.middlewares import RequestLoggingMiddleware
import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api.recommendation.router import recommendations
from backend.src.api.films.router import films
from backend.src.api.auth.router import auth
from backend.src.api.users.router import user
from backend.src.api.persons.router import persons
from backend.src.api.genres.router import genres
from backend.src.api.healthcheck.router import health
from backend.src.api.collections.router import collections

routers = [auth, user, films, recommendations, persons, genres, health, collections]


# configure_logging(level="INFO")
logger = logging.getLogger(__name__)


def get_application() -> FastAPI:
    application = FastAPI(
        title="PP3",
        debug=True
    )
    for router in routers:
        application.include_router(router)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://192.168.196.138:3000"],
        
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestLoggingMiddleware)
    
    return application


app = get_application()


@app.on_event("startup")
async def startup_event():
    logger.info("Event Startup ended")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Event shutdown ended")

if __name__ == "__main__":
        uvicorn.run(
        "backend.src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )