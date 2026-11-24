<template>
  <div class="max-w-2xl space-y-4 sm:space-y-6">
    <h2 class="text-2xl font-bold text-slate-900">
      Definições
    </h2>

    <section
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      aria-labelledby="downloads-heading"
    >
      <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <FolderDown class="w-5 h-5 text-slate-500 shrink-0" />
        <h3
          id="downloads-heading"
          class="text-lg font-bold text-slate-900"
        >
          Transferências
        </h3>
      </div>
      <div class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        <div class="min-w-0 flex-1">
          <p class="text-slate-500">
            Ficheiros, horários e calendários são guardados em:
          </p>
          <p
            v-if="loading"
            class="mt-1 h-4 w-48 rounded bg-slate-200 animate-pulse"
          />
          <p
            v-else-if="folder"
            class="mt-1 font-medium text-slate-900 break-all"
            data-testid="download-folder"
          >
            {{ folder }}
          </p>
          <p
            v-else
            class="mt-1 text-slate-700"
            data-testid="download-folder"
          >
            Ainda não escolhida: será pedida na primeira transferência.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 cursor-pointer px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:shadow-sm hover:bg-slate-50 transition-all font-medium disabled:opacity-50"
          :disabled="loading || choosing"
          @click="changeFolder"
        >
          {{ folder ? 'Alterar pasta' : 'Escolher pasta' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { FolderDown } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../composables/useToast';

const { success, error } = useToast();
const folder = ref<string | null>(null);
const loading = ref(true);
const choosing = ref(false);

onMounted(async () => {
  try {
    folder.value = await invoke<string | null>('get_download_dir');
  } catch (e) {
    console.error('Error reading download folder:', e);
  } finally {
    loading.value = false;
  }
});

const changeFolder = async () => {
  choosing.value = true;
  try {
    const chosen = await invoke<string | null>('change_download_dir');
    if (chosen) {
      folder.value = chosen;
      success('Pasta de transferências alterada');
    }
  } catch (e) {
    console.error('Error changing download folder:', e);
    error(String(e));
  } finally {
    choosing.value = false;
  }
};
</script>
