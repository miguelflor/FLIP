<template>
  <header class="w-full bg-white border-b border-slate-200">
    <div class="flex justify-between items-center gap-3 px-4 sm:px-6 py-3">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Sidebar toggle -->
        <button
          @click="emit('toggle-sidebar')"
          class="shrink-0 p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Alternar menu"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div class="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <!-- Course Dropdown -->
          <Dropdown
            :options="Object.keys(alunoIds)"
            :selected="selectedAlunoId"
            placeholder="Selecionar Aluno"
            :open="isDropdownOpen"
            @select="selectAlunoId"
            @update:open="(v) => { isDropdownOpen = v; if (v) isYearDropdownOpen = false; }"
          />

          <!-- Year Dropdown -->
          <Dropdown
            :options="availableYears"
            :selected="selectedYear"
            placeholder="Selecionar Ano"
            :open="isYearDropdownOpen"
            @select="selectYear"
            @update:open="(v) => { isYearDropdownOpen = v; if (v) isDropdownOpen = false; }"
          />
        </div>
      </div>

      <!-- User profile -->
      <div class="shrink-0">
        <UserProfile
          :name="studentName"
          :course="studentCourse"
          :photo-url="studentPhotoUrl"
          :loading="loadingStudentInfo"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { Menu } from 'lucide-vue-next';
import Dropdown from './Dropdown.vue';
import UserProfile from './UserProfile.vue';

const emit = defineEmits<{
  'toggle-sidebar': [];
}>();

const isDropdownOpen = ref(false);
const isYearDropdownOpen = ref(false);
const alunoIds = ref<Record<string, string>>({});
const selectedAlunoId = ref<string | null>(null);
const availableYears = ref<string[]>([]);
const selectedYear = ref<string | null>(null);
const studentName = ref<string | null>(null);
const studentCourse = ref<string | null>(null);
const studentPhotoUrl = ref<string | null>(null);
const loadingStudentInfo = ref(true);

type StudentInfo = {
  photo_data: string | null;
  student_name: string;
  course: string;
};

const fetchStudentInfo = async () => {
  loadingStudentInfo.value = true;
  try {
    const sessionId = localStorage.getItem('clipSessionId');
    if (!sessionId) return;

    const res = await invoke<StudentInfo>('get_student_info', {
      sessionId,
      studentId: alunoIds.value[selectedAlunoId.value || ''],
    });

    studentName.value = res.student_name;
    studentCourse.value = res.course;
    studentPhotoUrl.value = res.photo_data ? `data:image/jpeg;base64,${res.photo_data}` : null;
  } catch (e) {
    console.error('Error fetching student info:', e);
  } finally {
    loadingStudentInfo.value = false;
  }
};

const fetchAvailableYears = async (studentId: string) => {
  try {
    const sessionId = localStorage.getItem('clipSessionId');
    if (!sessionId) return;

    const res = await invoke<{ success: boolean; years: string[] }>('get_available_years', {
      sessionId,
      studentId,
    });

    if (res.success) {
      availableYears.value = res.years;
      // Set first year as default if not already selected
      if (res.years.length > 0 && !selectedYear.value) {
        selectedYear.value = res.years[0];
        localStorage.setItem('selected_year', selectedYear.value);
        // Emit event when years are loaded with default year selected
        window.dispatchEvent(new CustomEvent('years-loaded', { detail: { year: selectedYear.value } }));
      }
    }
  } catch (e) {
    console.error('Error fetching years:', e);
  }
};

onMounted(() => {
  // Load aluno_ids from local storage
  const storedIds = localStorage.getItem('student_ids');
  if (storedIds) {
    try {
      alunoIds.value = JSON.parse(storedIds);
    } catch (e) {
      console.error('Failed to parse student_ids', e);
    }
  }

  let selected_aluno_id = localStorage.getItem('selected_aluno_id');
  selectedAlunoId.value = selected_aluno_id;
  fetchStudentInfo();
  selectedYear.value = localStorage.getItem('selected_year');

  // Load years and emit event with the actual student_id if available
  if (selected_aluno_id && alunoIds.value[selected_aluno_id]) {
    const studentId = alunoIds.value[selected_aluno_id];
    localStorage.setItem('selected_student_id', studentId);
    fetchAvailableYears(studentId);
  }
});

const selectAlunoId = (displayName: string) => {
  selectedAlunoId.value = displayName;
  localStorage.setItem('selected_aluno_id', displayName);
  isDropdownOpen.value = false;

  // Reset year dropdown
  availableYears.value = [];
  selectedYear.value = null;
  isYearDropdownOpen.value = false;

  // Emit event to reload files with actual student_id
  const studentId = alunoIds.value[displayName];
  localStorage.setItem('selected_student_id', studentId);
  fetchAvailableYears(studentId);
  fetchStudentInfo();
};

const selectYear = (year: string) => {
  selectedYear.value = year;
  localStorage.setItem('selected_year', year);
  isYearDropdownOpen.value = false;

  // Emit event to reload files with the new year
  window.dispatchEvent(new CustomEvent('year-changed', { detail: { year } }));
};
</script>
