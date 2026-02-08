import { redirect } from "next/navigation";
import { getProjectMeetings } from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default async function AgendaIndexPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const nextMeeting = getProjectMeetings(projectId)[0];

  if (nextMeeting) {
    redirect(ROUTES.meetingAgenda(projectId, nextMeeting.meetingId));
  }

  redirect(ROUTES.meetings(projectId));
}
