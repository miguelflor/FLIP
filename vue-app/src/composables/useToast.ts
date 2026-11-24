import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
  duration: number;
}

const DEFAULT_DURATION = 3000;
/** Errors stay longer: they usually need reading, and acting on. */
const ERROR_DURATION = 6000;

let toastId = 0;
const toasts = ref<Toast[]>([]);
const timers = new Map<number, number>();

const dismiss = (id: number) => {
  toasts.value = toasts.value.filter(t => t.id !== id);

  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

const show = (
  message: string,
  type: Toast['type'] = 'success',
  duration = DEFAULT_DURATION,
) => {
  const id = toastId++;
  toasts.value.push({ id, message, type, duration });
  timers.set(id, window.setTimeout(() => dismiss(id), duration));
};

const error = (message: string) => show(message, 'error', ERROR_DURATION);
const success = (message: string) => show(message, 'success');

export function useToast() {
  return {
    toasts,
    show,
    dismiss,
    error,
    success,
  };
}
