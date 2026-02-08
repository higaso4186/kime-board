from __future__ import annotations

from src.agents.workflows.draft_actions_skill import DraftActionsSkillWorkflow
from src.agents.workflows.meeting_structurer import MeetingStructurerWorkflow
from src.agents.workflows.reply_integrator import ReplyIntegratorWorkflow
from src.models.schemas import (
    TaskDraftActionsRequest,
    TaskMeetingStructurerRequest,
    TaskReplyIntegratorRequest,
)
from src.observability.runlog import RunContext, new_run_id
from src.utils.idempotency import InMemoryIdempotencyStore


class KimeboardRootAgent:
    def __init__(
        self,
        meeting_structurer: MeetingStructurerWorkflow,
        reply_integrator: ReplyIntegratorWorkflow,
        draft_actions: DraftActionsSkillWorkflow,
        idempotency_store: InMemoryIdempotencyStore,
        logger,
    ) -> None:
        self.meeting_structurer = meeting_structurer
        self.reply_integrator = reply_integrator
        self.draft_actions = draft_actions
        self.idempotency_store = idempotency_store
        self.logger = logger

    async def run_meeting_structurer(self, task: TaskMeetingStructurerRequest) -> dict:
        key = task.idempotencyKey or task.meetingId
        if self.idempotency_store.seen(f"meeting_structurer:{key}"):
            self.logger.info("idempotent_skip", workflow="meeting_structurer", key=key)
            return {"ok": True, "skipped": True, "reason": "idempotent"}

        run = RunContext(
            run_id=new_run_id(),
            workflow="meeting_structurer",
            project_id=task.projectId,
            meeting_id=task.meetingId,
            idempotency_key=key,
        )
        result = await self.meeting_structurer.run(task, run)
        self.idempotency_store.mark(f"meeting_structurer:{key}")
        return result

    async def run_reply_integrator(self, task: TaskReplyIntegratorRequest) -> dict:
        key = task.idempotencyKey or task.messageId
        if self.idempotency_store.seen(f"reply_integrator:{key}"):
            self.logger.info("idempotent_skip", workflow="reply_integrator", key=key)
            return {"ok": True, "skipped": True, "reason": "idempotent"}

        run = RunContext(
            run_id=new_run_id(),
            workflow="reply_integrator",
            project_id=task.projectId,
            decision_id=task.decisionId,
            idempotency_key=key,
        )
        result = await self.reply_integrator.run(task, run)
        self.idempotency_store.mark(f"reply_integrator:{key}")
        return result

    async def run_draft_actions(self, task: TaskDraftActionsRequest) -> dict:
        key = task.idempotencyKey or task.decisionId
        if self.idempotency_store.seen(f"draft_actions_skill:{key}"):
            self.logger.info("idempotent_skip", workflow="draft_actions_skill", key=key)
            return {"ok": True, "skipped": True, "reason": "idempotent"}

        run = RunContext(
            run_id=new_run_id(),
            workflow="draft_actions_skill",
            project_id=task.projectId,
            decision_id=task.decisionId,
            idempotency_key=key,
        )
        result = await self.draft_actions.run(task, run)
        self.idempotency_store.mark(f"draft_actions_skill:{key}")
        return result
