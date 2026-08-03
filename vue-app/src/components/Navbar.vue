<template>
  <header class="w-full bg-white border-b border-slate-200">
    <div class="flex justify-between items-center gap-3 px-4 sm:px-6 py-3">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Sidebar toggle -->
        <button
          @click="emit('toggle-sidebar')"
          class="shrink-0 p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Alternar menu"
        >
          <Menu class="w-5 h-5" />
        </button>
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
import { onMounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { Menu } from 'lucide-vue-next';
import UserProfile from './UserProfile.vue';

const emit = defineEmits<{
  'toggle-sidebar': [];
}>();

const studentName = ref<string | null>(null);
const studentCourse = ref<string | null>(null);
const studentPhotoUrl = ref<string | null>(null);
const loadingStudentInfo = ref(true);

type StudentInfo = {
  photo_data: string | null;
  student_name: string;
  course: string;
};

const fetchStudentInfo = async () => {
  loadingStudentInfo.value = true;
  try {
    const sessionId = localStorage.getItem('clipSessionId');
    const studentId = localStorage.getItem('selected_student_id');
    if (!sessionId || !studentId) return;

    const res = await invoke<StudentInfo>('get_student_info', {
      sessionId,
      studentId,
    });

    studentName.value = res.student_name;
    studentCourse.value = res.course;
    studentPhotoUrl.value = res.photo_data ? `data:image/jpeg;base64,${res.photo_data}` : null;
  } catch (e) {
    console.error('Error fetching student info:', e);
  } finally {
    loadingStudentInfo.value = false;
  }
};

onMounted(() => {
  fetchStudentInfo();
  window.addEventListener('student-changed', fetchStudentInfo);
});
</script>
