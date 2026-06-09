<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Mobile backdrop -->
    <transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 bg-black/40 z-30 md:hidden"
      ></div>
    </transition>

    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <Navbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ScheduleCard />
          <PDFList />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import ScheduleCard from '../components/ScheduleCard.vue';
import PDFList from '../components/PDFList.vue';

// Open by default on desktop, collapsed on mobile.
const sidebarOpen = ref(window.innerWidth >= 768);

// Keep the sidebar sensible across breakpoint changes: closed when shrinking
// to mobile, open when growing back to desktop.
const mql = window.matchMedia('(min-width: 768px)');
const handleBreakpoint = (e: MediaQueryListEvent) => {
  sidebarOpen.value = e.matches;
};

onMounted(() => mql.addEventListener('change', handleBreakpoint));
onUnmounted(() => mql.removeEventListener('change', handleBreakpoint));
</script>
