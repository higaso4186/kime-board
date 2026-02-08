from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    api_base_url: str = Field(default="http://localhost:3001", alias="API_BASE_URL")
    api_audience: str = Field(default="http://localhost:3001", alias="API_AUDIENCE")
    agent_callback_token: str = Field(default="", alias="AGENT_CALLBACK_TOKEN")

    task_auth_mode: str = Field(default="NONE", alias="TASK_AUTH_MODE")
    task_oidc_audience: str | None = Field(default=None, alias="TASK_OIDC_AUDIENCE")
    task_token: str | None = Field(default=None, alias="TASK_TOKEN")

    vertex_model: str = Field(default="gemini-2.5-flash", alias="VERTEX_MODEL")

    max_context_decisions: int = Field(default=10, alias="MAX_CONTEXT_DECISIONS")
    max_output_tokens_structurer: int = Field(default=2048, alias="MAX_OUTPUT_TOKENS_STRUCTURER")
    max_output_tokens_questioner: int = Field(default=1024, alias="MAX_OUTPUT_TOKENS_QUESTIONER")
    max_output_tokens_actions: int = Field(default=1024, alias="MAX_OUTPUT_TOKENS_ACTIONS")

    temperature_structurer: float = Field(default=0.2, alias="TEMPERATURE_STRUCTURER")
    temperature_questioner: float = Field(default=0.2, alias="TEMPERATURE_QUESTIONER")
    temperature_actions: float = Field(default=0.4, alias="TEMPERATURE_ACTIONS")

    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    safe_mode: bool = Field(default=True, alias="SAFE_MODE")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
