<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <Calendar class="w-6 h-6 text-slate-600" />
        <div>
          <h3 class="text-xl font-bold text-slate-900">Horário Semanal</h3>
          <p class="text-sm text-slate-500">Segunda a Sexta</p>
        </div>
      </div>

      <button
        @click="exportAllToGoogleCalendar"
        class="flex items-center space-x-3 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:shadow-md transition-all duration-200 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        <img src="/google-logo.svg" alt="Google" class="w-5 h-5" />
        <span class="text-gray-600 font-medium">Exportar</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12 text-slate-400 text-sm">
      A carregar horário...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 text-sm">
      {{ error }}
    </div>

    <!-- Calendar Grid -->
    <div v-else class="grid grid-cols-5 gap-3">
      <div v-for="day in weekDays" :key="day.key" class="min-h-[140px]">
        <div
          :class="[
            'text-center p-3 rounded-t-lg border-b',
            isToday(day.key)
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-slate-50 border-slate-200 text-slate-700',
          ]"
        >
          <div :class="['text-sm font-bold', isToday(day.key) ? 'text-blue-600' : 'text-slate-900']">
            {{ day.label }}
          </div>
        </div>

        <div class="p-3 border-l border-r border-b border-slate-200 rounded-b-lg bg-white min-h-[100px]">
          <div class="space-y-2">
            <div
              v-for="(item, idx) in getScheduleForDay(day.key)"
              :key="idx"
              :class="['p-3 rounded-md border text-xs relative group', getTypeColor(item.class_type)]"
            >
              <button
                @click="exportToGoogleCalendar(item)"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/70 rounded-full bg-white/50 backdrop-blur-sm"
                title="Exportar para Google Calendar"
              >
                <img src="/google-logo.svg" alt="Google" class="w-3.5 h-3.5" />
              </button>

              <div class="flex items-center space-x-1 mb-1">
                <Clock class="w-3 h-3" />
                <span class="font-medium">{{ formatTime(item.time_start) }} - {{ formatTime(item.time_end) }}</span>
              </div>
              <div class="font-semibold truncate mb-1 pr-6">
                {{ item.class }}
                <span class="font-normal text-xs opacity-70">({{ item.class_type }}.{{ item.class_number }})</span>
              </div>
              <div class="flex items-center space-x-1">
                <MapPin class="w-3 h-3" />
                <span>{{ item.location }}</span>
              </div>
            </div>
            <div
              v-if="getScheduleForDay(day.key).length === 0"
              class="text-center py-4 text-slate-400 text-xs"
            >
              Sem aulas
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 pt-4 border-t border-slate-200">
      <div class="flex items-center justify-center space-x-4 text-xs">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span class="text-slate-600">Teórica</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span class="text-slate-600">Prática</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
          <span class="text-slate-600">Teórico-Prática</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { Calendar, Clock, MapPin } from 'lucide-vue-next';

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type ClassType = 't' | 'p' | 'tp';

interface HourMinute {
  hour: number;
  min: number;
}

interface ScheduleItem {
  weekday: Weekday;
  time_start: HourMinute;
  time_end: HourMinute;
  class: string;
  class_number: number;
  location: string;
  class_type: ClassType;
}

const schedule = ref<ScheduleItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const weekDays: { key: Weekday; label: string }[] = [
  { key: 'Monday', label: 'Segunda' },
  { key: 'Tuesday', label: 'Terça' },
  { key: 'Wednesday', label: 'Quarta' },
  { key: 'Thursday', label: 'Quinta' },
  { key: 'Friday', label: 'Sexta' },
];

onMounted(async () => {
  const sessionId = localStorage.getItem('clipSessionId');
  if (!sessionId) {
    error.value = 'Sessão não encontrada';
    loading.value = false;
    return;
  }
  try {
    const result = await invoke<ScheduleItem[]>('get_schedule', { sessionId });
    schedule.value = result;
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
});

const formatTime = (hm: HourMinute) =>
  `${String(hm.hour).padStart(2, '0')}:${String(hm.min).padStart(2, '0')}`;

const getScheduleForDay = (day: Weekday) =>
  schedule.value.filter((item) => item.weekday === day);

const getTypeColor = (type: ClassType) => {
  switch (type) {
    case 't':  return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'p':  return 'bg-green-100 text-green-800 border-green-200';
    case 'tp': return 'bg-purple-100 text-purple-800 border-purple-200';
    default:   return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const isToday = (day: Weekday) => {
  const map: Record<number, Weekday> = {
    1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday',
  };
  return map[new Date().getDay()] === day;
};

const getNextOccurrence = (day: Weekday, hm: HourMinute) => {
  const dayIndex: Record<Weekday, number> = {
    Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7,
  };
  const today = new Date();
  const todayIdx = today.getDay() === 0 ? 7 : today.getDay();
  const diff = dayIndex[day] - todayIdx;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff >= 0 ? diff : diff + 7));
  next.setHours(hm.hour, hm.min, 0, 0);
  return next;
};

const formatDateForGoogle = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const exportToGoogleCalendar = (item: ScheduleItem) => {
  const start = getNextOccurrence(item.weekday, item.time_start);
  const end = getNextOccurrence(item.weekday, item.time_end);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(item.class)}` +
    `&dates=${formatDateForGoogle(start)}/${formatDateForGoogle(end)}` +
    `&details=${encodeURIComponent(`Tipo: ${item.class_type}.${item.class_number}`)}` +
    `&location=${encodeURIComponent(item.location)}` +
    `&recur=RRULE:FREQ=WEEKLY`;

  window.open(url, '_blank');
};

const exportAllToGoogleCalendar = () => {
  schedule.value.forEach((item, i) => {
    setTimeout(() => exportToGoogleCalendar(item), i * 1000);
  });
};
</script>
