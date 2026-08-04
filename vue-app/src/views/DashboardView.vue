<template>
  <div>
    <!-- Year filter -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <BaseDropdown
        :options="availableYears"
        :selected="selectedYear"
        placeholder="Selecionar Ano"
        @select="selectYear"
      />
    </div>

    <!-- Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ScheduleCard
        :student-id="currentStudentId"
        :year="selectedYear"
      />
      <DocView
        :student-id="currentStudentId"
        :year="selectedYear"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseDropdown from '../components/BaseDropdown.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import DocView from '../components/DocView.vue';
import { useStudent } from '../composables/useStudent';
import { useClipQuery } from '../composables/useClipQuery';
import { storage } from '../lib/storage';

const { currentStudentId } = useStudent();

const selectedYear = ref<string | null>(storage.get('selectedYear'));

// This command takes no year, so a constant ref keeps the query keyed on the
// student alone — defaulting selectedYear below therefore can't retrigger it.
const noYear = ref<string | null>(null);
const { data: yearsResponse } = useClipQuery<{ success: boolean; years: string[] }>(
  'get_available_years',
  currentStudentId,
  noYear,
);

const availableYears = computed(() => {
  const res = yearsResponse.value;
  return res?.success ? res.years : [];
});

// Fall back to the most recent year whenever the remembered one isn't offered.
watch(availableYears, (years) => {
  if (years.length && (!selectedYear.value || !years.includes(selectedYear.value))) {
    selectYear(years[0]);
  }
});

const selectYear = (year: string) => {
  selectedYear.value = year;
  storage.set('selectedYear', year);
};
</script>
