<template>
  <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo/Icon -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">FLIP</h1>
        <p class="text-gray-600">Acesso ao CLIP da NOVA FCT</p>
      </div>

      <LoginForm />

      <!-- Footer -->
      <p class="text-center text-sm text-gray-500">
        Faça login com as suas credenciais do CLIP
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue';
</script>
