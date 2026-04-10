<template>
  <header class="w-full bg-white border-b border-slate-200">
    <div class="flex justify-between items-center px-6 py-3 space-x-3">
      <div class="flex gap-4">
        <!-- Course Dropdown -->
        <div class="relative">
          <button
            @click="isDropdownOpen = !isDropdownOpen; isYearDropdownOpen = false"
            class="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 group"
          >
            <span class="text-sm font-medium">{{ selectedAlunoId || 'Selecionar Aluno' }}</span>
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>
  
          <div
            v-if="isDropdownOpen"
            class="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
          >
            <div class="py-1">
              <button
                v-for="displayName in Object.keys(alunoIds)"
                :key="displayName"
                @click="selectAlunoId(displayName)"
                :class="[
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  selectedAlunoId === displayName
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                ]"
              >
                {{ displayName }}
              </button>
            </div>
          </div>
        </div>
  
        <!-- Year Dropdown -->
        <div class="relative">
          <button
            @click="isYearDropdownOpen = !isYearDropdownOpen; isDropdownOpen = false"
            class="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200"
          >
            <span class="text-sm font-medium">{{ selectedYear || 'Selecionar Ano' }}</span>
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isYearDropdownOpen }" />
          </button>
  
          <div
            v-if="isYearDropdownOpen"
            class="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
          >
            <div class="py-1">
              <button
                v-for="year in availableYears"
                :key="year"
                @click="selectYear(year)"
                :class="[
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  selectedYear === year
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                ]"
              >
                {{ year }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- User profile -->
      <div class="flex items-center space-x-3">
        <div class="hidden sm:block text-right">
          <p class="text-sm font-semibold text-slate-900">{{ studentName || 'Estudante' }}</p>
          <p class="text-xs text-slate-500">{{ studentCourse ? studentCourse.split('-')[0].trim() : 'Curso' }}</p>
        </div>
        <div v-if="studentPhotoUrl" class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-200 shadow-sm hover:ring-blue-400 transition-all duration-200">
          <img :src="studentPhotoUrl" :alt="studentName || 'Estudante'" class="w-full h-full object-cover"/>
        </div>
        <div v-else class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-200 bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">{{ (studentName ? studentName[0] : 'E').toUpperCase() }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';

const isDropdownOpen = ref(false);
const isYearDropdownOpen = ref(false);
const alunoIds = ref<Record<string, string>>({});
const selectedAlunoId = ref<string | null>(null);
const availableYears = ref<string[]>([]);
const selectedYear = ref<string | null>(null);
const studentName = ref<string | null>(null);
const studentCourse = ref<string | null>(null);
const studentPhotoUrl = ref<string | null>(null);

type StudentInfo = {
  photo_data: string | null;
  student_name: string;
  course: string;
};

const fetchStudentInfo = async () => {
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
