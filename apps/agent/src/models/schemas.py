from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class TaskMeetingStructurerRequest(ApiModel):
    projectId: str
    meetingId: str
    idempotencyKey: str | None = None


class TaskReplyIntegratorRequest(ApiModel):
    projectId: str
    decisionId: str
    threadId: str
    messageId: str
    idempotencyKey: str | None = None


class TaskDraftActionsRequest(ApiModel):
    projectId: str
    decisionId: str
    idempotencyKey: str | None = None


class MeetingRaw(ApiModel):
    storage: str | None = None
    text: str | None = None
    gcsUri: str | None = None


class Meeting(ApiModel):
    meetingId: str
    projectId: str
    title: str
    raw: MeetingRaw
    status: str


class GetMeetingResponse(ApiModel):
    meeting: Meeting
    extractedDecisionIds: list[str] = Field(default_factory=list)


class DecisionOption(ApiModel):
    id: str | None = None
    label: str
    description: str | None = None
    recommended: bool | None = None


class DecisionRationale(ApiModel):
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)


class DecisionOwner(ApiModel):
    userId: str | None = None
    displayName: str | None = None


class DecisionCompleteness(ApiModel):
    score: int = 0
    missingFields: list[str] = Field(default_factory=list)


class Decision(ApiModel):
    decisionId: str
    projectId: str
    title: str
    summary: str | None = None
    status: str
    owner: DecisionOwner | None = None
    dueAt: datetime | str | None = None
    priority: Literal["LOW", "MEDIUM", "HIGH"] | None = None
    options: list[DecisionOption] = Field(default_factory=list)
    criteria: list[str] | None = None
    assumptions: list[str] = Field(default_factory=list)
    reopenTriggers: list[str] = Field(default_factory=list)
    rationale: DecisionRationale = Field(default_factory=DecisionRationale)
    completeness: DecisionCompleteness = Field(default_factory=DecisionCompleteness)


class Action(ApiModel):
    actionId: str
    type: Literal["PREP", "EXEC"]
    title: str
    status: str


class GetDecisionResponse(ApiModel):
    decision: Decision
    actions: list[Action] = Field(default_factory=list)
    threadId: str | None = None


class DecisionSummary(ApiModel):
    decisionId: str
    title: str
    status: str
    ownerDisplayName: str | None = None
    dueAt: datetime | str | None = None
    priority: str | None = None
    completenessScore: int | None = None


class ListDecisionsResponse(ApiModel):
    decisions: list[DecisionSummary | Decision] = Field(default_factory=list)


class MessageMetadataQuestionMap(ApiModel):
    targetType: Literal["DECISION", "ACTION"] = "DECISION"
    field: str


class Question(ApiModel):
    qid: str
    type: Literal["single_select", "multi_select", "date", "text"]
    text: str
    options: list[str] | None = None
    required: bool | None = None
    maps_to: MessageMetadataQuestionMap

    @model_validator(mode="before")
    @classmethod
    def _normalize_old_map_shape(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        maps_to = data.get("maps_to")
        if isinstance(maps_to, dict) and "decision_field" in maps_to and "field" not in maps_to:
            data["maps_to"] = {
                "targetType": "DECISION",
                "field": maps_to["decision_field"],
            }
        return data


class DecisionRef(ApiModel):
    decisionId: str | None = None
    title: str | None = None
    actionId: str | None = None


class QuestionSet(ApiModel):
    decisionRef: DecisionRef
    hint: str | None = None
    questions: list[Question]


class AgentDecisionExtract(ApiModel):
    decisionId: str | None = None
    title: str
    summary: str | None = None
    tags: list[str] | None = None
    ownerDisplayName: str | None = None
    dueAt: datetime | str | None = None
    priority: Literal["LOW", "MEDIUM", "HIGH"] | None = None
    options: list[DecisionOption] | None = None
    criteria: list[str] | None = None
    assumptions: list[str] | None = None
    reopenTriggers: list[str] | None = None
    rationale: DecisionRationale | None = None

    @field_validator("dueAt", mode="before")
    @classmethod
    def _normalize_due_at(cls, value: Any) -> Any:
        if value in (None, ""):
            return None
        if isinstance(value, datetime):
            return value.isoformat().replace("+00:00", "Z")
        return value


class CallbackBase(ApiModel):
    projectId: str
    runId: str | None = None
    idempotencyKey: str | None = None
    kind: Literal["meeting_structurer", "reply_integrator", "draft_actions_skill"]
    status: Literal["SUCCEEDED", "FAILED"]
    error: Any | None = None
    meta: dict[str, Any] | None = None


class MeetingStructurerExtracted(ApiModel):
    decisions: list[AgentDecisionExtract] = Field(default_factory=list)
    questionSets: list[QuestionSet] = Field(default_factory=list)


class MeetingStructurerCallback(CallbackBase):
    kind: Literal["meeting_structurer"]
    meetingId: str
    extracted: MeetingStructurerExtracted


class ReplyIntegratorPatch(ApiModel):
    ownerDisplayName: str | None = None
    dueAt: datetime | str | None = None
    criteria: list[str] | None = None
    options: list[DecisionOption] | None = None
    assumptions: list[str] | None = None
    reopenTriggers: list[str] | None = None
    rationale: DecisionRationale | None = None

    @field_validator("dueAt", mode="before")
    @classmethod
    def _normalize_due_at(cls, value: Any) -> Any:
        if value in (None, ""):
            return None
        if isinstance(value, datetime):
            return value.isoformat().replace("+00:00", "Z")
        return value


class ReplyIntegratorCallback(CallbackBase):
    kind: Literal["reply_integrator"]
    decisionId: str
    threadId: str
    appliedPatch: ReplyIntegratorPatch = Field(default_factory=ReplyIntegratorPatch)


class ActionDraft(ApiModel):
    type: Literal["PREP", "EXEC"]
    title: str
    description: str | None = None
    dueAt: datetime | str | None = None
    assigneeDisplayName: str | None = None

    @field_validator("dueAt", mode="before")
    @classmethod
    def _normalize_due_at(cls, value: Any) -> Any:
        if value in (None, ""):
            return None
        if isinstance(value, datetime):
            return value.isoformat().replace("+00:00", "Z")
        return value


class DraftActionsCallback(CallbackBase):
    kind: Literal["draft_actions_skill"]
    decisionId: str
    draftActions: list[ActionDraft] = Field(default_factory=list)


class AnswerItem(ApiModel):
    qid: str
    value: str | list[str]


class MessageMetadata(ApiModel):
    questions: list[Question] | None = None
    answers: list[AnswerItem] | None = None
    missingFields: list[str] | None = None
    contextLabel: str | None = None


class Message(ApiModel):
    messageId: str
    threadId: str
    senderType: Literal["AGENT", "USER", "SYSTEM"]
    format: Literal["TEXT", "QUESTION_SET", "ANSWER_SET"]
    content: str
    metadata: MessageMetadata | None = None
    relatesTo: dict[str, Any] | None = None


class GetMessageResponse(ApiModel):
    message: Message
