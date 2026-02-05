from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://posture_user:posture_pass@localhost:5432/posture_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # API
    api_v1_prefix: str = "/api/v1"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # App
    app_name: str = "Posture Monitor API"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
