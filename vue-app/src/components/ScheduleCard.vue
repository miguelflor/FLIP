<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-6 py-4 border-b border-slate-100"
    >
      <div class="flex items-center space-x-3">
        <Calendar class="w-5 h-5 text-slate-500" />
        <div>
          <h3 class="text-lg font-bold text-slate-900">Horário Semanal</h3>
          <p class="text-xs text-slate-400">Segunda a Sexta</p>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-3 text-xs text-slate-500">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block"></span
            >Teórica
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"
            ></span
            >Prática
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="w-2.5 h-2.5 rounded-sm bg-violet-400 inline-block"
            ></span
            >Teórico-Prática
          </span>
        </div>
        <button
          @click="exportAllToGoogleCalendar"
          class="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all text-xs font-medium hover:bg-slate-50"
        >
          <img src="/google-logo.svg" alt="Google" class="w-4 h-4" />
          <span>Exportar tudo</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex justify-center py-16 text-slate-400 text-sm"
    >
      A carregar horário...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16 text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Calendar grid -->
    <div v-else class="flex pb-4">
      <!-- Time gutter -->
      <div
        class="flex-none w-14 border-r border-slate-100 bg-slate-50/60 shrink-0"
      >
        <div style="height: 48px"></div>
        <div :style="{ height: gridHeight + 'px' }" class="relative">
          <div
            v-for="hour in hours"
            :key="hour"
            class="absolute right-2 text-[10px] text-slate-400 font-medium select-none"
            :style="{ top: toTop({ hour, min: 0 }) - 8 + 'px' }"
          >
            {{ String(hour).padStart(2, "0") }}:00
          </div>
        </div>
      </div>

      <!-- Day columns -->
      <div class="flex-1 grid grid-cols-5 min-w-[560px]">
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="border-r border-slate-100 last:border-r-0"
        >
          <!-- Day header -->
          <div
            :class="[
              'h-12 flex items-center justify-center border-b border-slate-100 text-sm font-semibold gap-1.5',
              isToday(day.key)
                ? 'text-blue-600 bg-blue-50/60'
                : 'text-slate-500 bg-white',
            ]"
          >
            {{ day.label }}
            <span
              v-if="isToday(day.key)"
              class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"
            ></span>
          </div>

          <!-- Events area -->
          <div class="relative" :style="{ height: gridHeight + 'px' }">
            <!-- Hour lines -->
            <div
              v-for="hour in hours"
              :key="hour"
              class="absolute w-full border-t border-slate-100"
              :style="{ top: toTop({ hour, min: 0 }) + 'px' }"
            ></div>
            <!-- Half-hour lines -->
            <div
              v-for="hour in hours.slice(0, -1)"
              :key="'half-' + hour"
              class="absolute w-full border-t border-slate-50"
              :style="{ top: toTop({ hour, min: 30 }) + 'px' }"
            ></div>

            <!-- Events -->
            <div
              v-for="(item, idx) in getScheduleForDay(day.key)"
              :key="idx"
              :class="[
                'absolute inset-x-1.5 rounded-md overflow-hidden cursor-pointer transition-all hover:z-10 hover:shadow-lg hover:brightness-95 group',
                getTypeStyle(item.class_type),
              ]"
              :style="{
                top: toTop(item.time_start) + 2 + 'px',
                height:
                  Math.max(toHeight(item.time_start, item.time_end) - 4, 24) +
                  'px',
              }"
              :title="`${item.class} · ${item.class_type}.${item.class_number}\n${formatTime(item.time_start)} – ${formatTime(item.time_end)}\n${item.location}`"
            >
              <div class="flex flex-col h-full px-2 py-1.5 overflow-hidden">
                <span class="text-[11px] font-bold leading-tight truncate">{{
                  item.class
                }}</span>
                <span class="text-[10px] opacity-60 leading-tight truncate"
                  >{{ item.class_type }}.{{ item.class_number }}</span
                >
                <span
                  class="mt-auto text-[10px] opacity-55 leading-tight truncate flex items-center gap-0.5"
                >
                  <MapPin class="w-2.5 h-2.5 shrink-0" />{{ item.location }}
                </span>
              </div>
              <!-- Export button on hover -->
              <button
                @click.stop="exportToGoogleCalendar(item)"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-white/60 hover:bg-white/90"
                title="Exportar para Google Calendar"
              >
                <img src="/google-logo.svg" alt="Google" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { Calendar, MapPin } from "lucide-vue-next";

type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
type ClassType = "t" | "p" | "tp";

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

const HOUR_PX = 64;

