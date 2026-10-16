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
      <BaseDropdown
        :options="periodOptions"
        :selected="selectedPeriod && PERIOD_LABELS[selectedPeriod]"
        :disabled="periodOptions.length <= 1"
        placeholder="Selecionar Período"
        @select="selectPeriodLabel"
      />
    </div>

    <!-- Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4 sm:gap-6">
      <ScheduleCard
        :student-id="currentStudentId"
        :year="selectedYear"
        :period="selectedPeriod"
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

const PERIOD_LABELS = {
  s1: '1º Semestre',
  s2: '2º Semestre',
  t1: '1º Trimestre',
  t2: '2º Trimestre',
} as const;
type Period = keyof typeof PERIOD_LABELS;

// A period exists in a year when the student has units in it.
const { data: chairsResponse } = useClipQuery<{
  success: boolean;
  chairs?: Record<Period, unknown[]>;
}>('get_chairs', currentStudentId, selectedYear);

const availablePeriods = computed(() => {
  const chairs = chairsResponse.value?.chairs;
  if (!chairs) return [];
  return (Object.keys(PERIOD_LABELS) as Period[]).filter((p) => chairs[p]?.length);
});

const periodOptions = computed(() => availablePeriods.value.map((p) => PERIOD_LABELS[p]));

const selectedPeriod = ref(storage.get('selectedPeriod') as Period | null);

const selectPeriod = (period: Period) => {
  selectedPeriod.value = period;
  storage.set('selectedPeriod', period);
};

const selectPeriodLabel = (label: string) => {
  const period = availablePeriods.value.find((p) => PERIOD_LABELS[p] === label);
  if (period) selectPeriod(period);
};

// Fall back to today's semester (23 Feb – 1 Sep is the 2nd), else the first period offered.
watch(availablePeriods, (periods) => {
  if (!periods.length || (selectedPeriod.value && periods.includes(selectedPeriod.value))) return;
  const today = new Date();
  const md = (today.getMonth() + 1) * 100 + today.getDate();
  const current: Period = md >= 223 && md < 902 ? 's2' : 's1';
  selectPeriod(periods.includes(current) ? current : periods[0]);
});

const selectYear = (year: string) => {
  selectedYear.value = year;
  storage.set('selectedYear', year);
};
</script>
