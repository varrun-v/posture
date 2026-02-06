from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://posture_user:posture_pass@localhost:5432/posture_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    # CORS
    cors_origins: list[str] = ["*"]
    
    # SMTP / Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    emails_from_email: str | None = "posturemonitor@example.com"
    emails_to_email: str | None = None  # Default recipient for reports
    
    # App
    app_name: str = "Posture Monitor API"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
