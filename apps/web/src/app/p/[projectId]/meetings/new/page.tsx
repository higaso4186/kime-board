import { MeetingFormMock } from "@/components/pages/meeting-form-mock";

export default async function MeetingNewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <MeetingFormMock projectId={projectId} />;
}
