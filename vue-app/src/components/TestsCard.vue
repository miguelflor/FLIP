<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
      <div class="flex items-center gap-2 min-w-0">
        <ClipboardList class="w-5 h-5 text-slate-500 shrink-0" />
        <h3 class="text-lg font-bold text-slate-900 truncate">
          {{ t('tests.title') }}
        </h3>
      </div>
      <button
        :disabled="loading"
        :title="t('common.refresh')"
        class="shrink-0 p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        @click="refresh"
      >
        <RefreshCw :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
      </button>
    </div>

    <div
      v-if="loading"
      class="py-10 text-center text-slate-400 text-sm"
    >
      {{ t('tests.loading') }}
    </div>
    <div
      v-else-if="error"
      class="py-10 text-center text-red-400 text-sm"
    >
      {{ error }}
    </div>
    <div
      v-else-if="!tests?.length"
      class="py-10 text-center text-slate-400 text-sm"
    >
      {{ t('tests.empty') }}
    </div>
    <ul
      v-else
      class="divide-y divide-slate-100"
    >
      <li
        v-for="test in ordered"
        :key="test.unit + test.name + test.date"
        :class="['flex items-center gap-3 px-4 py-2.5', { 'opacity-50': test.date < today }]"
      >
        <div class="w-12 shrink-0 text-center leading-tight">
          <div class="text-[10px] uppercase text-slate-400">
            {{ fmt(test.date, { weekday: 'short' }) }}
          </div>
          <div class="text-lg font-bold text-slate-800">
            {{ test.date.slice(8) }}
          </div>
          <div class="text-[10px] uppercase text-slate-500">
            {{ fmt(test.date, { month: 'short' }) }}
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-900 truncate">{{ test.unit }}</span>
            <span
              v-if="!test.enrolled"
              class="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
            >{{ t('tests.notEnrolled') }}</span>
          </div>
          <div class="text-xs text-slate-500 truncate">
            {{ test.name }} · {{ test.time }}
          </div>
          <div
            v-if="test.rooms.length"
            class="text-xs text-slate-400 truncate flex items-center gap-1"
            :title="test.rooms.join('\n')"
          >
            <MapPin class="w-3 h-3 shrink-0" />{{ test.rooms.join(', ') }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import { ClipboardList, MapPin, RefreshCw } from 'lucide-vue-next';
import { useClipQuery } from '../composables/useClipQuery';
import { locale, t } from '../lib/i18n';

const props = defineProps<{
  studentId: string | null;
  year: string | null;
  period: string | null;
}>();

interface Test {
  unit: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rooms: string[];
  enrolled: boolean;
}

const { data: tests, loading, error, refresh } = useClipQuery<Test[]>(
  'get_tests',
  toRef(props, 'studentId'),
  toRef(props, 'year'),
  { params: computed(() => ({ period: props.period })) },
);

// Local date as YYYY-MM-DD, comparable with t.date as a string
const today = new Date().toLocaleDateString('sv');

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00`).toLocaleDateString(locale.value, opts).replace('.', '');

// Upcoming first, past ones (greyed out) at the bottom; each stays in date order
const ordered = computed(() => {
  const all = tests.value ?? [];
  return [...all.filter((t) => t.date >= today), ...all.filter((t) => t.date < today)];
});
</script>
