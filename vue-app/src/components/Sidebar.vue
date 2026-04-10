<template>
  <aside class="w-64 pb-2 bg-linear-to-b from-slate-50 to-slate-100 border-r border-slate-200 hidden md:flex flex-col h-screen">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-slate-200 shrink-0">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
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
    <nav class="p-4 space-y-2 grow overflow-y-auto flex-1">
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

    <!-- Logout Button -->
    <button
      @click="handleLogout"
      class="cursor-pointer w-fit mx-auto flex items-center justify-center space-x-2 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all duration-200 group"
      title="Terminar sessão"
    >
      <LogOut class="w-4 h-4" />
      <span class="text-sm font-medium">Sair</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Calendar, FolderOpen, LogOut } from 'lucide-vue-next';

const router = useRouter();

const handleLogout = () => {
  localStorage.clear();
  router.replace('/');
};
</script>
