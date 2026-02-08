from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from src.config import Settings
from src.models.schemas import ActionDraft, DraftActionsCallback, TaskDraftActionsRequest
from src.observability.runlog import RunContext
from src.tools.kimeboard_api_tools import KimeboardApiToolset
from src.utils.limits import MAX_ACTIONS_TOTAL, MAX_EXEC_ACTIONS, MAX_PREP_ACTIONS


class DraftActionsSkillWorkflow:
    def __init__(self, tools: KimeboardApiToolset, settings: Settings, logger) -> None:
        self.tools = tools
        self.settings = settings
        self.logger = logger

    async def run(self, task: TaskDraftActionsRequest, run: RunContext) -> dict[str, Any]:
        try:
            decision_res = await self.tools.get_decision(task.projectId, task.decisionId)
            decision = decision_res.decision

            drafts = self._build_action_drafts(decision)

            callback = DraftActionsCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey,
                kind="draft_actions_skill",
                status="SUCCEEDED",
                decisionId=task.decisionId,
                draftActions=drafts,
            )

            out = await self.tools.post_callback(callback.model_dump(mode="json", exclude_none=True))
            self.logger.info(
                "draft_actions_succeeded",
                run_id=run.run_id,
                project_id=task.projectId,
                decision_id=task.decisionId,
                actions=len(drafts),
            )

            return {"ok": True, "runId": run.run_id, "actions": len(drafts), "callback": out}
        except Exception as exc:  # noqa: BLE001
            self.logger.exception("draft_actions_failed", run_id=run.run_id, project_id=task.projectId)
            failed = DraftActionsCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey,
                kind="draft_actions_skill",
                status="FAILED",
                decisionId=task.decisionId,
                error=str(exc),
                draftActions=[],
            )
            await self.tools.post_callback(failed.model_dump(mode="json", exclude_none=True))
            raise

    def _build_action_drafts(self, decision) -> list[ActionDraft]:
        prep: list[ActionDraft] = []
        execs: list[ActionDraft] = []

        missing = (decision.completeness.missingFields if decision.completeness else []) or []

        if "owner" in missing:
            prep.append(
                ActionDraft(
                    type="PREP",
                    title="Confirm decision owner",
                    description="Align and confirm the final approver candidate",
                )
            )
        if "criteria" in missing:
            prep.append(
                ActionDraft(
                    type="PREP",
                    title="Define decision criteria",
                    description="Document cost, schedule, and quality criteria",
                )
            )
        if "options" in missing:
            prep.append(
                ActionDraft(
                    type="PREP",
                    title="Expand option set",
                    description="Prepare at least two comparable options",
                )
            )
        if "rationale" in missing:
            prep.append(
                ActionDraft(
                    type="PREP",
                    title="Collect rationale evidence",
                    description="Summarize pros, concerns, and conditions",
                )
            )

        # baseline prep if missing is empty
        if not prep:
            prep.append(
                ActionDraft(
                    type="PREP",
                    title="Final decision packet review",
                    description="Verify options, rationale, and deadline are up to date",
                )
            )

        # execution suggestions
        due = self._suggest_due(decision.dueAt)
        execs.append(
            ActionDraft(
                type="EXEC",
                title="Broadcast decision",
                description="Share final decision and selected option with stakeholders",
                dueAt=due,
            )
        )

        if getattr(decision, "options", None):
            first = decision.options[0].label if decision.options else "採用案"
            execs.append(
                ActionDraft(
                    type="EXEC",
                    title="Plan rollout for selected option",
                    description=f"Create milestones and execution steps for: {first}",
                    dueAt=due,
                )
            )

        combined = prep[:MAX_PREP_ACTIONS] + execs[:MAX_EXEC_ACTIONS]
        return combined[:MAX_ACTIONS_TOTAL]

    def _suggest_due(self, decision_due: Any) -> str:
        if isinstance(decision_due, str) and decision_due:
            return decision_due
        due = datetime.now(timezone.utc) + timedelta(days=7)
        return due.isoformat().replace("+00:00", "Z")
