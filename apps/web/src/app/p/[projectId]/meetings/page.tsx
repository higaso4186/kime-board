import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/status-chip";
import { getProjectMeetings } from "@/lib/mock/data";
import { ROUTES } from "@/lib/routes";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const items = getProjectMeetings(projectId);

  return (
    <Card>
      <CardTitle>会議一覧</CardTitle>
      <div className="mt-4 space-y-2">
        {items.map((meeting) => (
          <div key={meeting.meetingId} className="grid grid-cols-12 rounded-[10px] border border-neutral-200 px-3 py-3">
            <Link
              href={ROUTES.meetingDetail(projectId, meeting.meetingId)}
              className="col-span-5 text-sm font-medium hover:text-blue-600"
            >
              {meeting.title}
            </Link>
            <p className="col-span-4 text-sm text-neutral-600">{meeting.heldAt.slice(0, 16).replace("T", " ")}</p>
            <div className="col-span-3">
              <StatusChip status={meeting.status} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
