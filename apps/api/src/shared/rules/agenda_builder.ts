import type { Decision } from "../domain/decision";

export type AgendaBucket = "READY" | "NEEDS_INFO" | "REOPEN";

export type AgendaItem = {
  type: "DECIDE" | "PREP" | "REOPEN";
  decisionId: string;
  title: string;
  timeboxMin: number;
  ownerDisplayName?: string;
};

export type AgendaDraft = {
  buckets: Record<AgendaBucket, AgendaItem[]>;
};

export const buildAgendaDraft = (decisions: Decision[]): AgendaDraft => {
  const ready: AgendaItem[] = [];
  const needs: AgendaItem[] = [];
  const reopen: AgendaItem[] = [];

  for (const d of decisions) {
    const base = {
      decisionId: d.decisionId,
      title: d.title,
      ownerDisplayName: d.owner?.displayName,
    };
    if (d.status === "REOPEN") {
      reopen.push({ ...base, type: "REOPEN", timeboxMin: 10 });
    } else if (d.status === "READY_TO_DECIDE") {
      ready.push({ ...base, type: "DECIDE", timeboxMin: 15 });
    } else if (d.status === "NEEDS_INFO") {
      needs.push({ ...base, type: "PREP", timeboxMin: 10 });
    }
  }

  const byDue = (idA: string, idB: string) => {
    const a = decisions.find(d => d.decisionId === idA);
    const b = decisions.find(d => d.decisionId === idB);
    const da = a?.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
    const db = b?.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
    return da - db;
  };

  const sortItems = (items: AgendaItem[]) =>
    items.sort((x, y) => byDue(x.decisionId, y.decisionId));

  return {
    buckets: {
      READY: sortItems(ready),
      NEEDS_INFO: sortItems(needs),
      REOPEN: sortItems(reopen),
    },
  };
};
