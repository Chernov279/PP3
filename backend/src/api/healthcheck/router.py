from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.api.healthcheck.service import HealthService
from backend.src.database.connection import get_db_session

health = APIRouter(prefix="/health", tags=["Health"])


def get_health_service(
    db_session: AsyncSession = Depends(get_db_session),
) -> HealthService:
    return HealthService(db_session)


@health.get("/live", summary="API работает (без проверки зависимостей)")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@health.get("/db", summary="Проверка подключения к PostgreSQL")
async def health_db(
    response: Response,
    service: HealthService = Depends(get_health_service),
) -> dict[str, str]:
    db_ok = await service.check_db()

    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if db_ok else "fail",
        "check": "database",
    }


@health.get("/minio", summary="Проверка подключения к MinIO")
async def health_minio(
    response: Response,
    service: HealthService = Depends(get_health_service),
) -> dict[str, str]:
    minio_ok = await service.check_minio()

    if not minio_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if minio_ok else "fail",
        "check": "S3 storage",
    }


@health.get("", summary="Полная проверка (БД + MinIO)")
async def health_full(
    response: Response,
    service: HealthService = Depends(get_health_service),
) -> dict:
    result = await service.get_status()

    if result["status"] != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return result