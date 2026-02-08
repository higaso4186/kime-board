from fastapi import HTTPException, Request
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token


def _bearer_token(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return auth.split(" ", 1)[1].strip()


def verify_task_request(request: Request, mode: str, expected_token: str | None, audience: str | None) -> None:
    auth_mode = (mode or "NONE").upper()

    if auth_mode == "NONE":
        return

    if auth_mode == "TOKEN":
        got = request.headers.get("x-task-token")
        if not expected_token or got != expected_token:
            raise HTTPException(status_code=401, detail="Invalid task token")
        return

    if auth_mode == "OIDC":
        token = _bearer_token(request)
        req = google_requests.Request()
        try:
            # If audience is None, google-auth validates issuer/signature only.
            id_token.verify_oauth2_token(token, req, audience=audience)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=401, detail=f"Invalid OIDC token: {exc}") from exc
        return

    raise HTTPException(status_code=500, detail=f"Unsupported TASK_AUTH_MODE: {mode}")


def build_agent_token_header(agent_callback_token: str) -> dict[str, str]:
    if not agent_callback_token:
        return {}
    return {"X-Agent-Token": agent_callback_token}
