import { ref } from 'vue';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;
const toasts = ref<Toast[]>([]);

export function useToast() {
  const show = (message: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = toastId++;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id);
    }, duration);
  };

  const error = (message: string) => show(message, 'error');
  const success = (message: string) => show(message, 'success');

  return {
    toasts,
    show,
    error,
    success
  };
}
