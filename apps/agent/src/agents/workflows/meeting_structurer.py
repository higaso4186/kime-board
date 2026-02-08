from __future__ import annotations

import re
import uuid
from datetime import timezone
from typing import Any

from dateutil import parser as date_parser

from src.agents.workflows.gap_questioner import generate_question_set
from src.config import Settings
from src.models.schemas import (
    AgentDecisionExtract,
    Decision,
    DecisionCompleteness,
    DecisionOption,
    DecisionRationale,
    MeetingStructurerCallback,
    MeetingStructurerExtracted,
    QuestionSet,
    TaskMeetingStructurerRequest,
)
from src.observability.runlog import RunContext
from src.tools.kimeboard_api_tools import KimeboardApiToolset
from src.utils.limits import MAX_MEETING_RAW_CHARS
from src.utils.text import normalize_text, split_lines, truncate


class MeetingStructurerWorkflow:
    def __init__(self, tools: KimeboardApiToolset, settings: Settings, logger) -> None:
        self.tools = tools
        self.settings = settings
        self.logger = logger

    async def run(self, task: TaskMeetingStructurerRequest, run: RunContext) -> dict[str, Any]:
        try:
            await self._log(task, run, "meeting_structurer started")

            meeting_res = await self.tools.get_meeting(task.projectId, task.meetingId)
            meeting = meeting_res.meeting
            raw_text = truncate(normalize_text(meeting.raw.text or ""), MAX_MEETING_RAW_CHARS)
            await self._log(task, run, f"meeting fetched: {meeting.meetingId}")

            candidate_res = await self.tools.list_candidate_decisions(task.projectId, self.settings.max_context_decisions)
            candidates = candidate_res.decisions
            await self._log(task, run, f"candidate decisions fetched: {len(candidates)}")

            extracted_with_missing = self._extract_from_text(raw_text, meeting.title, candidates)
            extracted_decisions = [item["decision"] for item in extracted_with_missing]

            question_sets: list[QuestionSet] = []
            for item in extracted_with_missing:
                decision_model = item["decision_model"]
                qset = generate_question_set(decision_model)
                if qset:
                    qset.decisionRef.decisionId = item["decision"].decisionId
                    qset.decisionRef.title = item["decision"].title
                    question_sets.append(qset)

            callback = MeetingStructurerCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey,
                kind="meeting_structurer",
                status="SUCCEEDED",
                meetingId=task.meetingId,
                extracted=MeetingStructurerExtracted(
                    decisions=extracted_decisions,
                    questionSets=question_sets,
                ),
            )

            out = await self.tools.post_callback(callback.model_dump(mode="json", exclude_none=True))
            await self._log(task, run, f"callback posted, decisions={len(extracted_decisions)}, questions={len(question_sets)}")

            return {
                "ok": True,
                "runId": run.run_id,
                "decisions": len(extracted_decisions),
                "questionSets": len(question_sets),
                "callback": out,
            }
        except Exception as exc:  # noqa: BLE001
            self.logger.exception("meeting_structurer_failed", run_id=run.run_id, project_id=task.projectId)
            failed = MeetingStructurerCallback(
                projectId=task.projectId,
                runId=run.run_id,
                idempotencyKey=task.idempotencyKey,
                kind="meeting_structurer",
                status="FAILED",
                meetingId=task.meetingId,
                error=str(exc),
                extracted=MeetingStructurerExtracted(decisions=[], questionSets=[]),
            )
            await self.tools.post_callback(failed.model_dump(mode="json", exclude_none=True))
            raise

    async def _log(self, task: TaskMeetingStructurerRequest, run: RunContext, line: str) -> None:
        self.logger.info(
            "meeting_structurer_log",
            run_id=run.run_id,
            project_id=task.projectId,
            meeting_id=task.meetingId,
            line=line,
        )
        try:
            await self.tools.post_agent_log(task.projectId, task.meetingId, line)
        except Exception:  # noqa: BLE001
            self.logger.warning("meeting_log_post_failed", run_id=run.run_id, line=line)

    def _extract_from_text(self, raw_text: str, meeting_title: str, candidates: list[Any]) -> list[dict[str, Any]]:
        blocks = self._extract_blocks(raw_text)
        if not blocks:
            blocks = [{"title": f"{meeting_title} の決裁", "notes": [truncate(raw_text, 280)]}]

        results: list[dict[str, Any]] = []
        for block in blocks:
            decision_id = self._match_existing_decision(block["title"], candidates)
            if not decision_id:
                decision_id = f"dcs_{uuid.uuid4().hex[:12]}"

            options = [DecisionOption(label=o, recommended=(i == 0)) for i, o in enumerate(block.get("options", []))]
            rationale = DecisionRationale(
                pros=block.get("pros", []),
                cons=block.get("cons", []),
                conditions=block.get("conditions", []),
            )

            missing = self._missing_fields(
                owner=block.get("owner"),
                due_at=block.get("dueAt"),
                criteria=block.get("criteria", []),
                options=options,
                rationale=rationale,
            )

            extract = AgentDecisionExtract(
                decisionId=decision_id,
                title=block["title"],
                summary=truncate(" ".join(block.get("notes", [])).strip(), 220) or None,
                tags=block.get("tags") or None,
                ownerDisplayName=block.get("owner"),
                dueAt=block.get("dueAt"),
                priority=self._infer_priority(block),
                options=options or None,
                criteria=block.get("criteria") or None,
                assumptions=block.get("assumptions") or None,
                reopenTriggers=block.get("reopenTriggers") or None,
                rationale=rationale,
            )

            decision_model = Decision(
                decisionId=decision_id,
                projectId="project",
                title=extract.title,
                summary=extract.summary,
                status="NEEDS_INFO" if missing else "READY_TO_DECIDE",
                owner={"displayName": extract.ownerDisplayName} if extract.ownerDisplayName else None,
                dueAt=extract.dueAt,
                priority=extract.priority or "MEDIUM",
                options=options,
                criteria=extract.criteria,
                assumptions=extract.assumptions or [],
                reopenTriggers=extract.reopenTriggers or [],
                rationale=rationale,
                completeness=DecisionCompleteness(score=max(0, 100 - 20 * len(missing)), missingFields=missing),
            )

            results.append({
                "decision": extract,
                "missing": missing,
                "decision_model": decision_model,
            })

        return results

    def _extract_blocks(self, raw_text: str) -> list[dict[str, Any]]:
        lines = split_lines(raw_text)
        blocks: list[dict[str, Any]] = []
        current: dict[str, Any] | None = None

        for line in lines:
            lowered = line.lower()
            if any(lowered.startswith(prefix) for prefix in ["決裁:", "decision:", "意思決定:", "論点:"]):
                if current:
                    blocks.append(current)
                current = {
                    "title": line.split(":", 1)[1].strip() if ":" in line else line,
                    "options": [],
                    "criteria": [],
                    "assumptions": [],
                    "reopenTriggers": [],
                    "pros": [],
                    "cons": [],
                    "conditions": [],
                    "notes": [],
                }
                continue

            if current is None:
                continue

            self._apply_detail_line(current, line)

        if current:
            blocks.append(current)

        return [b for b in blocks if b.get("title")]

    def _apply_detail_line(self, block: dict[str, Any], line: str) -> None:
        l = line.strip()
        low = l.lower()

        if low.startswith(("選択肢:", "options:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["options"] = self._split_list(value)
            return

        if low.startswith(("基準:", "criteria:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["criteria"] = self._split_list(value)
            return

        if low.startswith(("決裁者:", "owner:")):
            block["owner"] = l.split(":", 1)[1].strip() if ":" in l else None
            return

        if low.startswith(("期限:", "due:", "dueat:")):
            raw = l.split(":", 1)[1].strip() if ":" in l else ""
            block["dueAt"] = self._to_iso(raw)
            return

        if low.startswith(("前提:", "assumptions:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["assumptions"] = self._split_list(value)
            return

        if low.startswith(("再審条件:", "reopen:", "reopentriggers:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["reopenTriggers"] = self._split_list(value)
            return

        if low.startswith(("理由+:", "pros:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["pros"] = self._split_list(value)
            return

        if low.startswith(("理由-:", "cons:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["cons"] = self._split_list(value)
            return

        if low.startswith(("条件:", "conditions:")):
            value = l.split(":", 1)[1] if ":" in l else ""
            block["conditions"] = self._split_list(value)
            return

        block["notes"].append(l)

    def _split_list(self, value: str) -> list[str]:
        parts = re.split(r"[、,/]", value)
        return [p.strip() for p in parts if p.strip()]

    def _to_iso(self, raw: str) -> str | None:
        if not raw:
            return None
        try:
            dt = date_parser.parse(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception:  # noqa: BLE001
            return None

    def _missing_fields(
        self,
        *,
        owner: str | None,
        due_at: str | None,
        criteria: list[str],
        options: list[DecisionOption],
        rationale: DecisionRationale,
    ) -> list[str]:
        missing: list[str] = []
        if not owner:
            missing.append("owner")
        if not due_at:
            missing.append("dueAt")
        if not criteria:
            missing.append("criteria")
        if len(options) < 2:
            missing.append("options")
        if not (rationale.pros or rationale.cons or rationale.conditions):
            missing.append("rationale")
        return missing

    def _infer_priority(self, block: dict[str, Any]) -> str:
        text = " ".join([block.get("title", ""), *block.get("notes", [])])
        if any(keyword in text for keyword in ["至急", "緊急", "urgent", "blocking"]):
            return "HIGH"
        if any(keyword in text for keyword in ["低", "later", "検討"]):
            return "LOW"
        return "MEDIUM"

    def _match_existing_decision(self, title: str, candidates: list[Any]) -> str | None:
        normalized_title = self._norm(title)
        for candidate in candidates:
            c_title = getattr(candidate, "title", "")
            if self._norm(c_title) == normalized_title:
                return getattr(candidate, "decisionId", None)

        # loose match by token overlap
        title_tokens = set(re.split(r"\W+", normalized_title)) - {"", "_"}
        best_score = 0.0
        best_id: str | None = None
        for candidate in candidates:
            c_title = self._norm(getattr(candidate, "title", ""))
            c_tokens = set(re.split(r"\W+", c_title)) - {"", "_"}
            if not c_tokens:
                continue
            score = len(title_tokens & c_tokens) / max(len(title_tokens | c_tokens), 1)
            if score > best_score:
                best_score = score
                best_id = getattr(candidate, "decisionId", None)

        if best_score >= 0.6:
            return best_id
        return None

    def _norm(self, text: str) -> str:
        return re.sub(r"\s+", "", text or "").lower()
