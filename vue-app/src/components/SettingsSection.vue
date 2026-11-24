<template>
  <section
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    :aria-labelledby="headingId"
  >
    <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
      <component
        :is="icon"
        class="w-5 h-5 text-slate-500 shrink-0"
      />
      <h3
        :id="headingId"
        class="text-lg font-bold text-slate-900"
      >
        {{ title }}
      </h3>
    </div>
    <div class="p-4 text-sm">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId, type Component } from 'vue';

defineProps<{
  title: string;
  icon: Component;
}>();

const headingId = useId();
</script>
