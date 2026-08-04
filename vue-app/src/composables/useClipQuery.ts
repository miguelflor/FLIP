import { ref, watch, type Ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { extractYearForRequest } from '../lib/academic';
import { useStudent } from './useStudent';

export interface ClipQueryOptions {
  /** Message shown when there is no student to query for. Defaults to no error. */
  noStudentMessage?: string;
  /** Message shown when there is no active session. */
  noSessionMessage?: string;
}

/**
 * Runs a Tauri command that is scoped to a student and academic year, and
 * re-runs it whenever either changes.
 *
 * Handles the shell every CLIP-backed panel needs: loading/error state, the
 * session guard, year normalisation and cache busting on manual refresh.
 */
export function useClipQuery<T>(
  command: string,
  studentId: Ref<string | null>,
  year: Ref<string | null>,
  options: ClipQueryOptions = {},
) {
  const { sessionId } = useStudent();

  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(true);
  const error = ref<string | null>(null);

  // Identifies the most recent run so a slow earlier request can't overwrite the
  // result of a later one when the student or year changes in quick succession.
  let latestRun = 0;

  const run = async (useCache = true) => {
    const runId = ++latestRun;

    if (!studentId.value) {
      error.value = options.noStudentMessage ?? null;
      loading.value = false;
      return;
    }

    if (!sessionId.value) {
      error.value = options.noSessionMessage ?? 'Sessão não encontrada';
      loading.value = false;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, string | boolean> = {
        sessionId: sessionId.value,
        studentId: studentId.value,
        useCache,
      };
      if (year.value) params.year = extractYearForRequest(year.value);

      const result = await invoke<T>(command, params);
      if (runId !== latestRun) return;
      data.value = result;
    } catch (e) {
      if (runId !== latestRun) return;
      console.error(`Error running "${command}":`, e);
      error.value = String(e);
    } finally {
      if (runId === latestRun) loading.value = false;
    }
  };

  watch([studentId, year], () => run(), { immediate: true });

  return {
    data,
    loading,
    error,
    /** Re-runs the query, bypassing the backend cache. */
    refresh: () => run(false),
  };
}
