from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "mimsiui"
    app_env: str = "development"
    mimsibot_db_path: str = "/opt/mimsibot/data/tasks.db"
    mimsibot_root: str = "/opt/mimsibot"
    cors_origins_raw: str = ""
    auth_enabled: bool = True
    auth_issuer: str = ""
    auth_audience: str = ""
    auth_client_id: str = ""
    auth_required_scope: str = "mimsiui.read"
    auth_admin_scope: str = "mimsiui.write"
    auth_metadata_ttl_seconds: int = 300
    bridge_source: str = "mimsiui"

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(",") if item.strip()]


settings = Settings()
