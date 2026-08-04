<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <AppSidebar
      :open="sidebarOpen"
      @close="sidebarOpen = false"
    />

    <!-- Mobile backdrop -->
    <transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/40 z-30 md:hidden"
        @click="sidebarOpen = false"
      />
    </transition>

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <AppNavbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';
import AppSidebar from '../components/AppSidebar.vue';
import { useStudent } from '../composables/useStudent';

const { init } = useStudent();

const sidebarOpen = ref(window.innerWidth >= 768);

const mql = window.matchMedia('(min-width: 768px)');
const handleBreakpoint = (e: MediaQueryListEvent) => {
  sidebarOpen.value = e.matches;
};

onMounted(() => {
  mql.addEventListener('change', handleBreakpoint);
  init();
});
onUnmounted(() => mql.removeEventListener('change', handleBreakpoint));
</script>
