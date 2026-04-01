<template>
  <Transition
    name="slide-fade"
    @after-leave="$emit('close')"
  >
    <div
      v-if="isVisible"
      :class="[
        'fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg overflow-hidden transform transition-all duration-300',
        type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800' 
          : 'bg-red-50 border border-red-200 text-red-800'
      ]"
    >
      <div class="p-4 flex items-center gap-3">
        <CheckCircle v-if="type === 'success'" class="h-5 w-5 text-green-600 flex-shrink-0" />
        <XCircle v-else class="h-5 w-5 text-red-600 flex-shrink-0" />
        <span class="flex-1 text-sm font-medium">{{ message }}</span>
        <button
          @click="handleClose"
          :class="[
            'flex-shrink-0 p-1 rounded-full transition-colors',
            type === 'success' 
              ? 'hover:bg-green-100 text-green-600 hover:text-green-700' 
              : 'hover:bg-red-100 text-red-600 hover:text-red-700'
          ]"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
      <!-- Progress bar -->
      <div :class="['h-1 w-full', type === 'success' ? 'bg-green-100' : 'bg-red-100']">
        <div 
          :class="[
            'h-full transition-all duration-75 ease-linear',
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
          ]"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CheckCircle, XCircle, X } from 'lucide-vue-next';

interface Props {
  type: 'success' | 'error';
  message: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: []
}>();

const progress = ref(100);
const isVisible = ref(true);
const duration = 2000; // 2 seconds

let timer: number | null = null;
let interval: number | null = null;

const handleClose = () => {
  isVisible.value = false;
};

onMounted(() => {
  timer = window.setTimeout(() => {
    isVisible.value = false;
  }, duration);

  // Update progress bar every 50ms for smooth animation
  interval = window.setInterval(() => {
    progress.value = Math.max(0, progress.value - (100 / (duration / 50)));
  }, 50);
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
