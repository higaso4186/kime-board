import Link from "next/link";
import { ProjectShell } from "@/components/layout/project-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getProject } from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <Card className="mx-auto mt-20 max-w-xl">
          <CardTitle>Project選択が必要です</CardTitle>
          <CardDescription className="mt-2">
            指定されたプロジェクトが存在しません。プロジェクト一覧から選択してください。
          </CardDescription>
          <Button asChild className="mt-4 w-fit">
            <Link href={ROUTES.projects}>プロジェクト一覧へ</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <ProjectShell projectId={projectId}>{children}</ProjectShell>;
}
