import { ref, watchEffect } from 'vue';
import { storage } from '../lib/storage';

// Saved choice wins; otherwise follow the OS setting at startup.
const isDark = ref(
  (storage.get('theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark',
);

watchEffect(() => document.documentElement.classList.toggle('dark', isDark.value));

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    storage.set('theme', isDark.value ? 'dark' : 'light');
  };
  return { isDark, toggleTheme };
}
