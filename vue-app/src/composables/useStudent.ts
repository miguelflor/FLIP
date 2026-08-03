import { computed, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

type StudentInfo = {
  photo_data: string | null;
  student_name: string;
  course: string;
};

const alunoIds = ref<Record<string, string>>({});
const selectedAlunoId = ref<string | null>(null);

const studentName = ref<string | null>(null);
const studentCourse = ref<string | null>(null);
const studentPhotoUrl = ref<string | null>(null);
const loadingStudentInfo = ref(false);
const currentLoadedId = ref<string | null>(null);

const currentStudentId = computed(() => {
  if (!selectedAlunoId.value) return null;
  return alunoIds.value[selectedAlunoId.value] ?? null;
});

const fetchInfo = async (studentId: string, force = false) => {
  if (!force && currentLoadedId.value === studentId) return;

  loadingStudentInfo.value = true;
  try {
    const sessionId = localStorage.getItem('clipSessionId');
    if (!sessionId) return;

    const res = await invoke<StudentInfo>('get_student_info', {
      sessionId,
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

const init = () => {
  const storedIds = localStorage.getItem('student_ids');
  if (storedIds) {
    try {
      alunoIds.value = JSON.parse(storedIds);
    } catch (e) {
      console.error('Failed to parse student_ids', e);
    }
  }

  selectedAlunoId.value = localStorage.getItem('selected_aluno_id');

  if (currentStudentId.value) {
    fetchInfo(currentStudentId.value);
  }
};

const selectStudent = (displayName: string) => {
  selectedAlunoId.value = displayName;
  localStorage.setItem('selected_aluno_id', displayName);

  const studentId = alunoIds.value[displayName];
  localStorage.setItem('selected_student_id', studentId);
  fetchInfo(studentId, true);
};

export function useStudent() {
  return {
    alunoIds,
    selectedAlunoId,
    currentStudentId,
    studentName,
    studentCourse,
    studentPhotoUrl,
    loadingStudentInfo,
    init,
    selectStudent,
  };
}
