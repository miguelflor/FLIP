<template>
  <aside
    :class="[
      'bg-linear-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out',
      // Mobile: slide-over overlay
      'fixed inset-y-0 left-0 z-40 w-64 md:static md:z-auto md:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
      // Desktop: collapse width in place
      open ? 'md:w-64' : 'md:w-0 md:border-r-0',
    ]"
  >
    <div
      :class="[
        'flex flex-col h-full overflow-hidden transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0 md:pointer-events-none',
      ]"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-200 shrink-0 flex items-center justify-between">
        <div class="flex items-center min-w-0">
          <h2 class="text-xl font-bold text-slate-900 truncate">FLIP</h2>
        </div>
        <!-- Close button (mobile only) -->
        <button
          @click="emit('close')"
          class="md:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          title="Fechar"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-2 grow overflow-y-auto flex-1">
        <a
          href="#pdfs"
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group whitespace-nowrap"
        >
          <FolderOpen class="w-5 h-5 text-slate-500 group-hover:text-blue-600 shrink-0" />
          <span class="font-medium">Ficheiros</span>
        </a>

        <a
          href="#notas"
          class="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm transition-all duration-200 group relative whitespace-nowrap"
        >
          <Calendar class="w-5 h-5 text-slate-500 group-hover:text-blue-600 shrink-0" />
          <span class="font-medium">Horário</span>
        </a>
      </nav>

      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="cursor-pointer w-fit mx-auto flex items-center justify-center space-x-2 px-3 py-2 mb-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all duration-200 group whitespace-nowrap"
        title="Terminar sessão"
      >
        <LogOut class="w-4 h-4 shrink-0" />
        <span class="text-sm font-medium">Sair</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { Calendar, FolderOpen, LogOut, X } from "lucide-vue-next";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const handleLogout = () => {
  localStorage.clear();
  router.replace("/");
};
</script>
