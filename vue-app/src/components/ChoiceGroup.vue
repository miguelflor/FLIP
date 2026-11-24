<template>
  <fieldset>
    <legend class="text-slate-500 mb-3">
      {{ legend }}
    </legend>
    <div class="inline-flex flex-wrap gap-2">
      <label
        v-for="option in options"
        :key="option.value"
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500',
          model === option.value
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        ]"
      >
        <input
          v-model="model"
          type="radio"
          :name="name"
          class="sr-only"
          :value="option.value"
        >
        <component
          :is="option.icon"
          v-if="option.icon"
          class="w-4 h-4"
        />
        {{ option.label }}
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts" generic="T extends string">
import { useId, type Component } from 'vue';

/** One of a few options, as a row of radio buttons styled as toggles. */
defineProps<{
  legend: string;
  options: { value: T; label: string; icon?: Component }[];
}>();

const model = defineModel<T>({ required: true });
const name = useId();
</script>
