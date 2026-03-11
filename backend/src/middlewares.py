import logging
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("debug_middleware")

class DebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # === Логируем запрос ===
        logger.info(f"Request: {request.method} {request.url}")
        logger.info(f"Headers: {dict(request.headers)}")

        # Читаем тело запроса (только если есть)
        body = await request.body()
        if body:
            try:
                # Пытаемся распарсить как JSON для красивого вывода
                logger.info(f"Request body: {json.loads(body)}")
            except:
                logger.info(f"Request body (raw): {body}")

        # Пропускаем запрос дальше
        response = await call_next(request)

        # === Логируем ответ ===
        # Ответ нужно скопировать, так как оригинальный response.body_iterator будет исчерпан
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk

        logger.info(f"Response status: {response.status_code}")
        logger.info(f"Response headers: {dict(response.headers)}")
        if response_body:
            try:
                logger.info(f"Response body: {json.loads(response_body)}")
            except:
                logger.info(f"Response body (raw): {response_body}")

        # Возвращаем новый ответ с тем же содержимым
        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )