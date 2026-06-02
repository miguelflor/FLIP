<template>
  <div class="flex items-center space-x-3">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="hidden sm:block text-right space-y-1.5">
        <div class="h-3.5 w-28 ml-auto rounded bg-slate-200 animate-pulse"></div>
        <div class="h-3 w-20 ml-auto rounded bg-slate-200 animate-pulse"></div>
      </div>
      <div class="w-10 h-10 rounded-full bg-slate-200 animate-pulse ring-2 ring-slate-100"></div>
    </template>

    <!-- Loaded content -->
    <template v-else>
      <div class="hidden sm:block text-right">
        <p class="text-sm font-semibold text-slate-900">{{ name || 'Estudante' }}</p>
        <p class="text-xs text-slate-500">{{ course ? course.split('-')[0].trim() : 'Curso' }}</p>
      </div>
      <div v-if="photoUrl" class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-200 shadow-sm hover:ring-blue-400 transition-all duration-200">
        <img :src="photoUrl" :alt="name || 'Estudante'" class="w-full h-full object-cover"/>
      </div>
      <div v-else class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-slate-200 bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
        <span class="text-white font-bold text-sm">{{ (name ? name[0] : 'E').toUpperCase() }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string | null;
  course: string | null;
  photoUrl: string | null;
  loading: boolean;
}>();
</script>
