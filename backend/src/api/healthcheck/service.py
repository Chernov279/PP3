import logging
from typing import Any

import anyio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


logger = logging.getLogger(__name__)


class HealthService:
    def __init__(self, db_session: AsyncSession):
        self._db_session = db_session

    async def check_db(self) -> bool:
        try:
            await self._db_session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error("Healthcheck DB failed: %s", e)
            return False

    async def check_minio(self) -> bool:
        try:
            from backend.src.database.s3.storage_service import S3StorageService
            S3StorageService()
            return True
        except Exception as e:
            logger.error("Healthcheck MinIO failed: %s", e)
            return False

    async def get_status(self) -> dict[str, Any]:
        
        db_ok = await self.check_db()
        minio_ok = await self.check_minio()

        all_ok = db_ok and minio_ok

        return {
            "status": "ok" if all_ok else "degraded",
            "checks": {
                "database": "ok" if db_ok else "fail",
                "storage": "ok" if minio_ok else "fail",
            },
        }
