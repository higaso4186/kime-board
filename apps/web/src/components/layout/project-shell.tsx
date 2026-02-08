"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  Kanban,
  Calendar,
  ShieldAlert,
  Users,
  MessageSquare,
  Logs,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Plus,
  SquareCheck,
  ListTodo,
  X,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  getMissingFieldLabel,
  getOpenQuestions,
  getProject,
  getQuestionTargetPath,
  projects,
  searchProjectItems,
} from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ProductLogo } from "@/components/ui/product-logo";

type PanelTab = "chat" | "log";

type RightPanelContextValue = {
  isOpen: boolean;
  tab: PanelTab;
  openPanel: (nextTab?: PanelTab) => void;
  closePanel: () => void;
  togglePanel: () => void;
};

const RightPanelContext = createContext<RightPanelContextValue | null>(null);

function useRightPanelState() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("chat");

  return useMemo(
    () => ({
      isOpen,
      tab,
      openPanel: (nextTab: PanelTab = "chat") => {
        setTab(nextTab);
        setIsOpen(true);
      },
      closePanel: () => setIsOpen(false),
      togglePanel: () => setIsOpen((prev) => !prev),
    }),
    [isOpen, tab],
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
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm transition",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-neutral-700 hover:bg-neutral-100",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Header({ projectId }: { projectId: string }) {
  const router = useRouter();
  const currentProject = getProject(projectId) ?? projects[0];
  const { isOpen, togglePanel } = useRightPanel();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchProjectItems(projectId, query),
    [projectId, query],
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-neutral-200 bg-white px-6">
      <div className="flex w-[360px] items-center gap-3">
        <ProductLogo />
        <Select
          controlSize="sm"
          className="max-w-[200px]"
          value={currentProject.projectId}
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
        <Button variant="secondary" size="sm" asChild>
          <Link href={ROUTES.meetingNew(projectId)}>
            <Plus className="mr-1 size-3" />
            新規会議メモ
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.decisionDetail(projectId, "dcs_01")}>新規決裁</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.decisionDetail(projectId, "dcs_02")}>新規アクション</Link>
        </Button>
        <Button variant="outline" size="sm">
          <Bell className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={togglePanel}>
          {isOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </Button>
      </div>
    </header>
  );
}

function Sidebar({ projectId }: { projectId: string }) {
  return (
    <aside className="sticky top-16 h-[calc(100vh-64px)] w-[280px] border-r border-neutral-200 bg-white p-4">
      <p className="mb-2 text-xs font-medium text-neutral-500">プロジェクト</p>
      <div className="space-y-1">
        <SidebarItem
          href={ROUTES.decisions(projectId)}
          label="決裁"
          icon={<Kanban className="size-4" />}
        />
        <SidebarItem
          href={ROUTES.meetings(projectId)}
          label="会議"
          icon={<Calendar className="size-4" />}
        />
      </div>
      <p className="mb-2 mt-6 text-xs font-medium text-neutral-500">管理権限</p>
      <div className="space-y-1">
        <SidebarItem
          href={ROUTES.projectHome(projectId)}
          label="ダッシュボード"
          icon={<LayoutDashboard className="size-4" />}
        />
        <SidebarItem
          href={ROUTES.exec(projectId)}
          label="管理職ビュー"
          icon={<ShieldAlert className="size-4" />}
        />
        <SidebarItem
          href={ROUTES.members(projectId)}
          label="ロール/メンバー"
          icon={<Users className="size-4" />}
        />
      </div>
    </aside>
  );
}

function RightPanel({ projectId }: { projectId: string }) {
  const { isOpen, tab, openPanel, closePanel } = useRightPanel();
  const openQuestions = getOpenQuestions(projectId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePanel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel]);

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
            <p className="text-sm font-medium text-neutral-900">不足質問 ({openQuestions.length})</p>
            {openQuestions.length === 0 ? (
              <p className="text-xs text-neutral-600">OPEN の不足質問はありません。</p>
            ) : (
              openQuestions.slice(0, 6).map((question) => (
                <div
                  key={question.questionId}
                  className="rounded-[10px] border border-neutral-200 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-neutral-900">{question.title}</p>
                    <span className="text-[11px] text-neutral-500">
                      {question.source === "agent" ? "AI" : "USER"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-600">{getQuestionTargetPath(question)}</p>
                  <p className="text-[11px] text-neutral-600">
                    不足: {question.missingFields.map(getMissingFieldLabel).join(" / ")}
                  </p>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-900">エージェントログ</p>
            <p className="text-xs text-neutral-600">[t+0.3s] Decision候補: 3件抽出</p>
            <p className="text-xs text-neutral-600">[t+0.8s] 既存Decisionへのマージ候補: 1件</p>
            <p className="text-xs text-neutral-600">[t+1.2s] 不足質問: 2件生成</p>
            <p className="text-xs text-neutral-600">[t+1.6s] READY判定を再計算</p>
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

  return (
    <RightPanelContext.Provider value={panelState}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <Header projectId={projectId} />
        <div className="mx-auto flex max-w-[1600px]">
          <Sidebar projectId={projectId} />
          <main className="min-h-[calc(100vh-64px)] flex-1 p-6">{children}</main>
          <RightPanel projectId={projectId} />
        </div>
      </div>
    </RightPanelContext.Provider>
  );
}

export function ProjectSwitcherLinks() {
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
