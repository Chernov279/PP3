import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("api")

IGNORED_PATHS = {"/health", "/health/live", "/docs", "/openapi.json", "/redoc"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        request.state.request_id = request_id

        start = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.exception(
                "[%s] %s %s -> 500 (%.2f ms)",
                request_id,
                request.method,
                request.url.path,
                duration_ms,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        status_code = response.status_code

        response.headers["X-Request-ID"] = request_id

        if request.url.path in IGNORED_PATHS and status_code < 400:
            return response

        log_line = "[%s] %s %s -> %s (%.2f ms)"
        args = (request_id, request.method, request.url.path, status_code, duration_ms)

        if status_code >= 500:
            logger.error(log_line, *args)
        elif status_code >= 400:
            logger.warning(log_line, *args)
        else:
            logger.info(log_line, *args)

        return response
    