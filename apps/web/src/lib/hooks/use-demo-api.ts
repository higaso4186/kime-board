"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchDemoProjectSnapshot, fetchDemoProjects, type ProjectSnapshot } from "@/lib/api/demo";
import { useAuth } from "@/contexts/auth-context";
import type { Project } from "@/lib/mock/data";

export function useDemoProjects() {
  const { getIdToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchDemoProjects(getIdToken);
      setProjects(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "プロジェクト取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { projects, loading, error, refresh };
}

export function useDemoProjectSnapshot(projectId: string) {
  const { getIdToken } = useAuth();
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await fetchDemoProjectSnapshot(projectId, getIdToken);
      setSnapshot(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "プロジェクトデータ取得に失敗しました");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, getIdToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshot, loading, error, refresh };
}
