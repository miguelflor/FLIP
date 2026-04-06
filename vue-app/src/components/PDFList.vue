<template>
  <div class="bg-white rounded-xl shadow p-4" id="pdfs">
    <div class="flex items-center space-x-2 mb-2">
      <FolderOpen class="w-5 h-5 text-slate-600" />
      <h3 class="text-lg font-bold text-slate-900">Ficheiros Recentes</h3>
    </div>

    <!-- Refresh button -->
    <button
      @click="handleChairs"
      :disabled="loading"
      class="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center"
    >
      <svg 
        :class="['w-3 h-3 mr-1', { 'animate-spin': loading }]" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      {{ loading ? 'Carregando...' : 'Atualizar' }}
    </button>

    <ul class="space-y-2 text-sm">
      <!-- Loading state -->
      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center">
          <div class="h-4 w-4 bg-gray-200 rounded mr-2"></div>
          <div 
            class="h-4 bg-gray-200 rounded" 
            :style="{ width: `${Math.floor(Math.random() * 30) + 60}%` }"
          ></div>
        </div>
      </div>
      <!-- Error state -->
      <div v-else-if="error" class="text-red-500 py-2">
        <p>{{ error }}</p>
        <button
          @click="handleChairs"
          class="text-blue-500 hover:underline mt-1"
        >
          Tentar novamente
        </button>
      </div>
      <!-- Data state -->
      <div v-else-if="hasAnyChairs" class="space-y-4">
        <div 
          v-for="[periodKey, cs] in Object.entries(chairs)" 
          :key="periodKey"
        >
          <div v-if="cs.length > 0">
            <h4 class="font-medium text-gray-700 mb-2">{{ getPeriodName(periodKey) }}</h4>
            <ul class="space-y-2 pl-2">
              <Chair 
                v-for="(chair, idx) in cs" 
                :key="idx" 
                :chair="chair" 
                :idx="idx" 
              />
            </ul>
          </div>
        </div>
      </div>
      <!-- Empty state -->
      <div v-else class="text-gray-500 py-6 text-center">
        <p>Não foram encontrados ficheiros recentes.</p>
        <p class="text-sm mt-1">Por favor, verifique se está autenticado.</p>
      </div>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { FolderOpen } from 'lucide-vue-next';
import Chair from './Chair.vue';
import { PeriodType } from '../lib/clipVars';

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

const loading = ref(false);
const chairs = ref<ChairsByPeriod>({});
const error = ref<string | null>(null);

const hasAnyChairs = computed(() => {
  return Object.values(chairs.value).some(cs => cs.length > 0);
});

const handleChairs = async () => {
  loading.value = true;
  error.value = null;
  try {
    const sessionId = localStorage.getItem('clipSessionId');
    if (!sessionId) {
      error.value = 'Not authenticated. Please log in again.';
      loading.value = false;
      return;
    }

    const res = await invoke<ChairsResponse>('get_chairs', { sessionId });

    if (res.success && res.chairs) {
      // Convert from Rust naming (s1, s2, t1, t2) to JS naming
      chairs.value = {
        [PeriodType.S + '1']: res.chairs.s1 || [],
        [PeriodType.S + '2']: res.chairs.s2 || [],
        [PeriodType.T + '1']: res.chairs.t1 || [],
        [PeriodType.T + '2']: res.chairs.t2 || [],
      };
    } else {
      error.value = res.error || 'Failed to fetch chairs';
    }
  } catch (err) {
    console.error('Error fetching chairs:', err);
    error.value = 'Erro ao carregar ficheiros recentes. Por favor, tente novamente mais tarde.';
  } finally {
    loading.value = false;
  }
};

const getPeriodName = (periodKey: string) => {
  if (periodKey === PeriodType.S + '1') return '1º Semestre';
  if (periodKey === PeriodType.S + '2') return '2º Semestre';
  if (periodKey === PeriodType.T + '1') return '1º Trimestre';
  if (periodKey === PeriodType.T + '2') return '2º Trimestre';
  return periodKey;
};

onMounted(() => {
  handleChairs();
});
</script>
