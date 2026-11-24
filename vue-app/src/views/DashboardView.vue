<template>
  <div>
    <!-- Year filter -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
      <BaseDropdown
        :options="availableYears"
        :selected="selectedYear"
        :placeholder="t('dashboard.selectYear')"
        @select="selectYear"
      />
      <BaseDropdown
        :options="periodOptions"
        :selected="selectedPeriod && periodLabel(selectedPeriod)"
        :disabled="periodOptions.length <= 1"
        :placeholder="t('dashboard.selectPeriod')"
        @select="selectPeriodLabel"
      />
    </div>

    <!-- Panels -->
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4 sm:gap-6">
      <ScheduleCard
        :student-id="currentStudentId"
        :year="selectedYear"
        :period="selectedPeriod"
      />
      <div class="space-y-4 sm:space-y-6">
        <TestsCard
          v-if="isCurrentPeriod"
          :student-id="currentStudentId"
          :year="selectedYear"
          :period="selectedPeriod"
        />
        <DocView
          :student-id="currentStudentId"
          :year="selectedYear"
          :period="selectedPeriod"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BaseDropdown from '../components/BaseDropdown.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import DocView from '../components/DocView.vue';
import TestsCard from '../components/TestsCard.vue';
import { useStudent } from '../composables/useStudent';
import { useClipQuery } from '../composables/useClipQuery';
import { storage } from '../lib/storage';
import { t } from '../lib/i18n';
import {
  currentLectiveYear,
  currentPeriod as todaysPeriod,
  extractYearForRequest,
  type Period,
} from '../lib/academic';

const { currentStudentId } = useStudent();

const selectedYear = ref<string | null>(storage.get('selectedYear'));

// This command takes no year, so it is keyed on the student alone: defaulting
// selectedYear below can't retrigger it.
const { data: yearsResponse } = useClipQuery<{ success: boolean; years: string[] }>(
  'get_available_years',
  currentStudentId,
  null,
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

const PERIODS: Period[] = ['s1', 's2', 't1', 't2'];
const periodLabel = (period: Period) => t(`period.${period}`);

// A period exists in a year when the student has units in it.
const { data: chairsResponse } = useClipQuery<{
  success: boolean;
  chairs?: Record<Period, unknown[]>;
}>('get_chairs', currentStudentId, selectedYear);

const availablePeriods = computed(() => {
  const chairs = chairsResponse.value?.chairs;
  if (!chairs) return [];
  return PERIODS.filter((p) => chairs[p]?.length);
});

const periodOptions = computed(() => availablePeriods.value.map(periodLabel));

const selectedPeriod = ref(storage.get('selectedPeriod') as Period | null);

const selectPeriod = (period: Period) => {
  selectedPeriod.value = period;
  storage.set('selectedPeriod', period);
};

const selectPeriodLabel = (label: string) => {
  const period = availablePeriods.value.find((p) => periodLabel(p) === label);
  if (period) selectPeriod(period);
};

const currentPeriod = todaysPeriod();
const currentYear = currentLectiveYear();

// CLIP's tests page only lists the current semester
const isCurrentPeriod = computed(
  () =>
    selectedPeriod.value === currentPeriod &&
    !!selectedYear.value &&
    extractYearForRequest(selectedYear.value) === currentYear,
);

// Fall back to today's semester, else the first period offered.
watch(availablePeriods, (periods) => {
  if (!periods.length || (selectedPeriod.value && periods.includes(selectedPeriod.value))) return;
  selectPeriod(periods.includes(currentPeriod) ? currentPeriod : periods[0]);
});

const selectYear = (year: string) => {
  selectedYear.value = year;
  storage.set('selectedYear', year);
};
</script>
