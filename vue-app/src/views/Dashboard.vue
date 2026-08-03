<template>
  <div>
    <!-- Year filter -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <Dropdown
        :options="availableYears"
        :selected="selectedYear"
        placeholder="Selecionar Ano"
        :open="isYearDropdownOpen"
        @select="handleSelectYear"
        @update:open="(v) => isYearDropdownOpen = v"
      />
    </div>

    <!-- Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ScheduleCard :student-id="currentStudentId" :year="selectedYear" />
      <PDFList :student-id="currentStudentId" :year="selectedYear" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import Dropdown from '../components/Dropdown.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import PDFList from '../components/PDFList.vue';
import { useStudent } from '../composables/useStudent';

const { currentStudentId } = useStudent();

const selectedYear = ref<string | null>(null);
const availableYears = ref<string[]>([]);
const isYearDropdownOpen = ref(false);

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
      }
    }
  } catch (e) {
    console.error('Error fetching years:', e);
  }
};

onMounted(() => {
  selectedYear.value = localStorage.getItem('selected_year');

  if (currentStudentId.value) {
    fetchAvailableYears(currentStudentId.value);
  }
});

watch(currentStudentId, (newId) => {
  if (newId) {
    availableYears.value = [];
    selectedYear.value = null;
    fetchAvailableYears(newId);
  }
});

const handleSelectYear = (year: string) => {
  selectedYear.value = year;
  localStorage.setItem('selected_year', year);
  isYearDropdownOpen.value = false;
};
</script>
