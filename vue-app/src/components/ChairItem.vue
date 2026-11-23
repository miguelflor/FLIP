<template>
  <li class="transition-all duration-200">
    <span class="flex items-center min-w-0 hover:translate-x-1 transition-transform duration-200">
      <span class="mr-2 flex items-center justify-center h-5 w-5">
        <span
          v-if="loading"
          class="animate-spin inline-block rounded-full border-4 h-5 w-5 border-slate-600 border-t-transparent align-[-0.125em]"
        />
        <button
          v-else
          class="text-slate-600 hover:text-slate-800 cursor-pointer flex items-center justify-center"
          :disabled="loading"
          type="button"
          title="Descarregar tudo (zip)"
          style="min-width: 20px; min-height: 20px"
          @click="handleDownload"
        >
          <FolderDown class="h-5 w-5" />
        </button>
      </span>
      <button
        type="button"
        class="flex items-center gap-1 min-w-0 cursor-pointer text-left hover:text-blue-700"
        :aria-expanded="expanded"
        @click="toggleOpen"
      >
        <ChevronRight :class="['h-4 w-4 shrink-0 text-slate-400 transition-transform', { 'rotate-90': expanded }]" />
        <span class="truncate">{{ chair.text }}</span>
      </button>
    </span>

    <div
      v-if="expanded"
      class="mt-2 ml-7 space-y-2"
    >
      <p
        v-if="listing"
        class="text-slate-500"
      >
        A carregar...
      </p>
      <div
        v-else-if="listError"
        class="text-red-500"
        role="alert"
      >
        <p>{{ listError }}</p>
        <button
          type="button"
          class="text-blue-500 hover:underline cursor-pointer"
          @click="loadFiles"
        >
          Tentar novamente
        </button>
      </div>
      <p
        v-else-if="files && filtered.length === 0"
        class="text-slate-500"
      >
        {{ files.length ? 'Nenhum ficheiro encontrado.' : 'Esta cadeira não tem ficheiros.' }}
      </p>
      <div
        v-else
        class="space-y-3 max-h-64 overflow-y-auto"
      >
        <section
          v-for="[type, group] in sections"
          :key="type"
        >
          <h5 class="font-medium text-slate-700 mb-1">
            {{ SECTION_LABELS[type] ?? type }} ({{ group.length }})
          </h5>
          <ul class="space-y-1">
            <li
              v-for="f in group"
              :key="f.href"
              class="flex items-center gap-2 min-w-0"
            >
              <button
                type="button"
                class="shrink-0 text-slate-600 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                :disabled="downloading.has(f.href)"
                :title="`Descarregar ${f.name}`"
                @click="downloadOne(f)"
              >
                <Download class="h-4 w-4" />
              </button>
              <span
                class="truncate"
                :title="fileDetails(f)"
              >{{ f.name }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </li>
</template>

<script lang="ts">
// Shared across all chairs: background file listings run one after another.
const backgroundListings = { queue: Promise.resolve() };
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { ChevronRight, Download, FolderDown } from "lucide-vue-next";
import { invoke } from "@tauri-apps/api/core";
import { PERIOD_N, PERIOD_TYPE, UNIDADE, YEAR } from "../lib/clipVars";
import { useToast } from "../composables/useToast";
import { useStudent } from "../composables/useStudent";
import { whenIdle } from "../composables/useClipQuery";
import { listCourseFiles, type CourseFile, type UnitParams } from "../composables/useCourseFiles";
import { savedMessage } from "../lib/downloads";

interface ChairType {
  href: string;
  text: string;
}

interface Props {
  chair: ChairType;
  query: string;
  /** Load the files in the background, before the chair is opened. */
  preload?: boolean;
}

const props = defineProps<Props>();

const loading = ref(false);
const { error, success } = useToast();
const { sessionId, currentStudentId } = useStudent();

const parseHrefParams = (href: string) => {
  const params: Record<string, string> = {};
  const queryStart = href.indexOf("?");
  if (queryStart === -1) return params;

  const query = href.substring(queryStart + 1);
  const pairs = query.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  }
  return params;
};

// The unit's identifiers, from its CLIP link. Null (with a toast) without a session.
const buildParams = (): UnitParams | null => {
  if (!sessionId.value || !currentStudentId.value) {
    error("Sessão não encontrada. Inicie sessão novamente.");
    return null;
  }

  const hrefParams = parseHrefParams(props.chair.href);
  return {
    session_id: sessionId.value,
    period: hrefParams[PERIOD_N] || "",
    unit_id: hrefParams[UNIDADE] || "",
    year: hrefParams[YEAR] || "",
    type_period: hrefParams[PERIOD_TYPE] || "",
  };
};

