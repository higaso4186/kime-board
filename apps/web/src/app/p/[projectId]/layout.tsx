import { ProjectShell } from "@/components/layout/project-shell";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectShell projectId={projectId}>{children}</ProjectShell>;
}
