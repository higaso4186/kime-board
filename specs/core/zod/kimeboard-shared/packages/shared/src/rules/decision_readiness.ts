import type { Decision } from "../domain/decision";

export type DecisionMissingField =
  | "owner"
  | "dueAt"
  | "criteria"
  | "options"
  | "assumptions"
  | "reopenTriggers"
  | "rationale";

export type DecisionReadiness = {
  completenessScore: number;
  missingFields: DecisionMissingField[];
  derivedFlags: {
    ownerMissing: boolean;
    dueMissing: boolean;
    optionsMissing: boolean;
    criteriaMissing: boolean;
  };
};

const hasOwner = (d: Decision): boolean =>
  !!(d.owner && (d.owner.userId || d.owner.displayName));

const hasDue = (d: Decision): boolean => !!d.dueAt;

const hasCriteria = (d: Decision): boolean =>
  Array.isArray(d.criteria) && d.criteria.length > 0;

const hasOptions = (d: Decision): boolean =>
  Array.isArray(d.options) && d.options.length >= 2;

const hasRationale = (d: Decision): boolean => {
  const r = d.rationale;
  return (
    !!r &&
    ((r.pros?.length || 0) + (r.cons?.length || 0) + (r.conditions?.length || 0) > 0)
  );
};

export const computeDecisionReadiness = (d: Decision): DecisionReadiness => {
  const missing: DecisionMissingField[] = [];

  if (!hasOwner(d)) missing.push("owner");
  if (!hasDue(d)) missing.push("dueAt");
  if (!hasCriteria(d)) missing.push("criteria");
  if (!hasOptions(d)) missing.push("options");
  if (!hasRationale(d)) missing.push("rationale");

  let score = 100;
  if (!hasOwner(d)) score -= 25;
  if (!hasDue(d)) score -= 20;
  if (!hasCriteria(d)) score -= 20;
  if (!hasOptions(d)) score -= 20;
  if (!hasRationale(d)) score -= 15;

  score = Math.max(0, Math.min(100, score));

  return {
    completenessScore: score,
    missingFields: missing,
    derivedFlags: {
      ownerMissing: !hasOwner(d),
      dueMissing: !hasDue(d),
      optionsMissing: !hasOptions(d),
      criteriaMissing: !hasCriteria(d),
    },
  };
};

export const isReadyToDecide = (d: Decision, threshold = 80): boolean => {
  const { completenessScore, derivedFlags } = computeDecisionReadiness(d);
  const coreOk =
    !derivedFlags.ownerMissing &&
    !derivedFlags.dueMissing &&
    !derivedFlags.optionsMissing &&
    !derivedFlags.criteriaMissing;
  return coreOk && completenessScore >= threshold;
};
