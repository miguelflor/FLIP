<template>
  <aside class="w-64 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 hidden md:block">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center">
          <img 
            src="/favicon.ico" 
            alt="FLIP Logo" 
            class="w-5 h-5"
          />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-900">FLIP</h2>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="p-4 space-y-2">
      <a 
        href="#pdfs" 
        class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group"
      >
        <FolderOpen class="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
        <span class="font-medium">Ficheiros</span>
      </a>
      
      <a 
        href="#notas" 
        class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group relative"
      >
        <Calendar class="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
        <span class="font-medium">Horário</span>
        <span class="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
          Em breve
        </span>
      </a>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { Calendar, FolderOpen } from 'lucide-vue-next';
</script>
