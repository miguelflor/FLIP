<template>
  <div class="max-w-2xl space-y-4 sm:space-y-6">
    <h2 class="text-2xl font-bold text-slate-900">
      Definições
    </h2>

    <SettingsSection
      title="Aparência"
      :icon="Palette"
    >
      <fieldset>
        <legend class="text-slate-500 mb-3">
          Tema
        </legend>
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
    </SettingsSection>

    <SettingsSection
      title="Transferências"
      :icon="FolderDown"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-slate-500">
            Ficheiros, horários e calendários são guardados em:
          </p>
          <p
            v-if="loadingFolder"
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
          :class="BUTTON"
          :disabled="loadingFolder || choosing"
          data-testid="change-folder"
          @click="changeFolder"
        >
          {{ folder ? 'Alterar pasta' : 'Escolher pasta' }}
        </button>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Sessão guardada"
      :icon="KeyRound"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <p
          v-if="loadingLogin"
          class="flex-1 h-4 w-48 rounded bg-slate-200 animate-pulse"
        />
        <p
          v-else-if="savedLogin"
          class="min-w-0 flex-1 text-slate-700"
          data-testid="saved-login"
        >
          O início de sessão de <strong class="text-slate-900">{{ savedLogin }}</strong> está guardado
          neste computador, no cofre do sistema, para entrar automaticamente.
        </p>
        <p
          v-else
          class="min-w-0 flex-1 text-slate-500"
          data-testid="saved-login"
        >
          Nenhum início de sessão guardado. Para entrar automaticamente, marque
          «Lembrar-me neste computador» ao iniciar sessão.
        </p>
        <button
          v-if="savedLogin"
          type="button"
          :class="BUTTON"
          :disabled="forgetting"
          data-testid="forget-login"
          @click="forgetLogin"
        >
          Esquecer
        </button>
      </div>
    </SettingsSection>

    <SettingsSection
      title="Cache"
      :icon="Database"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <p class="min-w-0 flex-1 text-slate-500">
          As páginas do CLIP ficam guardadas neste computador, cifradas, para o FLIP abrir
          depressa. Limpar a cache obriga a pedi-las de novo ao CLIP.
        </p>
        <button
          type="button"
          :class="BUTTON"
          :disabled="clearing"
          data-testid="clear-cache"
          @click="clearCache"
        >
          Limpar cache
        </button>
      </div>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Database, FolderDown, KeyRound, Monitor, Moon, Palette, Sun } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import SettingsSection from '../components/SettingsSection.vue';
import { useToast } from '../composables/useToast';
import { useTheme, type ThemeChoice } from '../composables/useTheme';

const BUTTON =
  'shrink-0 cursor-pointer px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:shadow-sm hover:bg-slate-50 transition-all font-medium disabled:opacity-50';

const { success, error } = useToast();

// Appearance
const { theme, setTheme } = useTheme();

const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

// Downloads
const folder = ref<string | null>(null);
const loadingFolder = ref(true);
const choosing = ref(false);

onMounted(async () => {
  loadSavedLogin();
  try {
    folder.value = await invoke<string | null>('get_download_dir');
  } catch (e) {
    console.error('Error reading download folder:', e);
  } finally {
    loadingFolder.value = false;
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

// Saved login
const savedLogin = ref<string | null>(null);
const loadingLogin = ref(true);
const forgetting = ref(false);

const loadSavedLogin = async () => {
  try {
    savedLogin.value = await invoke<string | null>('saved_login');
  } catch (e) {
    console.error('Error reading saved login:', e);
  } finally {
    loadingLogin.value = false;
  }
};

const forgetLogin = async () => {
  forgetting.value = true;
  try {
    await invoke('forget_login');
    savedLogin.value = null;
    success('Início de sessão esquecido');
  } catch (e) {
    console.error('Error forgetting login:', e);
    error('Erro ao esquecer o início de sessão');
  } finally {
    forgetting.value = false;
  }
};

// Cache
const clearing = ref(false);

const clearCache = async () => {
  clearing.value = true;
  try {
    await invoke('reset_cache');
    success('Cache limpa com sucesso');
  } catch (e) {
    console.error('Error resetting cache:', e);
    error('Erro ao limpar cache');
  } finally {
    clearing.value = false;
  }
};
</script>
