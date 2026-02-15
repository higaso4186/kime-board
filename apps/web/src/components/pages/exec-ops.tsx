"use client";

import Link from "next/link";
import { useState } from "react";
import { OpenRightPanelButton } from "@/components/layout/open-right-panel-button";
import { Button } from "@/components/ui/button";
import { useDemoProjectSnapshot } from "@/lib/hooks/use-demo-api";
import { ROUTES } from "@/lib/routes";

export function ExecOps({ projectId }: { projectId: string }) {
  const [notice, setNotice] = useState("");
  const { snapshot } = useDemoProjectSnapshot(projectId);
  const nextMeeting = snapshot?.meetings[0];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <OpenRightPanelButton label="不足質問を再生成" tab="chat" />
        <Button variant="outline" onClick={() => setNotice("決裁者候補を提案しました")}>決裁者候補を提案</Button>
        {nextMeeting ? (
          <Button asChild>
            <Link href={ROUTES.meetingAgenda(projectId, nextMeeting.meetingId)}>
              次回会議の決裁アジェンダを見る
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            会議が未登録です
          </Button>
        )}
      </div>
      {notice ? (
        <p className="rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
