"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Kanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Logs,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  SquareCheck,
  Users,
  X,
} from "lucide-react";
import { ProductLogo } from "@/components/ui/product-logo";
import { ROUTES } from "@/lib/routes";
import {
  getMissingFieldLabel,
  getQuestionTargetPath,
  searchProjectItems,
  type Action,
  type ChatMessage,
  type Decision,
  type InsufficientQuestion,
  type Meeting,
  type Project,
} from "@/lib/mock/data";
import { useDemoProjectSnapshot, useDemoProjects } from "@/lib/hooks/use-demo-api";
import { createDecisionThread, postThreadMessage } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import { SimpleChatUI } from "@/components/chat/simple-chat-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PanelTab = "chat" | "log";

type RightPanelContextValue = {
  isOpen: boolean;
  tab: PanelTab;
  openPanel: (nextTab?: PanelTab) => void;
  openChatForQuestion: (questionId: string) => void;
  closePanel: () => void;
  togglePanel: () => void;
  selectedQuestionId: string | null;
  setSelectedQuestionId: (questionId: string | null) => void;
};

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

function useRightPanelState() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("chat");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  return useMemo(
    () => ({
      isOpen,
      tab,
      openPanel: (nextTab: PanelTab = "chat") => {
        setTab(nextTab);
        setIsOpen(true);
      },
      openChatForQuestion: (questionId: string) => {
        setTab("chat");
        setSelectedQuestionId(questionId);
        setIsOpen(true);
      },
      closePanel: () => setIsOpen(false),
      togglePanel: () => setIsOpen((prev) => !prev),
      selectedQuestionId,
      setSelectedQuestionId,
    }),
    [isOpen, tab, selectedQuestionId],
  );
}

export function useRightPanel() {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error("useRightPanel must be used within ProjectShell");
  }
  return context;
}

function SidebarItem({
  href,
  label,
  icon,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm transition",
        collapsed && "justify-center px-2",
        active ? "bg-blue-50 text-blue-700" : "text-neutral-700 hover:bg-neutral-100",
      )}
    >
      {icon}
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

