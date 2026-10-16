<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      class="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 group disabled:opacity-60 disabled:pointer-events-none"
      type="button"
      :disabled="disabled"
      @click="open = !open"
    >
      <span class="text-sm font-medium">{{ selected ?? placeholder }}</span>
      <ChevronDown
        v-if="!disabled"
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      class="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
    >
      <div class="py-1">
        <button
          v-for="option in options"
          :key="option"
          type="button"
          :class="[
            'w-full text-left px-4 py-2 text-sm transition-colors',
            selected === option
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          ]"
          @click="select(option)"
        >
          {{ option }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Module scope is shared by every instance: closes whichever dropdown is open.
let closeOpenDropdown: (() => void) | null = null;
</script>

<script setup lang="ts">
import { onUnmounted, useTemplateRef, watch } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

defineProps<{
  options: string[];
  selected: string | null;
  placeholder: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [option: string];
}>();

/**
 * Open state, exposed as `v-model:open` so a parent can close this dropdown
 * without owning it.
 */
const open = defineModel<boolean>('open', { default: false });

const close = () => {
  open.value = false;
};

const root = useTemplateRef<HTMLElement>('root');

const onOutsidePointer = (e: PointerEvent) => {
  if (!root.value?.contains(e.target as Node)) close();
};

const select = (option: string) => {
  close();
  emit('select', option);
};

// Opening this dropdown closes any other one; while open, a click outside closes it.
watch(open, (isOpen) => {
  if (isOpen) {
    if (closeOpenDropdown !== close) closeOpenDropdown?.();
    closeOpenDropdown = close;
    document.addEventListener('pointerdown', onOutsidePointer);
  } else {
    if (closeOpenDropdown === close) closeOpenDropdown = null;
    document.removeEventListener('pointerdown', onOutsidePointer);
  }
});

onUnmounted(() => {
  if (closeOpenDropdown === close) closeOpenDropdown = null;
  document.removeEventListener('pointerdown', onOutsidePointer);
});
</script>
