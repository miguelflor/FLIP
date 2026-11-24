<template>
  <div class="flex flex-col h-screen bg-gray-50 overflow-hidden">
    <AppNavbar />
    <main class="flex-1 overflow-y-auto p-4 sm:p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppNavbar from '../components/AppNavbar.vue';
import { useStudent } from '../composables/useStudent';

const { init, isAuthenticated } = useStudent();
const router = useRouter();

// The session can end while a page is open (expired, logged out): back to login.
watch(isAuthenticated, (authenticated) => {
  if (!authenticated) router.replace('/');
});

onMounted(init);
</script>
