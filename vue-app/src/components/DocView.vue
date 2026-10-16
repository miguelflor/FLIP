<template>
  <div
    id="pdfs"
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  >
    <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
      <div class="flex items-center gap-2 min-w-0">
        <FolderOpen class="w-5 h-5 text-slate-500 shrink-0" />
        <h3 class="text-lg font-bold text-slate-900 truncate">
          Ficheiros das Cadeiras
        </h3>
      </div>
      <button
        :disabled="loading"
        title="Atualizar"
        class="shrink-0 p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        @click="refreshChairs"
      >
        <RefreshCw :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
      </button>
    </div>

    <ul class="p-4 space-y-2 text-sm">
      <input
        v-if="hasAnyChairs && !loading && !error"
        v-model="query"
        type="search"
        placeholder="Procurar ficheiros..."
        aria-label="Procurar ficheiros"
        class="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500"
      >
      <!-- Loading state -->
      <div
        v-if="loading"
        class="animate-pulse space-y-3"
      >
        <div
          v-for="width in SKELETON_WIDTHS"
          :key="width"
          class="flex items-center"
        >
          <div class="h-4 w-4 bg-gray-200 rounded mr-2" />
          <div
            class="h-4 bg-gray-200 rounded"
            :style="{ width: `${width}%` }"
          />
        </div>
      </div>
      <!-- Error state -->
      <div
        v-else-if="error"
        class="text-red-500 py-2"
      >
        <p>{{ error }}</p>
        <button
          class="text-blue-500 hover:underline mt-1"
          @click="refreshChairs"
        >
          Tentar novamente
        </button>
      </div>
      <!-- Data state -->
      <div
        v-else-if="hasAnyChairs"
        class="space-y-4"
      >
        <div 
          v-for="[periodKey, cs] in Object.entries(chairs)" 
          :key="periodKey"
        >
          <div v-if="cs.length > 0">
            <h4 class="font-medium text-gray-700 mb-2">
              {{ getPeriodName(periodKey) }}
            </h4>
            <ul class="space-y-2 pl-2">
              <ChairItem
                v-for="chair in cs"
                :key="chair.href"
                :chair="chair"
                :query="query"
              />
            </ul>
          </div>
        </div>
      </div>
      <!-- Empty state -->
      <div
        v-else
        class="text-gray-500 py-6 text-center"
      >
        <p>Não foram encontrados ficheiros recentes.</p>
        <p class="text-sm mt-1">
          Por favor, verifique se está autenticado.
        </p>
      </div>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { FolderOpen, RefreshCw } from 'lucide-vue-next';
import ChairItem from './ChairItem.vue';
import { PeriodType } from '../lib/clipVars';
import { useClipQuery } from '../composables/useClipQuery';

const props = defineProps<{
  studentId: string | null;
  year: string | null;
}>();

interface ChairData {
  href: string;
  text: string;
}

type ChairsByPeriod = Record<string, ChairData[]>;

interface ChairsResponse {
  success: boolean;
  chairs?: {
    s1: ChairData[];
    s2: ChairData[];
    t1: ChairData[];
    t2: ChairData[];
  };
  error?: string;
}

const query = ref('');

// Fixed widths so the skeleton bars don't jitter on every re-render.
const SKELETON_WIDTHS = [72, 88, 64, 81, 69];

const {
  data: response,
  loading,
  error: queryError,
  refresh: refreshChairs,
} = useClipQuery<ChairsResponse>(
  'get_chairs',
  toRef(props, 'studentId'),
  toRef(props, 'year'),
  { noStudentMessage: 'Por favor, selecione um aluno.' },
);

// Convert from Rust naming (s1, s2, t1, t2) to the period keys used in the UI.
const chairs = computed<ChairsByPeriod>(() => {
  const res = response.value;
  if (!res?.success || !res.chairs) return {};
  return {
    [PeriodType.S + '1']: res.chairs.s1 ?? [],
    [PeriodType.S + '2']: res.chairs.s2 ?? [],
    [PeriodType.T + '1']: res.chairs.t1 ?? [],
    [PeriodType.T + '2']: res.chairs.t2 ?? [],
  };
});

// The backend reports failures in-band, so surface those alongside transport errors.
const error = computed(() => {
  if (queryError.value) return queryError.value;
  const res = response.value;
  if (res && !res.success) return res.error ?? 'Failed to fetch chairs';
  return null;
});

const hasAnyChairs = computed(() =>
  Object.values(chairs.value).some(cs => cs.length > 0),
);

const getPeriodName = (periodKey: string) => {
  if (periodKey === PeriodType.S + '1') return '1º Semestre';
  if (periodKey === PeriodType.S + '2') return '2º Semestre';
  if (periodKey === PeriodType.T + '1') return '1º Trimestre';
  if (periodKey === PeriodType.T + '2') return '2º Trimestre';
  return periodKey;
};
</script>
