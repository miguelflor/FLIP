<template>
  <header class="w-full bg-white border-slate-200 shadow-sm">
    <div class="flex justify-between items-center px-6 py-4">
      <!-- Left section -->
      <div class="flex items-center space-x-4">
        <!-- Mobile menu button -->
        <button class="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu class="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <!-- Right section -->
      <div class="flex items-center space-x-2">
        <!-- User profile -->
        <div class="flex items-center space-x-3 ml-4">
          <div class="hidden sm:block text-right">
            <p class="text-sm font-medium text-slate-900">Estudante</p>
            <p class="text-xs text-slate-500">Online</p>
          </div>
          <div class="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span class="text-slate-600 font-medium text-sm">E</span>
          </div>
        </div>

        <!-- Logout button -->
        <button
          class="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group ml-2"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 group-hover:text-red-700" />
          <span class="text-sm font-medium group-hover:text-red-700 hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { LogOut, Menu } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLogout = () => {
  router.push('/');
};
</script>
