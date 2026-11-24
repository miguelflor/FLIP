<template>
  <div
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <Calendar class="w-5 h-5 text-slate-500 shrink-0" />
          <h3 class="text-lg font-bold text-slate-900 whitespace-nowrap">
            Horário Semanal
          </h3>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 whitespace-nowrap">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />Teórica
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Prática
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-violet-400 inline-block" />Teórico-Prática
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button
          :disabled="loading"
          title="Atualizar"
          class="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all text-xs font-medium hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
          @click="refreshSchedule"
        >
          <RefreshCw :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
          <span class="hidden xl:inline">Atualizar</span>
        </button>
        <button
          :disabled="loading || !!error || !schedule.length"
          title="Exportar horário para o calendário (.ics)"
          class="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all text-xs font-medium hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
          @click="exportIcs"
        >
          <CalendarArrowDown class="w-3.5 h-3.5" />
          <span class="hidden xl:inline">Calendário</span>
        </button>
        <button
          :disabled="loading || !!error"
          title="Exportar como PNG"
          class="flex items-center gap-1.5 p-2 xl:px-3 xl:py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md hover:shadow-sm transition-all text-xs font-medium hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
          @click="exportPng"
        >
          <ImageDown class="w-3.5 h-3.5" />
          <span class="hidden xl:inline">PNG</span>
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
    <div
      v-else-if="error"
      class="text-center py-16 text-red-400 text-sm"
    >
      {{ error }}
    </div>

    <!-- Calendar grid -->
    <div
      v-else
      ref="gridEl"
      class="flex pb-4 overflow-x-auto"
    >
      <!-- Time gutter -->
      <div
        class="flex-none w-12 border-r border-slate-100 bg-slate-50/60 shrink-0"
      >
        <div style="height: 48px" />
        <div
          :style="{ height: gridHeight + 'px' }"
          class="relative"
        >
          <div
            v-for="hour in hours"
            :key="hour"
            class="absolute right-2 text-[10px] text-slate-500 font-medium select-none"
            :style="{ top: toTop({ hour, min: 0 }) - 8 + 'px' }"
          >
            {{ String(hour).padStart(2, "0") }}:00
          </div>
        </div>
      </div>

      <!-- Day columns -->
      <div
        class="flex-1 grid"
        :style="{
          gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))`,
          minWidth: `${weekDays.length * 84}px`,
        }"
      >
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
                ? 'text-blue-600 bg-blue-50/60 in-[.exporting]:text-slate-500 in-[.exporting]:bg-white'
                : 'text-slate-500 bg-white',
            ]"
          >
            {{ day.label }}
            <span
              v-if="isToday(day.key)"
              class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block in-[.exporting]:hidden"
            />
          </div>

          <!-- Events area -->
          <div
            class="relative"
            :style="{ height: gridHeight + 'px' }"
          >
            <!-- Hour lines -->
            <div
              v-for="hour in hours"
              :key="hour"
              class="absolute w-full border-t border-slate-100"
              :style="{ top: toTop({ hour, min: 0 }) + 'px' }"
            />
            <!-- Half-hour lines -->
            <div
              v-for="hour in hours.slice(0, -1)"
              :key="'half-' + hour"
              class="absolute w-full border-t border-slate-50"
              :style="{ top: toTop({ hour, min: 30 }) + 'px' }"
            />

            <!-- Events -->
            <div
              v-for="item in getScheduleForDay(day.key)"
              :key="`${item.class}-${item.class_type}${item.class_number}-${formatTime(item.time_start)}`"
              :class="[
                'absolute rounded-md overflow-hidden transition-all hover:z-10 focus-within:z-10 hover:shadow-lg hover:brightness-95 group',
                getTypeStyle(item.class_type),
              ]"
              :style="{
                top: toTop(item.time_start) + 2 + 'px',
                height:
                  Math.max(toHeight(item.time_start, item.time_end) - 4, 24) +
                  'px',
                ...horizontalPlacement(item),
              }"
              :title="`${item.class} · ${item.class_type}.${item.class_number}\n${formatTime(item.time_start)} – ${formatTime(item.time_end)}\n${item.location}`"
            >
              <div class="flex flex-col h-full px-2 py-1.5 overflow-hidden">
                <span class="text-[11px] font-bold leading-tight truncate">{{
                  item.class
                }}</span>
                <span class="text-[10px] opacity-80 leading-tight truncate">{{ item.class_type }}.{{ item.class_number }}</span>
                <span
                  class="mt-auto text-[10px] opacity-80 leading-tight truncate flex items-center gap-0.5"
                >
                  <MapPin class="w-2.5 h-2.5 shrink-0" />{{ item.location }}
                </span>
              </div>
              <!-- Export button on hover -->
              <button
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-0.5 rounded bg-white/60 hover:bg-white/90"
                title="Exportar para Google Calendar"
                @click.stop="exportToGoogleCalendar(item)"
              >
                <img
                  src="/google-logo.svg"
                  alt="Google"
                  class="w-3 h-3"
                >
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef } from "vue";
import { Calendar, CalendarArrowDown, ImageDown, MapPin, RefreshCw } from "lucide-vue-next";
import { toBlob } from "html-to-image";
import { useClipQuery } from "../composables/useClipQuery";
import { useToast } from "../composables/useToast";
import { saveDownload, savedMessage } from "../lib/downloads";
import { extractYearForRequest, type Period } from "../lib/academic";
import { localStamp, scheduleToIcs, utcStamp } from "../lib/ics";
import {
  CLASS_TYPE_LABELS,
  classSeries,
  isoDay,
  layoutDay,
  scheduleDays,
  WEEKDAY_INDEX,
  type Placement,
  type ClassType,
  type HourMinute,
  type ScheduleItem,
  type Weekday,
} from "../lib/schedule";

const props = defineProps<{
  studentId: string | null;
  year: string | null;
  period: string | null;
}>();

const HOUR_PX = 52;
const EXPORT_WIDTH = 960;

const weekdayFromDate = (date: Date): Weekday | null => {
  const iso = isoDay(date);
  return (
    (Object.keys(WEEKDAY_INDEX) as Weekday[]).find(
      (day) => WEEKDAY_INDEX[day] === iso,
    ) ?? null
  );
};

const {
  data: scheduleData,
  loading,
  error,
  refresh: refreshSchedule,
} = useClipQuery<ScheduleItem[]>(
  "get_schedule",
  toRef(props, "studentId"),
  toRef(props, "year"),
  { params: computed(() => ({ period: props.period })) },
);

const schedule = computed(() => scheduleData.value ?? []);

const weekDays = computed(() => scheduleDays(schedule.value));

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

const formatTime = (hm: HourMinute) =>
  `${String(hm.hour).padStart(2, "0")}:${String(hm.min).padStart(2, "0")}`;

// Grouped and laid out once per schedule change rather than for each day column on
// every render.
const scheduleByDay = computed(() => {
  const byDay = new Map<Weekday, ScheduleItem[]>();
  for (const day of weekDays.value) byDay.set(day.key, []);
  for (const item of schedule.value) {
    byDay.get(item.weekday)?.push(item);
  }
  return byDay;
});

const getScheduleForDay = (day: Weekday) => scheduleByDay.value.get(day) ?? [];

const placements = computed(() => {
  const all = new Map<ScheduleItem, Placement>();
  for (const items of scheduleByDay.value.values()) {
    for (const [item, placement] of layoutDay(items)) all.set(item, placement);
  }
  return all;
});

/** Left edge and width within the day column, sharing it with any clashing class. */
const horizontalPlacement = (item: ScheduleItem) => {
  const { col, cols } = placements.value.get(item) ?? { col: 0, cols: 1 };
  return {
    left: `calc(${(col * 100) / cols}% + 4px)`,
    width: `calc(${100 / cols}% - 8px)`,
  };
};

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

/**
 * Today's column key. Held in a ref rather than derived per render: a computed
 * reading `new Date()` would cache the first value forever, and this is a desktop
 * app that stays open across midnight, so the highlight is refreshed on a timer.
 */
const todayKey = ref(weekdayFromDate(new Date()));
let midnightTimer: number | undefined;

const scheduleMidnightRefresh = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  midnightTimer = window.setTimeout(() => {
    todayKey.value = weekdayFromDate(new Date());
    scheduleMidnightRefresh();
  }, midnight.getTime() - now.getTime());
};

onMounted(scheduleMidnightRefresh);
onUnmounted(() => clearTimeout(midnightTimer));

const isToday = (day: Weekday) => todayKey.value === day;

/** The schedule's lective year and period, once both are known. */
const series = computed(() =>
  props.year && props.period
    ? { year: extractYearForRequest(props.year), period: props.period as Period }
    : null,
);

/** Opens Google Calendar with one class as a weekly event, until the period ends. */
const exportToGoogleCalendar = (item: ScheduleItem) => {
  if (!series.value) return;
  const { first, until } = classSeries(item, series.value.year, series.value.period);
  // Class times are Lisbon times: given without "Z", ctz tells Google which zone they are in
  const url =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(item.class)}` +
    `&dates=${localStamp(first, item.time_start)}/${localStamp(first, item.time_end)}` +
    `&ctz=Europe/Lisbon` +
    `&details=${encodeURIComponent(`${CLASS_TYPE_LABELS[item.class_type]} ${item.class_number}`)}` +
    `&location=${encodeURIComponent(item.location)}` +
    `&recur=${encodeURIComponent(`RRULE:FREQ=WEEKLY;UNTIL=${utcStamp(until)}`)}`;
  window.open(url, "_blank");
};

