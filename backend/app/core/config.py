from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Financial Dashboard API"
    jwt_secret_key: str = "dev-secret-key-change"  # replace in production
    jwt_algorithm: str = "HS256"
    jwt_access_token_expires_minutes: int = 60 * 4
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Gemini API configuration
    gemini_api_key: str = ""  # Set via environment variable GEMINI_API_KEY
    gemini_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"


settings = Settings()
