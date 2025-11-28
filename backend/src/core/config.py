from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str | None = None
    database_host: str = "localhost"
    database_port: str = "5432"
    database_name: str = "app_db"
    database_user: str = "postgres"
    database_password: str | None = None

    # JWT
    secret_key: str = "ackjqxj12381nxgfqcaqofcnh4nw"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    @property
    def full_database_url(self) -> str:
        if self.database_url is not None:
            return self.database_url
        return f"postgresql://{self.database_user}@{self.database_host}:{self.database_port}/{self.database_name}"

    class Config:
        env_file = ".env"


settings = Settings()