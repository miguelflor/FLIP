<template>
  <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo/Icon -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg
            class="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          FLIP
        </h1>
        <p class="text-gray-600">
          Acesso ao CLIP da NOVA FCT
        </p>
      </div>

      <!-- Trying the login saved in the OS keyring: no form unless it fails -->
      <div
        v-if="autoLoggingIn"
        class="flex items-center justify-center gap-3 text-gray-600"
        role="status"
      >
        <svg
          class="animate-spin h-5 w-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Entrando...
      </div>

      <LoginForm v-else />

      <!-- Footer -->
      <p
        v-if="!autoLoggingIn"
        class="text-center text-sm text-gray-500"
      >
        Faça login com as suas credenciais do CLIP
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import LoginForm from '../components/LoginForm.vue';
import { useStudent } from '../composables/useStudent';

type LoginResponse = {
  session_id: string;
  aluno_ids: Record<string, string>;
};

const router = useRouter();
const { startSession } = useStudent();
const autoLoggingIn = ref(true);

// On success we navigate away with the spinner still up, so the form never flashes.
onMounted(async () => {
  try {
    const saved = await invoke<LoginResponse | null>('auto_login');
    if (saved) {
      startSession(saved.session_id, saved.aluno_ids);
      await router.push('/app/dashboard');
      return;
    }
  } catch (err) {
    console.error('Auto login failed:', err);
  }
  autoLoggingIn.value = false;
});
</script>
