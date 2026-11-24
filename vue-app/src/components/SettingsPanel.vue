<template>
  <div class="space-y-4">
    <SettingsSection
      :title="t('settings.appearance')"
      :icon="Palette"
    >
      <ChoiceGroup
        :model-value="theme"
        :legend="t('settings.theme')"
        :options="THEME_OPTIONS"
        @update:model-value="setTheme"
      />
    </SettingsSection>

    <SettingsSection
      :title="t('settings.preloadTitle')"
      :icon="Files"
    >
      <p class="text-slate-500 mb-3">
        {{ t('settings.preloadHelp') }}
      </p>
      <ChoiceGroup
        :model-value="preload"
        :legend="t('settings.preload')"
        :options="PRELOAD_OPTIONS"
        @update:model-value="setPreload"
      />
    </SettingsSection>

    <SettingsSection
      :title="t('settings.downloads')"
      :icon="FolderDown"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-slate-500">
            {{ t('settings.downloadsHelp') }}
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
            {{ t('settings.downloadsUnset') }}
          </p>
        </div>
        <button
          type="button"
          :class="BUTTON"
          :disabled="loadingFolder || choosing"
          data-testid="change-folder"
          @click="changeFolder"
        >
          {{ folder ? t('settings.changeFolder') : t('settings.chooseFolder') }}
        </button>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="t('settings.savedLogin')"
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
          {{ savedLoginText[0] }}<strong class="text-slate-900">{{ savedLogin }}</strong>{{ savedLoginText[1] }}
        </p>
        <p
          v-else
          class="min-w-0 flex-1 text-slate-500"
          data-testid="saved-login"
        >
          {{ t('settings.savedLoginNone') }}
        </p>
        <button
          v-if="savedLogin"
          type="button"
          :class="BUTTON"
          :disabled="forgetting"
          data-testid="forget-login"
          @click="forgetLogin"
        >
          {{ t('settings.forget') }}
        </button>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="t('settings.cache')"
      :icon="Database"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <p class="min-w-0 flex-1 text-slate-500">
          {{ t('settings.cacheHelp') }}
        </p>
        <button
          type="button"
          :class="BUTTON"
          :disabled="clearing"
          data-testid="clear-cache"
          @click="clearCache"
        >
          {{ t('settings.clearCache') }}
        </button>
      </div>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue';
import { Database, Files, FolderDown, KeyRound, Monitor, Moon, Palette, Sun } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import ChoiceGroup from './ChoiceGroup.vue';
import SettingsSection from './SettingsSection.vue';
import { usePreload, type PreloadChoice } from '../composables/usePreload';
import { useToast } from '../composables/useToast';
import { useTheme, type ThemeChoice } from '../composables/useTheme';
import { t, translateError } from '../lib/i18n';

const BUTTON =
  'shrink-0 cursor-pointer px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:shadow-sm hover:bg-slate-50 transition-all font-medium disabled:opacity-50';

const { success, error } = useToast();

// Appearance
const { theme, setTheme } = useTheme();

const THEME_OPTIONS = computed<{ value: ThemeChoice; label: string; icon: Component }[]>(() => [
  { value: 'light', label: t('settings.themeLight'), icon: Sun },
  { value: 'dark', label: t('settings.themeDark'), icon: Moon },
  { value: 'system', label: t('settings.system'), icon: Monitor },
]);

// Course files
const { preload, setPreload } = usePreload();

const PRELOAD_OPTIONS = computed<{ value: PreloadChoice; label: string }[]>(() => [
  { value: 'period', label: t('settings.preloadPeriod') },
  { value: 'all', label: t('settings.preloadAll') },
  { value: 'none', label: t('settings.preloadNone') },
]);

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
      success(t('settings.folderChanged'));
    }
  } catch (e) {
    console.error('Error changing download folder:', e);
    error(translateError(e));
  } finally {
    choosing.value = false;
  }
};

// Saved login
const savedLogin = ref<string | null>(null);
const loadingLogin = ref(true);
const forgetting = ref(false);

// The sentence around the username, which is shown in bold
const savedLoginText = computed(() => t('settings.savedLoginIs').split('{name}'));

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
    success(t('settings.forgotten'));
  } catch (e) {
    console.error('Error forgetting login:', e);
    error(t('settings.forgetFailed'));
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
    success(t('settings.cacheCleared'));
  } catch (e) {
    console.error('Error resetting cache:', e);
    error(t('settings.cacheFailed'));
  } finally {
    clearing.value = false;
  }
};
</script>
