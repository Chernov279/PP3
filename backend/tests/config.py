from pydantic import computed_field
from pydantic_settings import BaseSettings

from backend.src.database.connection import DatabaseHelper


class SettingsForTests(BaseSettings):
    TEST_POSTGRES_DB: str = "postgres"
    TEST_POSTGRES_HOST: str = "localhost"
    TEST_POSTGRES_USER: str = "postgres"
    TEST_POSTGRES_PASSWORD: str = "postgres"
    TEST_POSTGRES_PORT: int = 5432


    @computed_field
    @property
    def TEST_POSTGRES_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.TEST_POSTGRES_USER}:{self.TEST_POSTGRES_PASSWORD}"
            f"@{self.TEST_POSTGRES_HOST}:{self.TEST_POSTGRES_PORT}/{self.TEST_POSTGRES_DB}"
        )

    @computed_field
    @property
    def TEST_POSTGRES_URL_SYNC(self) -> str:
        return (
            f"postgresql+psycopg2://{self.TEST_POSTGRES_USER}:{self.TEST_POSTGRES_PASSWORD}"
            f"@{self.TEST_POSTGRES_HOST}:{self.TEST_POSTGRES_PORT}/{self.TEST_POSTGRES_DB}"
        )

test_settings = SettingsForTests() # type: ignore
test_db_helper = DatabaseHelper(url=test_settings.TEST_POSTGRES_URL, echo=True)