"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/routes";

export function MeetingFormMock({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [participants, setParticipants] = useState("本部長 佐藤, PM 高橋");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-6">
      <Card className="col-span-8 space-y-4">
        <CardTitle>会議メモを貼り付け</CardTitle>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">会議名</label>
          <Input placeholder="例: PJ定例 2/8" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">日時</label>
          <Input type="datetime-local" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">参加者</label>
          <Input value={participants} onChange={(event) => setParticipants(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-600">メモ本文</label>
          <Textarea className="min-h-[360px]" placeholder="議事録/メモを貼り付け" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setNotice("下書きを保存しました（モック）")}
          >
            下書き保存
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setNotice("解析を開始しました");
              setTimeout(() => {
                router.push(`${ROUTES.meetingDetail(projectId, "mtg_01")}?state=ANALYZING`);
              }, 700);
            }}
          >
            {loading ? "解析中..." : "保存して解析開始"}
          </Button>
        </div>

        {notice ? (
          <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
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
