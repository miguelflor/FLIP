import { ref, watch, type Ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { extractYearForRequest } from '../lib/academic';
import { useStudent } from './useStudent';

export interface ClipQueryOptions {
  /** Message shown when there is no student to query for. Defaults to no error. */
  noStudentMessage?: string;
  /** Message shown when there is no active session. */
  noSessionMessage?: string;
  /** Extra command arguments; the query re-runs when they change. Null values are omitted. */
  params?: Ref<Record<string, string | null>>;
}

// Queries in progress across every panel; see whenIdle.
const inFlight = ref(0);
const { loadingStudentInfo } = useStudent();

/** Resolves once `busy()` is false, re-checking whenever what it reads changes. */
async function waitWhile(busy: () => boolean) {
  while (busy()) await new Promise((resolve) => watch(busy, resolve, { once: true }));
}

/**
 * Resolves once nothing on screen is loading (the panels and the student's name, course
 * and photo), so background work never competes with them for CLIP.
 */
export const whenIdle = () => waitWhile(() => inFlight.value > 0 || loadingStudentInfo.value);

/**
 * The name, course and photo take two CLIP requests in a row (the photo's URL is on the
 * profile page), so panels wait for them; otherwise the photo queues behind every panel and
 * the profile shows last. Instant when cached. Capped so a stuck profile can't blank the page.
 */
const PROFILE_HEAD_START_MS = 5000;
const profileFirst = () =>
  Promise.race([
    waitWhile(() => loadingStudentInfo.value),
    new Promise((resolve) => setTimeout(resolve, PROFILE_HEAD_START_MS)),
  ]);

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
    inFlight.value++;
    try {
      await profileFirst();
      if (runId !== latestRun) return;

      const params: Record<string, string | boolean> = {
        sessionId: sessionId.value,
        studentId: studentId.value,
        useCache,
      };
      if (year.value) params.year = extractYearForRequest(year.value);
      for (const [k, v] of Object.entries(options.params?.value ?? {})) {
        if (v !== null) params[k] = v;
      }

      const result = await invoke<T>(command, params);
      if (runId !== latestRun) return;
      data.value = result;
    } catch (e) {
      if (runId !== latestRun) return;
      console.error(`Error running "${command}":`, e);
      error.value = String(e);
    } finally {
      inFlight.value--;
      if (runId === latestRun) loading.value = false;
    }
  };

  watch([studentId, year, () => options.params?.value], () => run(), { immediate: true });

  return {
    data,
    loading,
    error,
    /** Re-runs the query, bypassing the backend cache. */
    refresh: () => run(false),
  };
}
