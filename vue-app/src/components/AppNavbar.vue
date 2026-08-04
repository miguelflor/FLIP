<template>
  <header class="w-full bg-white border-b border-slate-200">
    <div class="flex justify-between items-center gap-3 px-4 sm:px-6 py-3">
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
          :open="isDropdownOpen"
          @select="handleSelectStudent"
          @update:open="(v) => isDropdownOpen = v"
        />
      </div>

      <!-- User profile -->
      <div class="shrink-0">
        <UserProfile
          :name="studentName"
          :course="studentCourse"
          :photo-url="studentPhotoUrl"
          :loading="loadingStudentInfo"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Menu } from 'lucide-vue-next';
import BaseDropdown from './BaseDropdown.vue';
import UserProfile from './UserProfile.vue';
import { useStudent } from '../composables/useStudent';

const emit = defineEmits<{
  'toggle-sidebar': [];
}>();

const { alunoIds, selectedAlunoId, studentName, studentCourse, studentPhotoUrl, loadingStudentInfo, selectStudent } = useStudent();

const isDropdownOpen = ref(false);

const handleSelectStudent = (displayName: string) => {
  selectStudent(displayName);
  isDropdownOpen.value = false;
};
</script>
