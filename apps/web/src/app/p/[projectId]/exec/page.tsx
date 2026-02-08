import Link from "next/link";
import { ExecOps } from "@/components/pages/exec-ops";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getOpenQuestionCountByDecision,
  getProject,
  getProjectActions,
  getProjectDecisions,
} from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default async function ExecPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  const decisions = getProjectDecisions(projectId);
  const actions = getProjectActions(projectId);

  if (!project) {
    return (
      <Card>
        <CardTitle>プロジェクトが見つかりません</CardTitle>
        <Button asChild className="mt-4 w-fit">
          <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardDescription>決裁者未設定（要対応）</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{project.missingOwner}</p>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardDescription>期限超過アクション</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-red-700">{project.overdue}</p>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardDescription>今週決めるべき決裁</CardDescription>
          <p className="mt-2 text-3xl font-semibold text-blue-700">{project.ready}</p>
        </Card>
      </section>

      <section className="grid grid-cols-12 gap-6">
        <Card className="col-span-7">
          <CardTitle>決裁者未設定</CardTitle>
          <div className="mt-4 space-y-2">
            {decisions
              .filter((decision) => !decision.owner)
              .map((decision) => (
                <div
                  key={decision.decisionId}
                  className="grid grid-cols-12 items-center rounded-[10px] border border-neutral-200 px-3 py-2 text-sm"
                >
                  <Link
                    href={ROUTES.decisionDetail(projectId, decision.decisionId)}
                    className="col-span-4 font-medium hover:text-blue-600"
                  >
                    {decision.title}
                  </Link>
                  <p className="col-span-3 text-neutral-600">{decision.meetingTitle || "未紐付け"}</p>
                  <p className="col-span-2 text-neutral-600">
                    不足 {getOpenQuestionCountByDecision(projectId, decision.decisionId)}件
                  </p>
                  <p className="col-span-3 text-neutral-600">最有力: 本部長 佐藤</p>
                </div>
              ))}
          </div>
        </Card>

        <Card className="col-span-5">
          <CardTitle>期限超過アクション</CardTitle>
          <div className="mt-4 space-y-2">
            {actions
              .filter((action) => action.status === "BLOCKED" || action.status === "TODO")
              .map((action) => {
                const overdueDays = action.dueAt
                  ? Math.max(
                      1,
                      Math.floor(
                        (new Date("2026-02-08T12:00:00+09:00").getTime() -
                          new Date(action.dueAt).getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )
                  : 0;
                return (
                  <div key={action.actionId} className="rounded-[10px] border border-neutral-200 px-3 py-2 text-sm">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-xs text-neutral-600">
                      紐づく決裁: {action.decisionId} / 担当: {action.assignee || "未設定"} / 超過: {overdueDays}日
                    </p>
                    <div className="mt-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={ROUTES.chat(projectId, action.decisionId)}>状況確認（チャット）</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </section>

      <Card>
        <CardTitle>ワンクリック運用（演出）</CardTitle>
        <div className="mt-3">
          <ExecOps projectId={projectId} />
        </div>
      </Card>
    </div>
  );
}
