from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "mimsiui"
    mimsibot_db_path: str = "/opt/mimsibot/data/tasks.db"
    mimsibot_root: str = "/opt/mimsibot"


settings = Settings()

