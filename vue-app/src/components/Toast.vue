<template>
  <div class="fixed top-4 right-4 z-50">
    <transition-group name="slide-fade" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'mb-2 max-w-sm w-full shadow-lg rounded-lg overflow-hidden transform transition-all duration-300',
          toast.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-green-50 border border-green-200 text-green-800'
        ]"
      >
        <div class="p-4 flex items-center gap-3">
          <CheckCircle v-if="toast.type === 'success'" class="h-5 w-5 text-green-600 shrink-0" />
          <XCircle v-else class="h-5 w-5 text-red-600 shrink-0" />
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button
            @click="removeToast(toast.id)"
            :class="[
              'shrink-0 p-1 rounded-full transition-colors',
              toast.type === 'error'
                ? 'hover:bg-red-100 text-red-600 hover:text-red-700'
                : 'hover:bg-green-100 text-green-600 hover:text-green-700'
            ]"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <!-- Progress bar -->
        <div :class="['h-1 w-full', toast.type === 'error' ? 'bg-red-100' : 'bg-green-100']">
          <div
            :class="[
              'h-full transition-all duration-75 ease-linear',
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            ]"
            :style="{ width: `${toastProgress[toast.id] || 100}%` }"
          />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CheckCircle, XCircle, X } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

const { toasts } = useToast();
const toastProgress = ref<Record<number, number>>({});
const timers = ref<Record<number, number>>({});
const intervals = ref<Record<number, number>>({});
const duration = 2000; // 2 seconds

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
    if (timers.value[id]) clearTimeout(timers.value[id]);
    if (intervals.value[id]) clearInterval(intervals.value[id]);
  }
};

const startToastTimer = (id: number) => {
  toastProgress.value[id] = 100;

  timers.value[id] = window.setTimeout(() => {
    removeToast(id);
  }, duration);

  intervals.value[id] = window.setInterval(() => {
    toastProgress.value[id] = Math.max(0, toastProgress.value[id] - (100 / (duration / 50)));
  }, 50);
};

watch(
  () => toasts.value,
  (newToasts) => {
    newToasts.forEach(toast => {
      if (!toastProgress.value.hasOwnProperty(toast.id)) {
        startToastTimer(toast.id);
      }
    });
  },
  { deep: true }
);
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
