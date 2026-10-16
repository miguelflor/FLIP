<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
    <form
      class="space-y-6"
      @submit.prevent="handleSubmit"
    >
      <!-- Username Input -->
      <div>
        <label
          for="username"
          class="block text-sm font-semibold text-gray-700 mb-2"
        >
          Identificador de estudante
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="ex: j.pd"
          >
        </div>
      </div>

      <!-- Password Input -->
      <div>
        <label
          for="password"
          class="block text-sm font-semibold text-gray-700 mb-2"
        >
          Senha
        </label>
        <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <svg
            class="ml-3 h-5 w-5 shrink-0 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            class="flex-1 min-w-0 pl-3 py-3 bg-transparent outline-none [&::-ms-reveal]:hidden"
            placeholder="••••••••"
          >
          <button
            type="button"
            class="cursor-pointer self-stretch px-3 flex items-center rounded-r-xl text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:text-blue-500"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="showPassword"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading"
        class="cursor-pointer w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
      >
        <span
          v-if="loading"
          class="flex items-center justify-center"
        >
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
        </span>
        <span v-else>Entrar</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../composables/useToast';
import { useStudent } from '../composables/useStudent';

const router = useRouter();
const { error } = useToast();
const { startSession } = useStudent();
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

type LoginResponse = {
  session_id: string;
  aluno_ids: Record<string, string>;
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const loginResponse = await invoke<LoginResponse>('login', {
      username: username.value, 
      password: password.value 
    });
    startSession(loginResponse.session_id, loginResponse.aluno_ids);
    await router.push('/app/dashboard');
  } catch (err) {
    error(String(err));
  } finally {
    username.value = '';
    password.value = '';
    showPassword.value = false;
    loading.value = false;
  }
};
</script>
