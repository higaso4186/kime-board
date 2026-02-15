"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createDecision } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routes";

export default function DecisionNewPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  const router = useRouter();
  const { getIdToken } = useAuth();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleCreate() {
    if (!title.trim() || creating) return;

    setCreating(true);
    try {
      const created = await createDecision(projectId, { title: title.trim() }, getIdToken);
      router.push(ROUTES.decisionDetail(projectId, created.decisionId));
    } catch (e) {
      setNotice(
        e instanceof Error
          ? `Failed to create decision: ${e.message}`
          : "Failed to create decision",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackButton label="Back" />
      <Card className="space-y-4">
        <CardTitle>Create Decision</CardTitle>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Decision title"
            className="h-11"
          />
          {notice ? <p className="text-xs text-red-700">{notice}</p> : null}
          <div className="flex gap-2">
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.decisions(projectId)}>Cancel</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}