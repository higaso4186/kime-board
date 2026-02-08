from __future__ import annotations

import re
from datetime import timezone
from typing import Any

from dateutil import parser as date_parser

from src.config import Settings
from src.models.schemas import ReplyIntegratorCallback, ReplyIntegratorPatch, TaskReplyIntegratorRequest
from src.observability.runlog import RunContext
from src.tools.kimeboard_api_tools import KimeboardApiToolset
from src.utils.text import split_lines


class ReplyIntegratorWorkflow:
    def __init__(self, tools: KimeboardApiToolset, settings: Settings, logger) -> None:
        self.tools = tools
        self.settings = settings
        self.logger = logger

    async def run(self, task: TaskReplyIntegratorRequest, run: RunContext) -> dict[str, Any]:
        try:
            decision_res = await self.tools.get_decision(task.projectId, task.decisionId)
            message_res = await self.tools.get_message(task.threadId, task.messageId)

            decision = decision_res.decision
            message = message_res.message
            patch = self._build_patch(decision, message)

            callback = ReplyIntegratorCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey or task.messageId,
                kind="reply_integrator",
                status="SUCCEEDED",
                decisionId=task.decisionId,
                threadId=task.threadId,
                appliedPatch=patch,
            )

            out = await self.tools.post_callback(callback.model_dump(mode="json", exclude_none=True))
            self.logger.info(
                "reply_integrator_succeeded",
                run_id=run.run_id,
                project_id=task.projectId,
                decision_id=task.decisionId,
                patch_fields=[k for k, v in patch.model_dump(exclude_none=True).items() if v not in (None, [], {})],
            )

            return {"ok": True, "runId": run.run_id, "callback": out}
        except Exception as exc:  # noqa: BLE001
            self.logger.exception("reply_integrator_failed", run_id=run.run_id, project_id=task.projectId)
            failed = ReplyIntegratorCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey or task.messageId,
                kind="reply_integrator",
                status="FAILED",
                decisionId=task.decisionId,
                threadId=task.threadId,
                error=str(exc),
                appliedPatch=ReplyIntegratorPatch(),
            )
            await self.tools.post_callback(failed.model_dump(mode="json", exclude_none=True))
            raise

    def _build_patch(self, decision, message) -> ReplyIntegratorPatch:
        patch: dict[str, Any] = {}

        answers = (message.metadata.answers if message.metadata else None) or []
        for answer in answers:
            field = self._field_from_qid(answer.qid)
            value = answer.value
            self._apply_answer(field, value, patch)

        if not patch:
            self._apply_from_free_text(message.content, patch)

        # guardrail for safe mode: keep patch minimal and explicit
        if self.settings.safe_mode and "options" in patch:
            patch["options"] = [opt for opt in patch["options"] if opt.get("label")]

        if "criteria" in patch:
            patch["criteria"] = self._uniq_list(patch["criteria"])
        if "assumptions" in patch:
            patch["assumptions"] = self._uniq_list(patch["assumptions"])
        if "reopenTriggers" in patch:
            patch["reopenTriggers"] = self._uniq_list(patch["reopenTriggers"])

        # if still empty, no-op patch is valid
        return ReplyIntegratorPatch.model_validate(patch)

    def _field_from_qid(self, qid: str) -> str:
        # expected qid examples: owner:1, dueAt:1, criteria:1
        if ":" in qid:
            return qid.split(":", 1)[0]
        if "_" in qid:
            return qid.split("_", 1)[0]
        return qid

    def _apply_answer(self, field: str, value: Any, patch: dict[str, Any]) -> None:
        values = value if isinstance(value, list) else [value]
        values = [str(v).strip() for v in values if str(v).strip()]
        if not values:
            return

        if field == "owner":
            patch["ownerDisplayName"] = values[0]
            return

        if field == "dueAt":
            due = self._to_iso(values[0])
            if due:
                patch["dueAt"] = due
            return

        if field == "criteria":
            patch.setdefault("criteria", []).extend(values)
            return

        if field == "options":
            opts = patch.setdefault("options", [])
            for v in values:
                opts.append({"label": v})
            return

        if field == "assumptions":
            patch.setdefault("assumptions", []).extend(values)
            return

        if field == "reopenTriggers":
            patch.setdefault("reopenTriggers", []).extend(values)
            return

        if field == "rationale":
            rationale = patch.setdefault("rationale", {"pros": [], "cons": [], "conditions": []})
            rationale["pros"].extend(values)
            return

    def _apply_from_free_text(self, content: str, patch: dict[str, Any]) -> None:
        lines = split_lines(content)
        if not lines:
            return

        for line in lines:
            if not patch.get("dueAt"):
                match = re.search(r"(20\d{2}[-/]\d{1,2}[-/]\d{1,2})", line)
                if match:
                    iso = self._to_iso(match.group(1))
                    if iso:
                        patch["dueAt"] = iso

            if any(keyword in line for keyword in ["決裁者", "オーナー", "owner"]):
                name = line.split(":", 1)[1].strip() if ":" in line else line
                if name:
                    patch["ownerDisplayName"] = name

            if any(keyword in line for keyword in ["基準", "criteria"]):
                value = line.split(":", 1)[1] if ":" in line else line
                patch.setdefault("criteria", []).extend(self._split_inline(value))

            if any(keyword in line for keyword in ["選択肢", "option"]):
                value = line.split(":", 1)[1] if ":" in line else line
                for item in self._split_inline(value):
                    patch.setdefault("options", []).append({"label": item})

    def _split_inline(self, value: str) -> list[str]:
        return [x.strip() for x in re.split(r"[、,/]", value) if x.strip()]

    def _to_iso(self, raw: str) -> str | None:
        try:
            dt = date_parser.parse(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception:  # noqa: BLE001
            return None

    def _uniq_list(self, items: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in items:
            key = item.strip()
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(key)
        return out
