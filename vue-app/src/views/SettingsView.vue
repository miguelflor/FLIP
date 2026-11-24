<template>
  <div class="max-w-2xl space-y-4 sm:space-y-6">
    <h2 class="text-2xl font-bold text-slate-900">
      Definições
    </h2>

    <section
      class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      aria-labelledby="appearance-heading"
    >
      <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Palette class="w-5 h-5 text-slate-500 shrink-0" />
        <h3
          id="appearance-heading"
          class="text-lg font-bold text-slate-900"
        >
          Aparência
        </h3>
      </div>
      <fieldset class="p-4 text-sm">
        <legend class="sr-only">
          Tema
        </legend>
        <p class="text-slate-500 mb-3">
          Tema
        </p>
        <div class="inline-flex flex-wrap gap-2">
          <label
            v-for="option in THEME_OPTIONS"
            :key="option.value"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500',
              theme === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ]"
          >
            <input
              type="radio"
              name="theme"
              class="sr-only"
              :value="option.value"
              :checked="theme === option.value"
              @change="setTheme(option.value)"
            >
            <component
              :is="option.icon"
              class="w-4 h-4"
            />
            {{ option.label }}
          </label>
        </div>
      </fieldset>
    </section>

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
import { FolderDown, Monitor, Moon, Palette, Sun } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../composables/useToast';
import { useTheme, type ThemeChoice } from '../composables/useTheme';

const { success, error } = useToast();
const { theme, setTheme } = useTheme();

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];
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
