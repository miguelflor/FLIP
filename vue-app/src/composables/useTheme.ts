import { computed, ref, watchEffect } from 'vue';
import { storage } from '../lib/storage';

export type ThemeChoice = 'light' | 'dark' | 'system';

// 'system' (the default) follows the OS setting, also when it changes while the app is open.
const choice = ref<ThemeChoice>(
  (['light', 'dark'] as const).find((t) => t === storage.get('theme')) ?? 'system',
);

const osPrefersDark = matchMedia('(prefers-color-scheme: dark)');
const systemDark = ref(osPrefersDark.matches);
osPrefersDark.addEventListener('change', (e) => (systemDark.value = e.matches));

const isDark = computed(() => (choice.value === 'system' ? systemDark.value : choice.value === 'dark'));

watchEffect(() => document.documentElement.classList.toggle('dark', isDark.value));

export function useTheme() {
  const setTheme = (theme: ThemeChoice) => {
    choice.value = theme;
    storage.set('theme', theme === 'system' ? null : theme);
  };
  return { theme: choice, isDark, setTheme };
}
