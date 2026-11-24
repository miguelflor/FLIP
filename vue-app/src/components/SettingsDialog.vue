<template>
  <!-- Native modal dialog: traps focus, closes on Escape, and dims the page behind it -->
  <dialog
    ref="dialog"
    class="m-auto p-0 w-[min(42rem,calc(100%-2rem))] max-h-[calc(100%-2rem)] rounded-xl bg-gray-50 text-slate-900 shadow-2xl border border-slate-200 backdrop:bg-black/40"
    aria-labelledby="settings-title"
    @close="open = false"
    @click="closeOnBackdrop"
  >
    <div class="flex flex-col max-h-[calc(100vh-2rem)]">
      <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-white">
        <h2
          id="settings-title"
          class="text-xl font-bold"
        >
          {{ t('settings.title') }}
        </h2>
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          :aria-label="t('settings.close')"
          @click="open = false"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="overflow-y-auto p-5">
        <!-- Mounted on each opening, so it shows the settings as they are now -->
        <SettingsPanel v-if="open" />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue';
import { X } from 'lucide-vue-next';
import SettingsPanel from './SettingsPanel.vue';
import { t } from '../lib/i18n';

const open = defineModel<boolean>('open', { default: false });
const dialog = useTemplateRef<HTMLDialogElement>('dialog');

const sync = (isOpen: boolean) => {
  const el = dialog.value;
  if (!el || el.open === isOpen) return;
  if (isOpen) el.showModal();
  else el.close();
};

onMounted(() => sync(open.value));
watch(open, sync, { flush: 'post' });

// A click on the dialog element itself, not its contents, is a click on the backdrop.
const closeOnBackdrop = (e: MouseEvent) => {
  if (e.target === dialog.value) open.value = false;
};
</script>
