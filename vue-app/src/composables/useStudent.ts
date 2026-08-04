import { computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { storage } from '../lib/storage';

type StudentInfo = {
  photo_data: string | null;
  student_name: string;
  course: string;
};

// Session state, held in memory only: the Rust backend keeps each session as a
// live HTTP client in an in-memory map, so it cannot survive a process restart.
const sessionId = ref<string | null>(null);
const alunoIds = ref<Record<string, string>>({});

const selectedAlunoId = ref<string | null>(storage.get('selectedAlunoId'));

const studentName = ref<string | null>(null);
const studentCourse = ref<string | null>(null);
const studentPhotoUrl = ref<string | null>(null);
const loadingStudentInfo = ref(false);
const currentLoadedId = ref<string | null>(null);

const isAuthenticated = computed(() => sessionId.value !== null);

const currentStudentId = computed(() => {
  if (!selectedAlunoId.value) return null;
  return alunoIds.value[selectedAlunoId.value] ?? null;
});

const fetchInfo = async (studentId: string, force = false) => {
  if (!force && currentLoadedId.value === studentId) return;
  if (!sessionId.value) return;

  loadingStudentInfo.value = true;
  try {
    const res = await invoke<StudentInfo>('get_student_info', {
      sessionId: sessionId.value,
      studentId,
    });
    studentName.value = res.student_name;
    studentCourse.value = res.course;
    studentPhotoUrl.value = res.photo_data ? `data:image/jpeg;base64,${res.photo_data}` : null;
    currentLoadedId.value = studentId;
  } catch (e) {
    console.error('Error fetching student info:', e);
  } finally {
    loadingStudentInfo.value = false;
  }
};

/**
 * Records a successful login. The remembered student selection is kept if it is
 * still valid for this account, otherwise it falls back to the first aluno id.
 */
const startSession = (newSessionId: string, ids: Record<string, string>) => {
  sessionId.value = newSessionId;
  alunoIds.value = ids;

  const remembered = selectedAlunoId.value;
  const fallback = Object.keys(ids)[0] ?? null;
  selectStudent(remembered && remembered in ids ? remembered : fallback);
};

const endSession = () => {
  sessionId.value = null;
  alunoIds.value = {};
  studentName.value = null;
  studentCourse.value = null;
  studentPhotoUrl.value = null;
  currentLoadedId.value = null;
};

const selectStudent = (displayName: string | null) => {
  selectedAlunoId.value = displayName;
  storage.set('selectedAlunoId', displayName);

  const studentId = displayName ? alunoIds.value[displayName] : undefined;
  if (studentId) fetchInfo(studentId, true);
};

/** Loads info for the current selection, e.g. after a webview reload. */
const init = () => {
  if (currentStudentId.value) fetchInfo(currentStudentId.value);
};

export function useStudent() {
  return {
    sessionId,
    isAuthenticated,
    alunoIds,
    selectedAlunoId,
    currentStudentId,
    studentName,
    studentCourse,
    studentPhotoUrl,
    loadingStudentInfo,
    init,
    startSession,
    endSession,
    selectStudent,
  };
}
