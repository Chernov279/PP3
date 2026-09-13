from typing import ClassVar, Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    __model__: ClassVar[type | None] = None
    _model_columns_cache: ClassVar[list[Any] | None] = None


    @classmethod
    def get_model_columns(cls) -> list[Any]:
        if cls.__model__ is None:
            return []

        if cls._model_columns_cache is not None:
            return cls._model_columns_cache

        cls._model_columns_cache = [
            getattr(cls.__model__, field)
            for field in cls.model_fields
            if hasattr(cls.__model__, field)
        ]
        return cls._model_columns_cache
    
class MultiGetParams(BaseModel):
    limit: int = Field(10, ge=1, le=100)
    page: int = Field(1, ge=1)


class FullMultiGetParams(MultiGetParams):
    sort: Optional[Literal['kp_rating', 'release_date', 'imdb_rating']] = None
    order: Literal['asc', 'desc'] = 'desc'