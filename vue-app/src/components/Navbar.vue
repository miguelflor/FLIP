<template>
  <header class="w-full bg-white border-slate-200 shadow-sm">
    <div class="flex justify-between items-center px-6 py-4">
      <!-- Left section -->
      <div class="flex items-center space-x-4">
        <!-- Mobile menu button -->
        <button class="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu class="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <!-- Right section -->
      <div class="flex items-center space-x-2">
        <!-- Aluno ID Dropdown -->
        <div class="relative">
          <button
            @click="isDropdownOpen = !isDropdownOpen; isYearDropdownOpen = false"
            class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span class="text-sm font-medium">{{ selectedAlunoId || 'Selecionar' }}</span>
            <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isDropdownOpen"
            class="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
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
            class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span class="text-sm font-medium">{{ selectedYear || 'Ano' }}</span>
            <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': isYearDropdownOpen }" />
          </button>

          <!-- Year Dropdown menu -->
          <div
            v-if="isYearDropdownOpen"
            class="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
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

        <!-- User profile -->
        <div class="flex items-center space-x-3 ml-4">
          <div class="hidden sm:block text-right">
            <p class="text-sm font-medium text-slate-900">Estudante</p>
            <p class="text-xs text-slate-500">Online</p>
          </div>
          <div class="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span class="text-slate-600 font-medium text-sm">E</span>
          </div>
        </div>

        <!-- Logout button -->
        <button
          class="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group ml-2"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 group-hover:text-red-700" />
          <span class="text-sm font-medium group-hover:text-red-700 hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { LogOut, Menu, ChevronDown } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';

const router = useRouter();

type StudentInfo = {
  name: string;
  course: string;
  photoUrl: string;
};

const isDropdownOpen = ref(false);
const isYearDropdownOpen = ref(false);
const alunoIds = ref<Record<string, string>>({});
const selectedAlunoId = ref<string | null>(null);
const availableYears = ref<string[]>([]);
const selectedYear = ref<string | null>(null);

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
};

const selectYear = (year: string) => {
  selectedYear.value = year;
  localStorage.setItem('selected_year', year);
  isYearDropdownOpen.value = false;

  // Emit event to reload files with the new year
  window.dispatchEvent(new CustomEvent('year-changed', { detail: { year } }));
};

const handleLogout = () => {
  router.push('/');
  localStorage.clear();
};
</script>
