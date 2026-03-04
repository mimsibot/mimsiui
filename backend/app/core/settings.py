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
    auth_admin_subjects_raw: str = ""
    auth_admin_emails_raw: str = ""
    auth_metadata_ttl_seconds: int = 300
    bridge_source: str = "mimsiui"
    auth_require_email_verified: bool = True
    trusted_hosts_raw: str = ""
    force_https: bool = False

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins_raw.split(",") if item.strip()]

    @property
    def trusted_hosts(self) -> list[str]:
        hosts = [item.strip().rstrip(".") for item in self.trusted_hosts_raw.split(",") if item.strip()]
        for default_host in ("localhost", "127.0.0.1", "testserver"):
            if default_host not in hosts:
                hosts.append(default_host)
        return hosts

    @property
    def auth_admin_subjects(self) -> list[str]:
        return [item.strip() for item in self.auth_admin_subjects_raw.split(",") if item.strip()]

    @property
    def auth_admin_emails(self) -> list[str]:
        return [item.strip().lower() for item in self.auth_admin_emails_raw.split(",") if item.strip()]


settings = Settings()
