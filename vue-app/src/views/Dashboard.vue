<template>
  <div>
    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <Dropdown
        :options="Object.keys(alunoIds)"
        :selected="selectedAlunoId"
        placeholder="Selecionar Aluno"
        :open="isDropdownOpen"
        @select="selectAlunoId"
        @update:open="(v) => { isDropdownOpen = v; if (v) isYearDropdownOpen = false; }"
      />

      <Dropdown
        :options="availableYears"
        :selected="selectedYear"
        placeholder="Selecionar Ano"
        :open="isYearDropdownOpen"
        @select="selectYear"
        @update:open="(v) => { isYearDropdownOpen = v; if (v) isDropdownOpen = false; }"
      />
    </div>

    <!-- Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ScheduleCard />
      <PDFList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import Dropdown from '../components/Dropdown.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import PDFList from '../components/PDFList.vue';

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
      if (res.years.length > 0 && (!selectedYear.value || !res.years.includes(selectedYear.value))) {
        selectedYear.value = res.years[0];
        localStorage.setItem('selected_year', selectedYear.value);
        window.dispatchEvent(new CustomEvent('years-loaded', { detail: { year: selectedYear.value } }));
      }
    }
  } catch (e) {
    console.error('Error fetching years:', e);
  }
};

onMounted(() => {
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

  availableYears.value = [];
  selectedYear.value = null;
  isYearDropdownOpen.value = false;

  const studentId = alunoIds.value[displayName];
  localStorage.setItem('selected_student_id', studentId);
  fetchAvailableYears(studentId);
  window.dispatchEvent(new CustomEvent('student-changed'));
};

const selectYear = (year: string) => {
  selectedYear.value = year;
  localStorage.setItem('selected_year', year);
  isYearDropdownOpen.value = false;

  window.dispatchEvent(new CustomEvent('year-changed', { detail: { year } }));
};
</script>