interface CourseDownload {
  path: string;
  saved: number;
  failed: number;
}

// Downloads every file of the unit as one ZIP, from its file list (loaded first if need be).
const handleDownload = async () => {
  const params = buildParams();
  if (!params) return;
  loading.value = true;

  try {
    const list = files.value ?? (files.value = await listCourseFiles(params, currentStudentId.value!));
    if (!list.length) {
      error(`${props.chair.text} não tem ficheiros`);
      return;
    }
    const res = await invoke<CourseDownload>("download_course", {
      sessionId: params.session_id,
      name: props.chair.text,
      year: params.year,
      files: list.map((f) => ({ href: f.href, type_name: f.type_name })),
    });
    success(savedMessage(res.path));
    if (res.failed) {
      error(`${res.failed} de ${res.saved + res.failed} ficheiros não foram descarregados`);
    }
  } catch (err: unknown) {
    console.error("Error downloading chair:", err);
    error(`Erro ao descarregar ${props.chair.text}: ${err}`);
  } finally {
    loading.value = false;
  }
};

const open = ref(false);
const listing = ref(false);
const listError = ref<string | null>(null);
const files = ref<CourseFile[] | null>(null);
const downloading = ref(new Set<string>());

// CLIP's section names, keyed by the backend's type_name (FILE_TYPES in constants.rs).
const SECTION_LABELS: Record<string, string> = {
  Multimedia: "Material Multimédia",
  Problemas: "Problemas",
  Protocolos: "Protocolos",
  Seminarios: "Seminários",
  Exames: "Exames",
  Testes: "Testes",
  Textos_de_Apoio: "Textos de Apoio",
  Outros: "Outros",
};

const filtered = computed(() => {
  const q = props.query.trim().toLowerCase();
  return (files.value ?? []).filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (SECTION_LABELS[f.type_name] ?? f.type_name).toLowerCase().includes(q),
  );
});

// Backend returns files in CLIP's section order, so a Map keeps it; empty sections never appear.
const sections = computed(() => {
  const groups = new Map<string, CourseFile[]>();
  for (const f of filtered.value) {
    groups.set(f.type_name, [...(groups.get(f.type_name) ?? []), f]);
  }
  return [...groups];
});

const fileDetails = (f: CourseFile) =>
  [f.name, f.date && `Data: ${f.date}`, f.size && `Tamanho: ${f.size}`, f.uploader && `Por: ${f.uploader}`]
    .filter(Boolean)
    .join("\n");

// A search opens every chair with matching files.
const expanded = computed(() => open.value || (!!props.query.trim() && filtered.value.length > 0));

const toggleOpen = () => {
  open.value = !expanded.value;
  if (open.value) loadFiles();
};


const loadFiles = async () => {
  if (files.value || listing.value) return;
  const params = buildParams();
  if (!params) return;
  listing.value = true;
  listError.value = null;
  try {
    files.value = await listCourseFiles(params, currentStudentId.value!);
  } catch (err: unknown) {
    // Shown inline when the chair is open; a failed background preload stays quiet
    // and is retried when the chair is opened.
    console.error("Error listing files:", err);
    listError.value = String(err);
  } finally {
    listing.value = false;
  }
};

// Preload the chair's files in the background, so they show (and search finds them) at once.
// Only chairs asked to (the selected period's), one at a time, each only once nothing on screen
// is loading, so the schedule, tests and profile come first. Opening a chair calls loadFiles
// directly, jumping ahead of this queue.
let alive = true;
onBeforeUnmount(() => (alive = false));
if (props.preload) {
  backgroundListings.queue = backgroundListings.queue.then(async () => {
    if (!alive) return;
    await whenIdle();
    if (alive) await loadFiles();
  });
}

const downloadOne = async (f: CourseFile) => {
  if (!sessionId.value) return;
  downloading.value.add(f.href);
  try {
    const path = await invoke<string>("download_file", {
      sessionId: sessionId.value,
      href: f.href,
    });
    success(savedMessage(path));
  } catch (err: unknown) {
    console.error("Error downloading file:", err);
    error(`Erro ao descarregar «${f.name}»: ${err}`);
  } finally {
    downloading.value.delete(f.href);
  }
};
</script>
