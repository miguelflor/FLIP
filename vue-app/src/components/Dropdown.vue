<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 group"
    >
      <span class="text-sm font-medium">{{ selected ?? placeholder }}</span>
      <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
    </button>

    <div
      v-if="isOpen"
      class="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
    >
      <div class="py-1">
        <button
          v-for="option in options"
          :key="option"
          @click="select(option)"
          :class="[
            'w-full text-left px-4 py-2 text-sm transition-colors',
            selected === option
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          ]"
        >
          {{ option }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
  options: string[];
  selected: string | null;
  placeholder: string;
  open?: boolean;
}>();

const emit = defineEmits<{
  select: [option: string];
  'update:open': [open: boolean];
}>();

const isOpen = ref(props.open ?? false);

// Keep internal state in sync with parent so dropdowns can close each other.
watch(() => props.open, (val) => {
  if (val !== undefined) isOpen.value = val;
});
watch(isOpen, (val) => emit('update:open', val));

const select = (option: string) => {
  isOpen.value = false;
  emit('select', option);
};
</script>
