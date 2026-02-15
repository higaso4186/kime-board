"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { createDemoMeeting } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import { meetingFormDefaults } from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export function MeetingFormMock({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { snapshot, refresh } = useDemoProjectSnapshot(projectId);
  const hasDecisions = (snapshot?.decisions ?? []).length > 0;
  const firstMeetingId = snapshot?.meetings[0]?.meetingId;
  const [title, setTitle] = useState("");
  const [heldAt, setHeldAt] = useState("");
  const [participants, setParticipants] = useState(meetingFormDefaults.participants);
  const [rawText, setRawText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !rawText.trim()) {
      setNotice("会議名とメモ本文は必須です");
      return;
    }

    setLoading(true);
    setNotice("");
    try {
      const { meetingId } = await createDemoMeeting(
        projectId,
        {
          title,
          heldAt: heldAt || undefined,
          participants: participants ? participants.split(/[,、\s]+/).map((s) => s.trim()).filter(Boolean) : undefined,
          rawText,
        },
        getIdToken,
      );
      await refresh();
      setNotice("会議を保存しました");
      router.push(ROUTES.meetingDetail(projectId, meetingId));
    } catch (e) {
      setNotice(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {hasDecisions ? (
        <Card className="col-span-12 flex items-center justify-between bg-amber-50">
          <div>
            <CardTitle>初回セットアップは完了しています</CardTitle>
            <CardDescription className="mt-1">
              2回目以降の議事録投入は各会議の詳細画面から行ってください。
            </CardDescription>
          </div>
          {firstMeetingId ? (
            <Button variant="outline" asChild>
              <Link href={ROUTES.meetingDetail(projectId, firstMeetingId)}>会議詳細へ移動</Link>
            </Button>
          ) : null}
        </Card>
      ) : null}

      <Card className="col-span-8 space-y-4">
        <CardTitle>会議メモを貼り付け</CardTitle>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">会議名</label>
          <Input
            placeholder="例: PJ定例 2/8"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">日時</label>
          <Input
            type="datetime-local"
            value={heldAt}
            onChange={(e) => setHeldAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">参加者</label>
          <Input value={participants} onChange={(event) => setParticipants(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">メモ本文</label>
          <Textarea
            className="min-h-[360px]"
            placeholder="議事録/メモを貼り付け"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "保存中..." : "保存して会議を作成"}
          </Button>
        </div>

        {notice ? (
          <p className={`rounded-[10px] border px-3 py-2 text-xs ${notice.includes("失敗") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
            {notice}
          </p>
        ) : null}
      </Card>

      <Card className="col-span-4 h-fit space-y-2">
        <CardTitle>入力のコツ</CardTitle>
        <CardDescription>
          決めたいこと、選択肢、懸念点があると Decision 抽出が安定します。
        </CardDescription>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
          <li>決めたいこと（論点）を明記</li>
          <li>選択肢や懸念点があると精度向上</li>
          <li>未確定でもOK（不足は質問で埋める）</li>
        </ul>
      </Card>
    </div>
  );
}
