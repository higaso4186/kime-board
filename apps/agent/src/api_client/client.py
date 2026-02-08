from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from src.api_client import endpoints as ep
from src.auth.oidc import build_agent_token_header
from src.models.schemas import (
    GetDecisionResponse,
    GetMeetingResponse,
    GetMessageResponse,
    ListDecisionsResponse,
)


class ApiClient:
    def __init__(
        self,
        base_url: str,
        callback_token: str,
        timeout_seconds: float = 30.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._callback_headers = build_agent_token_header(callback_token)
        self._http = httpx.AsyncClient(timeout=timeout_seconds)

    async def close(self) -> None:
        await self._http.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.TransportError, httpx.HTTPStatusError)),
        reraise=True,
    )
    async def _request(self, method: str, path: str, *, params: dict[str, Any] | None = None, json: Any = None, headers: dict[str, str] | None = None) -> Any:
        url = self._base_url + path
        resp = await self._http.request(method, url, params=params, json=json, headers=headers)
        if resp.status_code in (429, 500, 502, 503, 504):
            resp.raise_for_status()
        resp.raise_for_status()
        if not resp.text:
            return {}
        return resp.json()

    async def get_meeting(self, project_id: str, meeting_id: str) -> GetMeetingResponse:
        path = ep.PATH_GET_MEETING.format(project_id=project_id, meeting_id=meeting_id)
        data = await self._request("GET", path)
        return GetMeetingResponse.model_validate(data)

    async def list_candidate_decisions(self, project_id: str, limit: int = 10) -> ListDecisionsResponse:
        path = ep.PATH_LIST_DECISIONS.format(project_id=project_id)
        data = await self._request("GET", path, params={"limit": limit})
        parsed = ListDecisionsResponse.model_validate(data)
        filtered = [d for d in parsed.decisions if getattr(d, "status", "") in {"NEEDS_INFO", "READY_TO_DECIDE", "REOPEN"}]
        return ListDecisionsResponse(decisions=filtered[:limit])

    async def get_decision(self, project_id: str, decision_id: str) -> GetDecisionResponse:
        path = ep.PATH_GET_DECISION.format(project_id=project_id, decision_id=decision_id)
        data = await self._request("GET", path)
        return GetDecisionResponse.model_validate(data)

    async def get_message(self, thread_id: str, message_id: str) -> GetMessageResponse:
        path = ep.PATH_GET_MESSAGE.format(thread_id=thread_id, message_id=message_id)
        data = await self._request("GET", path)
        return GetMessageResponse.model_validate(data)

    async def post_meeting_log(self, project_id: str, meeting_id: str, line: str) -> dict[str, Any]:
        path = ep.PATH_MEETING_LOG.format(project_id=project_id, meeting_id=meeting_id)
        return await self._request("POST", path, json={"line": line})

    async def post_callback(self, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", ep.PATH_CALLBACK, json=payload, headers=self._callback_headers)

    async def create_decision(self, project_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        path = ep.PATH_CREATE_DECISION.format(project_id=project_id)
        return await self._request("POST", path, json=payload)

    async def patch_decision(self, project_id: str, decision_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        path = ep.PATH_PATCH_DECISION.format(project_id=project_id, decision_id=decision_id)
        return await self._request("PATCH", path, json=payload)

    async def link_meeting_to_decision(self, project_id: str, decision_id: str, meeting_id: str) -> dict[str, Any]:
        path = ep.PATH_LINK_MEETING.format(project_id=project_id, decision_id=decision_id)
        return await self._request("POST", path, json={"meetingId": meeting_id})

    async def create_thread_if_needed(self, project_id: str, decision_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        path = ep.PATH_CREATE_THREAD.format(project_id=project_id, decision_id=decision_id)
        body = payload or {"channel": "IN_APP"}
        return await self._request("POST", path, json=body)

    async def post_message(self, thread_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        path = ep.PATH_POST_MESSAGE.format(thread_id=thread_id)
        return await self._request("POST", path, json=payload)

    async def create_actions_bulk(self, project_id: str, decision_id: str, actions: list[dict[str, Any]]) -> dict[str, Any]:
        path = ep.PATH_ACTIONS_BULK.format(project_id=project_id, decision_id=decision_id)
        return await self._request("POST", path, json={"actions": actions})

    async def notify_in_app(self, project_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        path = ep.PATH_NOTIFY.format(project_id=project_id)
        return await self._request("POST", path, json=payload)
