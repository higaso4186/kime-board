from __future__ import annotations

from typing import Any

from src.api_client.client import ApiClient


class KimeboardApiToolset:
    def __init__(self, client: ApiClient) -> None:
        self.client = client

    async def get_meeting(self, project_id: str, meeting_id: str):
        return await self.client.get_meeting(project_id, meeting_id)

    async def get_decision(self, project_id: str, decision_id: str):
        return await self.client.get_decision(project_id, decision_id)

    async def list_candidate_decisions(self, project_id: str, limit: int = 10):
        return await self.client.list_candidate_decisions(project_id, limit)

    async def create_decision(self, project_id: str, payload: dict[str, Any]):
        return await self.client.create_decision(project_id, payload)

    async def upsert_decision(self, project_id: str, decision_id: str, payload: dict[str, Any]):
        return await self.client.patch_decision(project_id, decision_id, payload)

    async def link_meeting_to_decision(self, project_id: str, decision_id: str, meeting_id: str):
        return await self.client.link_meeting_to_decision(project_id, decision_id, meeting_id)

    async def create_thread_if_needed(self, project_id: str, decision_id: str, payload: dict[str, Any] | None = None):
        return await self.client.create_thread_if_needed(project_id, decision_id, payload)

    async def post_question_set(self, thread_id: str, payload: dict[str, Any]):
        return await self.client.post_message(thread_id, payload)

    async def get_message(self, thread_id: str, message_id: str):
        return await self.client.get_message(thread_id, message_id)

    async def post_agent_log(self, project_id: str, meeting_id: str, line: str):
        return await self.client.post_meeting_log(project_id, meeting_id, line)

    async def create_actions_bulk(self, project_id: str, decision_id: str, actions: list[dict[str, Any]]):
        return await self.client.create_actions_bulk(project_id, decision_id, actions)

    async def notify_in_app(self, project_id: str, payload: dict[str, Any]):
        return await self.client.notify_in_app(project_id, payload)

    async def post_callback(self, payload: dict[str, Any]):
        return await self.client.post_callback(payload)
