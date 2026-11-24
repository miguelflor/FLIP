import { ref } from 'vue';
import { storage } from '../lib/storage';

/**
 * Which units' file lists load in the background on the dashboard: the selected period's
 * (the default), every period's, or none (each loads when opened). More means files show and
 * search finds them at once, at the cost of more requests to CLIP.
 */
export type PreloadChoice = 'period' | 'all' | 'none';

const choice = ref<PreloadChoice>(
  (['all', 'none'] as const).find((c) => c === storage.get('preloadFiles')) ?? 'period',
);

export function usePreload() {
  const setPreload = (value: PreloadChoice) => {
    choice.value = value;
    storage.set('preloadFiles', value === 'period' ? null : value);
  };
  /** Whether a unit in `unitPeriod` loads ahead, with `selectedPeriod` on screen. */
  const preloads = (unitPeriod: string, selectedPeriod: string | null) =>
    choice.value === 'all' || (choice.value === 'period' && unitPeriod === selectedPeriod);
  return { preload: choice, setPreload, preloads };
}
