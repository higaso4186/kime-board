from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request

from src.agents.root_agent import KimeboardRootAgent
from src.agents.workflows.draft_actions_skill import DraftActionsSkillWorkflow
from src.agents.workflows.meeting_structurer import MeetingStructurerWorkflow
from src.agents.workflows.reply_integrator import ReplyIntegratorWorkflow
from src.api_client.client import ApiClient
from src.auth.oidc import verify_task_request
from src.config import Settings, get_settings
from src.models.schemas import (
    TaskDraftActionsRequest,
    TaskMeetingStructurerRequest,
    TaskReplyIntegratorRequest,
)
from src.observability.logger import configure_logging, get_logger
from src.tools.kimeboard_api_tools import KimeboardApiToolset
from src.utils.idempotency import InMemoryIdempotencyStore


class AgentApp:
    def __init__(self, settings: Settings) -> None:
        configure_logging(settings.log_level)
        self.logger = get_logger("kimeboard-agent")
        self.settings = settings

        self.client = ApiClient(
            base_url=settings.api_base_url,
            callback_token=settings.agent_callback_token,
        )
        self.tools = KimeboardApiToolset(self.client)
        self.idempotency = InMemoryIdempotencyStore(ttl_minutes=180)

        self.root_agent = KimeboardRootAgent(
            meeting_structurer=MeetingStructurerWorkflow(self.tools, settings, self.logger),
            reply_integrator=ReplyIntegratorWorkflow(self.tools, settings, self.logger),
            draft_actions=DraftActionsSkillWorkflow(self.tools, settings, self.logger),
            idempotency_store=self.idempotency,
            logger=self.logger,
        )

    async def shutdown(self) -> None:
        await self.client.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    state = AgentApp(settings)
    app.state.agent = state
    try:
        yield
    finally:
        await state.shutdown()


app = FastAPI(title="kimeboard-agent", version="0.1.0", lifespan=lifespan)


def _authorize_task(request: Request, settings: Settings) -> None:
    verify_task_request(
        request=request,
        mode=settings.task_auth_mode,
        expected_token=settings.task_token,
        audience=settings.task_oidc_audience,
    )


@app.get("/healthz")
async def healthz(request: Request):
    state: AgentApp = request.app.state.agent
    return {
        "ok": True,
        "service": "kimeboard-agent",
        "taskAuthMode": state.settings.task_auth_mode,
    }


@app.post("/tasks/meeting_structurer")
async def task_meeting_structurer(payload: TaskMeetingStructurerRequest, request: Request):
    state: AgentApp = request.app.state.agent
    _authorize_task(request, state.settings)
    try:
        out = await state.root_agent.run_meeting_structurer(payload)
        return {"ok": True, **out}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        state.logger.exception("task_meeting_structurer_failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/tasks/reply_integrator")
async def task_reply_integrator(payload: TaskReplyIntegratorRequest, request: Request):
    state: AgentApp = request.app.state.agent
    _authorize_task(request, state.settings)
    try:
        out = await state.root_agent.run_reply_integrator(payload)
        return {"ok": True, **out}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        state.logger.exception("task_reply_integrator_failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/tasks/draft_actions_skill")
async def task_draft_actions_skill(payload: TaskDraftActionsRequest, request: Request):
    state: AgentApp = request.app.state.agent
    _authorize_task(request, state.settings)
    try:
        out = await state.root_agent.run_draft_actions(payload)
        return {"ok": True, **out}
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        state.logger.exception("task_draft_actions_failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
