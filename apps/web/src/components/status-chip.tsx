import { DecisionStatus, MeetingStatus } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";

type Status = DecisionStatus | MeetingStatus;

const tone: Record<Status, string> = {
  NEEDS_INFO: "border-[var(--color-blue-300)] bg-[var(--color-blue-50)] text-[var(--color-blue-800)]",
  READY_TO_DECIDE:
    "border-[var(--color-blue-500)] bg-[var(--color-blue-100)] text-[var(--color-blue-800)]",
  DECIDED: "border-[var(--color-blue-700)] bg-[var(--color-blue-600)] text-white",
  REOPEN:
    "border-[var(--color-neutral-300)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
  ANALYZING:
    "border-[var(--color-blue-500)] bg-[var(--color-blue-100)] text-[var(--color-blue-800)]",
  DONE: "border-[var(--color-blue-700)] bg-[var(--color-blue-600)] text-white",
  FAILED: "border-[var(--color-red-300)] bg-[var(--color-red-50)] text-[var(--color-red-700)]",
};

export function StatusChip({ status }: { status: Status }) {
  return <Badge className={tone[status]}>{status}</Badge>;
}