function Header({
  projectId,
  projects,
  currentProject,
  decisions,
  meetings,
  actions,
  showMeetingMemoEntry,
}: {
  projectId: string;
  projects: Project[];
  currentProject: Project | null;
  decisions: Decision[];
  meetings: Meeting[];
  actions: Action[];
  showMeetingMemoEntry: boolean;
}) {
  const router = useRouter();
  const { isOpen, togglePanel } = useRightPanel();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchProjectItems(projectId, query, decisions, meetings, actions),
    [actions, decisions, meetings, projectId, query],
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-neutral-200 bg-white px-6">
      <div className="flex w-[360px] items-center gap-3">
        <ProductLogo />
        <Select
          controlSize="sm"
          className="max-w-[200px]"
          value={currentProject?.projectId ?? ""}
          onChange={(event) => router.push(ROUTES.projectHome(event.target.value))}
        >
          {projects.map((project) => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="relative flex flex-1 justify-center px-6">
        <div className="relative w-full max-w-[540px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="決裁・会議・アクションを検索"
            className="pl-9"
          />
          {query.trim() ? (
            <div className="absolute top-11 z-30 w-full rounded-[10px] border border-neutral-200 bg-white p-2 shadow-sm">
              {results.length === 0 ? (
                <p className="px-2 py-3 text-xs text-neutral-500">一致する結果がありません</p>
              ) : (
                results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={result.href}
                    className="block rounded-[8px] px-2 py-2 hover:bg-neutral-50"
                    onClick={() => setQuery("")}
                  >
                    <p className="text-xs font-medium text-neutral-900">
                      [{result.type}] {result.title}
                    </p>
                    <p className="text-[11px] text-neutral-600">{result.subtitle}</p>
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        {showMeetingMemoEntry ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href={ROUTES.meetingNew(projectId)}>
              <Plus className="mr-1 size-3" />
              新規会議メモ
            </Link>
          </Button>
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.decisionNew(projectId)}>新規決裁</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={togglePanel}>
          {isOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </Button>
      </div>
    </header>
  );
}

function Sidebar({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const userName = user?.displayName?.trim() || "名前未設定";
  const userEmail = user?.email ?? "メール未設定";
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-16 flex h-[calc(100vh-64px)] flex-col border-r border-neutral-200 bg-white transition-[width]",
        collapsed ? "w-14 p-2" : "w-[280px] p-4",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && <p className="text-xs font-medium text-neutral-500">プロジェクト</p>}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="shrink-0 rounded-[8px] p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
          title={collapsed ? "メニューを展開" : "メニューを最小化"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
      <div className="mt-2 space-y-1">
        <SidebarItem
          href={ROUTES.decisions(projectId)}
          label="決裁"
          icon={<Kanban className="size-4 shrink-0" />}
          collapsed={collapsed}
        />
        <SidebarItem
          href={ROUTES.meetings(projectId)}
          label="会議"
          icon={<Calendar className="size-4 shrink-0" />}
          collapsed={collapsed}
        />
      </div>
      {!collapsed && <p className="mb-2 mt-6 text-xs font-medium text-neutral-500">管理権限</p>}
      <div className="space-y-1">
        <SidebarItem
          href={ROUTES.projectDashboard(projectId)}
          label="ダッシュボード"
          icon={<LayoutDashboard className="size-4 shrink-0" />}
          collapsed={collapsed}
        />
        <SidebarItem
          href={ROUTES.members(projectId)}
          label="ロール/メンバー"
          icon={<Users className="size-4 shrink-0" />}
          collapsed={collapsed}
        />
      </div>
      <div className={cn("relative mt-auto", collapsed ? "mt-4" : "")}>
        <button
          type="button"
          className={cn(
            "w-full rounded-[10px] border border-neutral-200 bg-neutral-50 px-3 py-2 text-left hover:bg-neutral-100",
            collapsed && "flex justify-center px-2 py-2",
          )}
          onClick={() => setMenuOpen((prev) => !prev)}
          title={collapsed ? userName : undefined}
        >
          {collapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
              {(userName || "?")[0]}
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-neutral-500">ログイン中ユーザー</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{userName}</p>
                  <p className="truncate text-xs text-neutral-600">{userEmail}</p>
                </div>
                <ChevronDown className={cn("size-4 shrink-0 text-neutral-500 transition", menuOpen ? "rotate-180" : "")} />
              </div>
            </>
          )}
        </button>
        {menuOpen ? (
          <Card className={cn("absolute bottom-[calc(100%+8px)] z-10 p-1", collapsed ? "left-0 min-w-[180px]" : "left-0 right-0")}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => signOut().then(() => router.push(ROUTES.login))}
            >
              <LogOut className="size-4" />
              ログアウト
            </button>
          </Card>
        ) : null}
      </div>
    </aside>
  );
}

function RightPanel({
  projectId,
  openQuestions,
  decisions,
  actions,
  chatMessages,
  logs,
  onRefresh,
}: {
  projectId: string;
  openQuestions: InsufficientQuestion[];
  decisions: Decision[];
  actions: Action[];
  chatMessages: ChatMessage[];
  logs: string[];
  onRefresh?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { getIdToken } = useAuth();
  const {
    isOpen,
    tab,
    openPanel,
    closePanel,
    selectedQuestionId,
    setSelectedQuestionId,
  } = useRightPanel();

  const currentDecisionId = useMemo(() => {
    const matched = pathname.match(/\/decisions\/([^/?#]+)/);
    return matched?.[1] ?? null;
  }, [pathname]);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const currentDecisionQuestions = useMemo(
    () => openQuestions.filter((question) => question.decisionId === currentDecisionId),
    [currentDecisionId, openQuestions],
  );
  const otherQuestions = useMemo(
    () => openQuestions.filter((question) => question.decisionId !== currentDecisionId),
    [currentDecisionId, openQuestions],
  );
  const fallbackQuestionId =
    currentDecisionQuestions[0]?.questionId ?? otherQuestions[0]?.questionId ?? null;
  const activeQuestionId =
    selectedQuestionId && openQuestions.some((question) => question.questionId === selectedQuestionId)
      ? selectedQuestionId
      : fallbackQuestionId;

  async function handleSendReply(question: InsufficientQuestion, text: string) {
    if (!onRefresh) return;
    const optimisticMsg: ChatMessage = {
      messageId: `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      threadId: "",
      projectId,
      decisionId: question.decisionId,
      actionId: question.actionId,
      questionId: question.questionId,
      sender: "user",
      kind: "ANSWER",
      text,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    try {
      const { threadId } = await createDecisionThread(
        projectId,
        question.decisionId,
        getIdToken,
      );
      await postThreadMessage(
        threadId,
        {
          senderType: "USER",
          format: "ANSWER_SET",
          content: text,
          metadata: { questionId: question.questionId },
          relatesTo: {
            projectId,
            decisionId: question.decisionId,
            actionId: question.actionId,
          },
        },
        getIdToken,
      );
      await onRefresh();
      setOptimisticMessages((prev) => prev.filter((m) => m.messageId !== optimisticMsg.messageId));
    } catch {
      // エラー時は楽観的メッセージを残して表示を維持
    }
  }

  function openDetailChatAndClose(decisionId: string) {
    closePanel();
    router.push(ROUTES.chat(projectId, decisionId));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel]);

  function getMessagesForQuestion(question: InsufficientQuestion) {
    const server = chatMessages
      .filter((message) => message.decisionId === question.decisionId)
      .slice(-20);
    const optimistic = optimisticMessages.filter((m) => m.decisionId === question.decisionId);
    const merged = [...server, ...optimistic].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const deduped = merged.filter((m) => {
      if (!m.messageId.startsWith("opt-")) return true;
      const hasMatchingServer = server.some(
        (s) =>
          s.decisionId === m.decisionId &&
          s.text === m.text &&
          Math.abs(new Date(s.createdAt).getTime() - new Date(m.createdAt).getTime()) < 10000,
      );
      return !hasMatchingServer;
    });
    return deduped.slice(-20);
  }

  function renderTicketWithInlineChat(question: InsufficientQuestion) {
    const isActive = activeQuestionId === question.questionId;
    const messages = getMessagesForQuestion(question);

    return (
      <div key={question.questionId} className="space-y-2">
        <button
          type="button"
          className={cn(
            "w-full rounded-[10px] px-3 py-2 text-left transition-colors",
            isActive
              ? "bg-blue-50 ring-1 ring-blue-200"
              : "border border-neutral-200 hover:bg-neutral-50",
          )}
          onClick={() => setSelectedQuestionId(question.questionId)}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-900">{question.title}</p>
            <span className="text-[11px] text-neutral-500">{question.source === "agent" ? "AI" : "USER"}</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-600">
            {getQuestionTargetPath(question, decisions, actions)}
          </p>
          <p className="text-[11px] text-neutral-600">
            不足: {question.missingFields.map(getMissingFieldLabel).join(" / ")}
          </p>
        </button>
        {isActive ? (
          <div className="ml-2 space-y-2 rounded-[10px] border border-blue-100 bg-blue-50/30 p-2">
            <SimpleChatUI
              messages={messages}
              onSend={(text) => handleSendReply(question, text)}
              placeholder="回答を入力"
              compact
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => openDetailChatAndClose(question.decisionId)}
            >
              詳細チャットで開く
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderTicketSection(title: string, items: InsufficientQuestion[]) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">{title}</p>
        {items.length === 0 ? (
          <p className="rounded-[8px] bg-neutral-50 px-2 py-2 text-xs text-neutral-500">該当なし</p>
        ) : (
          items.map((q) => renderTicketWithInlineChat(q))
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-64px)] border-l border-neutral-200 bg-white transition-all duration-200",
        isOpen ? "w-[360px] p-4" : "w-0 overflow-hidden p-0",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={tab === "chat" ? "secondary" : "ghost"}
            onClick={() => openPanel("chat")}
          >
            <MessageSquare className="mr-1 size-3" />
            チャット
          </Button>
          <Button
            size="sm"
            variant={tab === "log" ? "secondary" : "ghost"}
            onClick={() => openPanel("log")}
          >
            <Logs className="mr-1 size-3" />
            エージェントログ
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={closePanel}>
          <X className="mr-1 size-3" />
          閉じる
        </Button>
      </div>
      <Card className="h-[calc(100%-52px)] space-y-3 overflow-auto">
        {tab === "chat" ? (
          <>
            <p className="text-sm font-medium text-neutral-900">チケット ({openQuestions.length})</p>
            {openQuestions.length === 0 ? (
              <p className="text-xs text-neutral-600">OPEN のチケットはありません。</p>
            ) : (
              <>
                {renderTicketSection("この決裁に関するチケット", currentDecisionQuestions)}
                {renderTicketSection("その他のチケット", otherQuestions)}
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-900">エージェントログ</p>
            {logs.length === 0 ? (
              <p className="text-xs text-neutral-600">ログはありません。</p>
            ) : (
              logs.map((line) => (
                <p key={line} className="text-xs text-neutral-600">
                  {line}
                </p>
              ))
            )}
          </>
        )}
      </Card>
    </aside>
  );
}

export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const panelState = useRightPanelState();
  const { projects } = useDemoProjects();
  const { snapshot, refresh } = useDemoProjectSnapshot(projectId);
  const currentProject =
    snapshot?.project ?? projects.find((project) => project.projectId === projectId) ?? null;
  const decisions = snapshot?.decisions ?? [];
  const meetings = snapshot?.meetings ?? [];
  const actions = snapshot?.actions ?? [];
  const chatMessages = snapshot?.chatMessages ?? [];
  const openQuestions = (snapshot?.insufficientQuestions ?? []).filter(
    (item) => item.status === "OPEN",
  );
  const logs = snapshot?.agentLogs ?? [];
  const showMeetingMemoEntry = decisions.length === 0;

  return (
    <RightPanelContext.Provider value={panelState}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <Header
          projectId={projectId}
          projects={projects}
          currentProject={currentProject}
          decisions={decisions}
          meetings={meetings}
          actions={actions}
          showMeetingMemoEntry={showMeetingMemoEntry}
        />
        <div className="mx-auto flex max-w-[1600px]">
          <Sidebar projectId={projectId} />
          <main className="min-h-[calc(100vh-64px)] flex-1 p-6">{children}</main>
          <RightPanel
            projectId={projectId}
            openQuestions={openQuestions}
            decisions={decisions}
            actions={actions}
            chatMessages={chatMessages}
            logs={logs}
            onRefresh={refresh}
          />
        </div>
      </div>
    </RightPanelContext.Provider>
  );
}

export function ProjectSwitcherLinks() {
  const { projects } = useDemoProjects();
  return (
    <div className="grid gap-2">
      {projects.map((project) => (
        <Link key={project.projectId} href={ROUTES.projectHome(project.projectId)}>
          {project.name}
        </Link>
      ))}
    </div>
  );
}

export function OpenChatIcon() {
  return <MessageSquare className="size-4" />;
}

export function OpenLogIcon() {
  return <Logs className="size-4" />;
}

export function ReadyIcon() {
  return <SquareCheck className="size-4" />;
}

export function TodoIcon() {
  return <ListTodo className="size-4" />;
}
