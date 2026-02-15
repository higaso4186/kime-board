"use client";

import Link from "next/link";
import { Search, PencilLine, Save, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  decisionStatusLabels,
  projectCreationDefaults,
  type Project,
} from "@/lib/mock/data";
import { useDemoProjects } from "@/lib/hooks/use-demo-api";
import { createDemoProject, patchDemoProject } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routes";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductLogo } from "@/components/ui/product-logo";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, loading, error, refresh } = useDemoProjects();
  const { user, signOut, getIdToken } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    setItems(projects);
  }, [projects]);

  const filtered = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return items;
    return items.filter(
      (project) =>
        project.name.includes(normalized) || project.description.includes(normalized),
    );
  }, [items, query]);

  function patchProject(projectId: string, patch: Partial<Project>) {
    setItems((prev) =>
      prev.map((project) =>
        project.projectId === projectId ? { ...project, ...patch } : project,
      ),
    );
  }

  async function saveProject(projectId: string, project: Project) {
    try {
      await patchDemoProject(projectId, {
        name: project.name,
        description: project.description,
      }, getIdToken);
      await refresh();
      setEditingId(null);
      setNotice(`${project.name} を保存しました`);
    } catch (e) {
      setNotice(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function createProject() {
    if (!newName.trim()) return;

    try {
      const { projectId } = await createDemoProject(
        {
          name: newName,
          description: newDescription || projectCreationDefaults.description,
        },
        getIdToken,
      );
      await refresh();
      setOpenModal(false);
      setNewName("");
      setNewDescription("");
      setNotice(`プロジェクト「${newName}」を作成しました`);
      router.push(ROUTES.projectHome(projectId));
    } catch (e) {
      setNotice(`作成に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white px-8">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4">
          <div className="w-48">
            <ProductLogo />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="プロジェクトを検索"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setOpenModal(true)}>
            <Plus className="mr-1 size-4" />
            新規プロジェクト
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-8 py-6">
        {notice ? (
          <p className="mb-4 rounded-[10px] border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            プロジェクト取得に失敗しました: {error}
          </p>
        ) : null}
        {loading && items.length === 0 ? (
          <p className="mb-4 text-sm text-neutral-500">プロジェクトを読み込み中...</p>
        ) : null}
        <Card className="mb-4 flex items-center justify-between">
          <div>
            <CardDescription>ユーザーメニュー</CardDescription>
            <CardTitle className="mt-1 text-base">
              {user?.displayName?.trim() || "名前未設定"}
            </CardTitle>
            <p className="text-xs text-neutral-500">{user?.email ?? "メール未設定"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut().then(() => router.push(ROUTES.login))}
          >
            ログアウト
          </Button>
        </Card>

        <section className="grid grid-cols-3 gap-6">
          {filtered.map((project) => {
            const isEditing = editingId === project.projectId;
            return (
              <Card key={project.projectId} className="h-[260px]">
                <div className="flex items-start justify-between">
                  {isEditing ? (
                    <Input
                      value={project.name}
                      onChange={(event) =>
                        patchProject(project.projectId, { name: event.target.value })
                      }
                    />
                  ) : (
                    <CardTitle>{project.name}</CardTitle>
                  )}
                  {isEditing ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => saveProject(project.projectId, project)}
                    >
                      <Save className="mr-1 size-3" />
                      保存
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(project.projectId)}
                    >
                      <PencilLine className="mr-1 size-3" />
                      編集
                    </Button>
                  )}
                </div>

                <div className="mt-3">
                  {isEditing ? (
                    <Textarea
                      value={project.description}
                      onChange={(event) =>
                        patchProject(project.projectId, {
                          description: event.target.value,
                        })
                      }
                      className="min-h-16"
                    />
                  ) : (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Metric label="未決決裁" value={project.undecided} />
                  <Metric label={decisionStatusLabels.READY_TO_DECIDE} value={project.ready} />
                  <Metric label="期限超過アクション" value={project.overdue} />
                  <Metric label="決裁者未設定" value={project.missingOwner} />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                  <span>次回会議: {formatDate(project.nextMeetingAt)}</span>
                  <Link
                    href={ROUTES.projectHome(project.projectId)}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    開く
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      </main>

      {openModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/30 p-4">
          <Card className="w-full max-w-md space-y-4">
            <CardTitle>新規プロジェクト作成</CardTitle>
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">プロジェクト名</label>
              <Input value={newName} onChange={(event) => setNewName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">説明</label>
              <Textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenModal(false)}>
                キャンセル
              </Button>
              <Button onClick={createProject}>作成</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