const { success: toastSuccess, error: toastError } = useToast();
const gridEl = ref<HTMLElement | null>(null);

const exportPng = async () => {
  const el = gridEl.value;
  if (!el) return;
  // Capture an offscreen copy laid out at a fixed width, so every export looks
  // the same and the visible grid never changes. `.exporting` hides the today
  // highlight (see the `in-[.exporting]` classes in the template).
  const stage = document.createElement("div");
  stage.className = "exporting";
  Object.assign(stage.style, { position: "fixed", left: "-10000px", top: "0" });
  const copy = el.cloneNode(true) as HTMLElement;
  copy.style.width = `${EXPORT_WIDTH}px`;
  stage.appendChild(copy);
  document.body.appendChild(stage);
  try {
    const blob = await toBlob(copy, {
      pixelRatio: 2,
      backgroundColor: getComputedStyle(el.parentElement!).backgroundColor,
    });
    if (!blob) throw new Error("imagem vazia");
    const name = `horario${props.year ? "-" + props.year.replace("/", "-") : ""}.png`;
    const path = await saveDownload(name, new Uint8Array(await blob.arrayBuffer()));
    toastSuccess(savedMessage(path));
  } catch (err) {
    console.error("Error exporting schedule:", err);
    toastError(`Erro ao exportar horário: ${err}`);
  } finally {
    stage.remove();
  }
};

/** Saves the whole schedule as one calendar file, for any calendar app to import. */
const exportIcs = async () => {
  if (!series.value) return;
  const { year, period } = series.value;
  try {
    const ics = scheduleToIcs(schedule.value, year, period);
    const path = await saveDownload(`horario-${year}-${period}.ics`, new TextEncoder().encode(ics));
    toastSuccess(savedMessage(path));
  } catch (err) {
    console.error("Error exporting calendar:", err);
    toastError(`Erro ao exportar calendário: ${err}`);
  }
};
</script>
