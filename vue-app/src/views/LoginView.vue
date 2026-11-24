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
          {{ t('login.tagline') }}
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
        {{ t('login.loggingIn') }}
      </div>

      <template v-else>
        <!-- The saved login couldn't be tried (e.g. no internet): say so, offer a retry -->
        <div
          v-if="autoLoginError"
          class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          role="alert"
        >
          <p>{{ t('login.autoFailed', { error: autoLoginError }) }}</p>
          <button
            type="button"
            class="mt-2 font-semibold underline cursor-pointer"
            @click="tryAutoLogin"
          >
            {{ t('common.retry') }}
          </button>
        </div>
        <LoginForm />
      </template>

      <!-- Footer -->
      <p
        v-if="!autoLoggingIn"
        class="text-center text-sm text-gray-500"
      >
        {{ t('login.hint') }}
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
import { t, translateError } from '../lib/i18n';

type LoginResponse = {
  session_id: string;
  aluno_ids: Record<string, string>;
};

const router = useRouter();
const { startSession } = useStudent();
const autoLoggingIn = ref(true);
const autoLoginError = ref<string | null>(null);

// On success we navigate away with the spinner still up, so the form never flashes.
const tryAutoLogin = async () => {
  autoLoggingIn.value = true;
  autoLoginError.value = null;
  try {
    const saved = await invoke<LoginResponse | null>('auto_login');
    if (saved) {
      startSession(saved.session_id, saved.aluno_ids);
      await router.push('/app/dashboard');
      return;
    }
  } catch (err) {
    console.error('Auto login failed:', err);
    autoLoginError.value = translateError(err);
  }
  autoLoggingIn.value = false;
};

onMounted(tryAutoLogin);
</script>
