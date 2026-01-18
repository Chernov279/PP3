import asyncio
import logging

import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.auth.router import auth

routers = [auth]


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
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return application


app = get_application()


@app.on_event("startup")
async def startup_event():
    logger.info("Event Startup ended")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Event shutdown ended")

if __name__ == "__main__":
    uvicorn.run("backend.src.main:app", host="0.0.0.0", reload=True)