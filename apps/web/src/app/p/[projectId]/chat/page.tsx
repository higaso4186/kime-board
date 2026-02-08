import { ChatMock } from "@/components/pages/chat-mock";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ decisionId?: string }>;
}) {
  const { projectId } = await params;
  const { decisionId } = await searchParams;
  return <ChatMock projectId={projectId} decisionId={decisionId ?? "dcs_01"} />;
}
