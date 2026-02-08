from pathlib import Path

from src.models.schemas import DraftActionsCallback, MeetingStructurerCallback, ReplyIntegratorCallback


def _sample_path(name: str) -> Path:
    return Path(__file__).resolve().parents[3] / "specs" / "core" / "samples" / name


def test_meeting_structurer_sample_schema_compatible() -> None:
    data = _sample_path("meeting_structurer_succeeded.json").read_text(encoding="utf-8")
    parsed = MeetingStructurerCallback.model_validate_json(data)
    assert parsed.kind == "meeting_structurer"
    assert parsed.status == "SUCCEEDED"
    assert len(parsed.extracted.decisions) >= 1
    assert parsed.extracted.questionSets[0].questions[0].maps_to.field


def test_reply_integrator_sample_schema_compatible() -> None:
    data = _sample_path("reply_integrator_succeeded.json").read_text(encoding="utf-8")
    parsed = ReplyIntegratorCallback.model_validate_json(data)
    assert parsed.kind == "reply_integrator"
    assert parsed.decisionId


def test_draft_actions_sample_schema_compatible() -> None:
    data = _sample_path("draft_actions_skill_succeeded.json").read_text(encoding="utf-8")
    parsed = DraftActionsCallback.model_validate_json(data)
    assert parsed.kind == "draft_actions_skill"
    assert parsed.draftActions