const schedule = ref<ScheduleItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Convert year format from "2024/25" to "2025"
const extractYearForRequest = (yearStr: string): string => {
  const parts = yearStr.split('/');
  if (parts.length === 2) return '20' + parts[1];
  return yearStr;
};

const weekDays: { key: Weekday; label: string }[] = [
  { key: "Monday", label: "Segunda" },
  { key: "Tuesday", label: "Terça" },
  { key: "Wednesday", label: "Quarta" },
  { key: "Thursday", label: "Quinta" },
  { key: "Friday", label: "Sexta" },
];

const minHour = computed(() => {
  if (!schedule.value.length) return 8;
  return Math.max(7, Math.min(...schedule.value.map((i) => i.time_start.hour)));
});

const maxHour = computed(() => {
  if (!schedule.value.length) return 20;
  return Math.min(
    24,
    Math.max(...schedule.value.map((i) => i.time_end.hour)) + 1,
  );
});

const hours = computed(() => {
  const h: number[] = [];
  for (let i = minHour.value; i <= maxHour.value; i++) h.push(i);
  return h;
});

const gridHeight = computed(() => (maxHour.value - minHour.value) * HOUR_PX);

const toTop = (hm: HourMinute) =>
  ((hm.hour * 60 + hm.min - minHour.value * 60) / 60) * HOUR_PX;

const toHeight = (start: HourMinute, end: HourMinute) =>
  ((end.hour * 60 + end.min - (start.hour * 60 + start.min)) / 60) * HOUR_PX;

const loadSchedule = async (studentId?: string, year?: string) => {
  const sessionId = localStorage.getItem("clipSessionId");
  if (!sessionId) {
    error.value = "Sessão não encontrada";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const params: Record<string, string> = { sessionId };
    if (studentId) params.studentId = studentId;
    if (year) params.year = extractYearForRequest(year);
    const result = await invoke<ScheduleItem[]>("get_schedule", params);
    schedule.value = result;
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const studentId = localStorage.getItem("selected_student_id") ?? undefined;
  const year = localStorage.getItem("selected_year") ?? undefined;
  loadSchedule(studentId, year);

  window.addEventListener("years-loaded", (e) => {
    const { detail } = e as CustomEvent<{ year: string }>;
    const sid = localStorage.getItem("selected_student_id") ?? undefined;
    loadSchedule(sid, detail.year);
  });

  window.addEventListener("student-changed", (e) => {
    const { detail } = e as CustomEvent<{ studentId: string }>;
    const yr = localStorage.getItem("selected_year") ?? undefined;
    loadSchedule(detail.studentId, yr);
  });

  window.addEventListener("year-changed", (e) => {
    const { detail } = e as CustomEvent<{ year: string }>;
    const sid = localStorage.getItem("selected_student_id") ?? undefined;
    loadSchedule(sid, detail.year);
  });
});

const formatTime = (hm: HourMinute) =>
  `${String(hm.hour).padStart(2, "0")}:${String(hm.min).padStart(2, "0")}`;

const getScheduleForDay = (day: Weekday) =>
  schedule.value.filter((item) => item.weekday === day);

const getTypeStyle = (type: ClassType) => {
  switch (type) {
    case "t":
      return "bg-blue-100 border-l-[3px] border-blue-400 text-blue-900";
    case "p":
      return "bg-emerald-100 border-l-[3px] border-emerald-400 text-emerald-900";
    case "tp":
      return "bg-violet-100 border-l-[3px] border-violet-400 text-violet-900";
    default:
      return "bg-slate-100 border-l-[3px] border-slate-400 text-slate-900";
  }
};

const isToday = (day: Weekday) => {
  const map: Record<number, Weekday> = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
  };
  return map[new Date().getDay()] === day;
};

const getNextOccurrence = (day: Weekday, hm: HourMinute) => {
  const dayIndex: Record<Weekday, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
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
  date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const exportToGoogleCalendar = (item: ScheduleItem) => {
  const start = getNextOccurrence(item.weekday, item.time_start);
  const end = getNextOccurrence(item.weekday, item.time_end);
  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(item.class)}` +
    `&dates=${formatDateForGoogle(start)}/${formatDateForGoogle(end)}` +
    `&details=${encodeURIComponent(`Tipo: ${item.class_type}.${item.class_number}`)}` +
    `&location=${encodeURIComponent(item.location)}` +
    `&recur=RRULE:FREQ=WEEKLY`;
  window.open(url, "_blank");
};

const exportAllToGoogleCalendar = () => {
  schedule.value.forEach((item, i) =>
    setTimeout(() => exportToGoogleCalendar(item), i * 1000),
  );
};
</script>
