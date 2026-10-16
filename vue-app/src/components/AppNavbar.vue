<template>
  <header class="h-16 shrink-0 w-full bg-white border-b border-slate-200">
    <div class="h-full flex justify-between items-center gap-3 px-4 sm:px-6">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Sidebar toggle -->
        <button
          class="shrink-0 p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Alternar menu"
          @click="emit('toggle-sidebar')"
        >
          <Menu class="w-5 h-5" />
        </button>

        <!-- Student Dropdown -->
        <BaseDropdown
          :options="Object.keys(alunoIds)"
          :selected="selectedAlunoId"
          placeholder="Selecionar Aluno"
          @select="selectStudent"
        />
      </div>

      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          class="shrink-0 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          :title="isDark ? 'Tema claro' : 'Tema escuro'"
          @click="toggleTheme"
        >
          <Sun
            v-if="isDark"
            class="w-5 h-5"
          />
          <Moon
            v-else
            class="w-5 h-5"
          />
        </button>

        <!-- User profile -->
        <div class="min-w-0">
          <UserProfile
            :name="studentName"
            :course="studentCourse"
            :photo-url="studentPhotoUrl"
            :loading="loadingStudentInfo"
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, Moon, Sun } from 'lucide-vue-next';
import BaseDropdown from './BaseDropdown.vue';
import UserProfile from './UserProfile.vue';
import { useStudent } from '../composables/useStudent';
import { useTheme } from '../composables/useTheme';

const emit = defineEmits<{
  'toggle-sidebar': [];
}>();

const { isDark, toggleTheme } = useTheme();
const { alunoIds, selectedAlunoId, studentName, studentCourse, studentPhotoUrl, loadingStudentInfo, selectStudent } = useStudent();
</script>
