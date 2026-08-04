<template>
  <div class="fixed top-4 right-4 z-50">
    <transition-group
      name="slide-fade"
      tag="div"
    >
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
          <CheckCircle
            v-if="toast.type === 'success'"
            class="h-5 w-5 text-green-600 shrink-0"
          />
          <XCircle
            v-else
            class="h-5 w-5 text-red-600 shrink-0"
          />
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button
            :class="[
              'shrink-0 p-1 rounded-full transition-colors',
              toast.type === 'error'
                ? 'hover:bg-red-100 text-red-600 hover:text-red-700'
                : 'hover:bg-green-100 text-green-600 hover:text-green-700'
            ]"
            @click="dismiss(toast.id)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <!-- Progress bar -->
        <div :class="['h-1 w-full', toast.type === 'error' ? 'bg-red-100' : 'bg-green-100']">
          <div
            :class="[
              'h-full origin-left toast-progress',
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            ]"
            :style="{ animationDuration: `${toast.duration}ms` }"
          />
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, X } from 'lucide-vue-next';
import { useToast } from '../composables/useToast';

// Lifecycle (auto-dismiss timers) is owned by useToast; this component only renders.
const { toasts, dismiss } = useToast();
</script>

<style scoped>
@keyframes toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.toast-progress {
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

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
