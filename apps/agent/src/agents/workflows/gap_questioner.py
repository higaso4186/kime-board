from __future__ import annotations

from src.models.schemas import Decision, Question, QuestionSet
from src.utils.limits import MAX_QUESTIONS


_FIELD_PRIORITY = ["owner", "dueAt", "criteria", "options", "rationale", "assumptions", "reopenTriggers"]


def _missing_fields(decision: Decision) -> list[str]:
    from_completeness = decision.completeness.missingFields if decision.completeness else []
    if from_completeness:
        return [f for f in from_completeness if f in _FIELD_PRIORITY]

    missing: list[str] = []
    if not decision.owner or not (decision.owner.userId or decision.owner.displayName):
        missing.append("owner")
    if not decision.dueAt:
        missing.append("dueAt")
    if not decision.criteria:
        missing.append("criteria")
    if len(decision.options or []) < 2:
        missing.append("options")
    if not ((decision.rationale.pros if decision.rationale else []) or (decision.rationale.cons if decision.rationale else [])):
        missing.append("rationale")
    return missing


def _question_for_field(field: str, idx: int) -> Question:
    if field == "owner":
        return Question(
            qid=f"owner:{idx}",
            type="text",
            text="Who is the decision owner/approver?",
            required=True,
            maps_to={"targetType": "DECISION", "field": "owner"},
        )
    if field == "dueAt":
        return Question(
            qid=f"dueAt:{idx}",
            type="date",
            text="What is the due date for this decision?",
            required=True,
            maps_to={"targetType": "DECISION", "field": "dueAt"},
        )
    if field == "criteria":
        return Question(
            qid=f"criteria:{idx}",
            type="multi_select",
            text="Select decision criteria (multiple allowed).",
            options=["Cost", "Schedule", "Quality", "Risk", "Customer impact"],
            required=True,
            maps_to={"targetType": "DECISION", "field": "criteria"},
        )
    if field == "options":
        return Question(
            qid=f"options:{idx}",
            type="text",
            text="List at least two options to compare.",
            required=True,
            maps_to={"targetType": "DECISION", "field": "options"},
        )
    if field == "rationale":
        return Question(
            qid=f"rationale:{idx}",
            type="text",
            text="Briefly provide rationale (pros, cons, conditions).",
            required=True,
            maps_to={"targetType": "DECISION", "field": "rationale"},
        )
    if field == "assumptions":
        return Question(
            qid=f"assumptions:{idx}",
            type="text",
            text="What assumptions should we record?",
            maps_to={"targetType": "DECISION", "field": "assumptions"},
        )
    return Question(
        qid=f"reopenTriggers:{idx}",
        type="text",
        text="When should this decision be reopened?",
        maps_to={"targetType": "DECISION", "field": "reopenTriggers"},
    )


def generate_question_set(decision: Decision) -> QuestionSet | None:
    missing = _missing_fields(decision)
    if not missing:
        return None

    ordered = sorted(set(missing), key=lambda f: _FIELD_PRIORITY.index(f) if f in _FIELD_PRIORITY else 999)
    fields = ordered[:MAX_QUESTIONS]
    questions = [_question_for_field(field, idx + 1) for idx, field in enumerate(fields)]

    return QuestionSet(
        decisionRef={"decisionId": decision.decisionId, "title": decision.title},
        hint="We need up to three quick clarifications.",
        questions=questions,
    )
