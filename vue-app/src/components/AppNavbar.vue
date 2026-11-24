<template>
  <header class="h-16 shrink-0 w-full bg-white border-b border-slate-200">
    <div class="h-full flex justify-between items-center gap-3 px-4 sm:px-6">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <h1 class="text-xl font-bold text-slate-900 shrink-0">
          FLIP
        </h1>

        <!-- Student Dropdown -->
        <BaseDropdown
          :options="Object.keys(alunoIds)"
          :selected="selectedAlunoId"
          placeholder="Selecionar aluno"
          @select="selectStudent"
        />
      </div>

      <div class="flex items-center gap-1 sm:gap-2 min-w-0">
        <!-- User profile -->
        <div class="min-w-0 mr-1 sm:mr-2">
          <UserProfile
            :name="studentName"
            :course="studentCourse"
            :photo-url="studentPhotoUrl"
            :loading="loadingStudentInfo"
          />
        </div>

        <button
          type="button"
          :class="ICON_BUTTON"
          title="Definições"
          aria-haspopup="dialog"
          @click="settingsOpen = true"
        >
          <Settings class="w-5 h-5" />
        </button>
        <button
          type="button"
          :class="ICON_BUTTON"
          title="Terminar sessão"
          @click="handleLogout"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>

    <SettingsDialog v-model:open="settingsOpen" />
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { invoke } from '@tauri-apps/api/core';
import { LogOut, Settings } from 'lucide-vue-next';
import BaseDropdown from './BaseDropdown.vue';
import SettingsDialog from './SettingsDialog.vue';
import UserProfile from './UserProfile.vue';
import { useStudent } from '../composables/useStudent';

const ICON_BUTTON =
  'shrink-0 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer';

const router = useRouter();
const {
  sessionId,
  alunoIds,
  selectedAlunoId,
  studentName,
  studentCourse,
  studentPhotoUrl,
  loadingStudentInfo,
  selectStudent,
  endSession,
} = useStudent();

const settingsOpen = ref(false);

// Leaves even if the backend call fails: staying logged in is worse than a stale session.
const handleLogout = async () => {
  try {
    await invoke('logout', { sessionId: sessionId.value });
  } catch (e) {
    console.error('Error logging out:', e);
  }
  endSession();
  await router.replace('/');
};
</script>
