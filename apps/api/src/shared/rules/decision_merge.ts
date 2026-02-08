export const MERGE_POLICY = {
  autoMerge: false,
  alwaysRequiresHumanApproval: true,
  scoring: {
    highConfidence: 0.85,
    medium: 0.65,
  },
} as const;

export const classifyMergeScore = (score: number): "HIGH" | "MEDIUM" | "LOW" => {
  if (score >= MERGE_POLICY.scoring.highConfidence) return "HIGH";
  if (score >= MERGE_POLICY.scoring.medium) return "MEDIUM";
  return "LOW";
};
