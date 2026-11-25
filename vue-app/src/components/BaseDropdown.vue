<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      class="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 group disabled:opacity-60 disabled:pointer-events-none"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :disabled="disabled"
      @click="open = !open"
      @keydown="onTriggerKey"
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
      <div
        class="py-1"
        role="listbox"
        :aria-label="placeholder"
        @keydown="onListKey"
      >
        <button
          v-for="option in options"
          :key="option"
          ref="optionEls"
          type="button"
          role="option"
          tabindex="-1"
          :aria-selected="selected === option"
          :class="[
            'w-full text-left px-4 py-2 text-sm transition-colors outline-none focus-visible:bg-slate-100',
            selected === option
              ? 'bg-brand-50 text-brand-700 font-medium'
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
import { nextTick, onUnmounted, useTemplateRef, watch } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
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

const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const optionEls = useTemplateRef<HTMLButtonElement[]>('optionEls');

const select = (option: string) => {
  close();
  trigger.value?.focus();
  emit('select', option);
};

// Keyboard: arrows open the list on the selected option and move through it,
// Home/End jump to its ends, Escape closes it back onto the button, Tab leaves it.
const focusOption = (index: number) => {
  const els = optionEls.value ?? [];
  if (els.length) els[(index + els.length) % els.length].focus();
};

const focusedIndex = () =>
  (optionEls.value ?? []).findIndex((el) => el === document.activeElement);

const onTriggerKey = async (e: KeyboardEvent) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  open.value = true;
  await nextTick();
  const selectedIndex = props.selected ? props.options.indexOf(props.selected) : -1;
  focusOption(selectedIndex >= 0 ? selectedIndex : e.key === 'ArrowUp' ? -1 : 0);
};

const onListKey = (e: KeyboardEvent) => {
  const moves: Record<string, () => void> = {
    ArrowDown: () => focusOption(focusedIndex() + 1),
    ArrowUp: () => focusOption(focusedIndex() - 1),
    Home: () => focusOption(0),
    End: () => focusOption(-1),
    Escape: () => {
      close();
      trigger.value?.focus();
    },
  };
  if (e.key === 'Tab') return close();
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  move();
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
