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
        :aria-expanded="open"
        @click="toggleOpen"
      >
        <ChevronRight :class="['h-4 w-4 shrink-0 text-slate-400 transition-transform', { 'rotate-90': open }]" />
        <span class="truncate">{{ chair.text }}</span>
      </button>
    </span>

    <div
      v-if="open"
      class="mt-2 ml-7 space-y-2"
    >
      <input
        v-model="query"
        type="search"
        placeholder="Procurar ficheiros..."
        aria-label="Procurar ficheiros"
        class="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500"
      >
      <p
        v-if="listing"
        class="text-slate-500"
      >
        A carregar...
      </p>
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
              <span class="truncate">{{ f.name }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronRight, Download, FolderDown } from "lucide-vue-next";
import { invoke } from "@tauri-apps/api/core";
import { PERIOD_N, PERIOD_TYPE, UNIDADE, YEAR } from "../lib/clipVars";
import { extractYearForRequest } from "../lib/academic";
import { storage } from "../lib/storage";
import { useToast } from "../composables/useToast";
import { useStudent } from "../composables/useStudent";

interface ChairType {
  href: string;
  text: string;
}

interface FileResponse {
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}

interface FileParams {
  session_id: string;
  period: string;
  unit_id: string;
  file_type: string;
  name: string;
  year: string;
  type_period: string;
}

interface CourseFile {
  name: string;
  type_name: string;
  href: string;
}

interface Props {
  chair: ChairType;
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

// Builds the request params, or toasts why it can't and returns null.
const buildParams = (): FileParams | null => {
  if (!sessionId.value) {
    error("Not authenticated. Please log in again.");
    return null;
  }
  if (!storage.get("selectedYear")) {
    error("Please select a year.");
    return null;
  }
  if (!currentStudentId.value) {
    error("No student selected. Please select a student from the navbar.");
    return null;
  }

  const hrefParams = parseHrefParams(props.chair.href);
  return {
    session_id: sessionId.value,
    period: hrefParams[PERIOD_N] || "",
    unit_id: hrefParams[UNIDADE] || "",
    file_type: "all",
    name: props.chair.text,
    year: hrefParams[YEAR] || "",
    type_period: hrefParams[PERIOD_TYPE] || "",
  };
};

const saveBase64 = (data: string, filename: string, type = "application/octet-stream") => {
  const blob = new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const handleDownload = async () => {
  const params = buildParams();
  if (!params) return;
  loading.value = true;

  try {
    const res = await invoke<FileResponse>("get_file", {
      params,
      studentId: currentStudentId.value,
      year: extractYearForRequest(storage.get("selectedYear")!),
    });

    if (!res.success || !res.data) {
      error(res.error || "Failed to download file");
    } else {
      saveBase64(res.data, res.filename || "download.zip", "application/zip");
      success("File downloaded successfully!");
    }
  } catch (err: unknown) {
    console.error("Error downloading chair:", err);
    error("Error downloading file.");
  } finally {
    loading.value = false;
  }
};

const open = ref(false);
const query = ref("");
const listing = ref(false);
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
  const q = query.value.trim().toLowerCase();
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

const toggleOpen = async () => {
  open.value = !open.value;
  if (!open.value || files.value || listing.value) return;
  const params = buildParams();
  if (!params) return;
  listing.value = true;
  try {
    files.value = await invoke<CourseFile[]>("list_files", {
      params,
      studentId: currentStudentId.value,
    });
  } catch (err: unknown) {
    console.error("Error listing files:", err);
    error("Error listing files.");
  } finally {
    listing.value = false;
  }
};

const downloadOne = async (f: CourseFile) => {
  if (!sessionId.value) return error("Not authenticated. Please log in again.");
  downloading.value.add(f.href);
  try {
    const res = await invoke<FileResponse>("download_file", {
      sessionId: sessionId.value,
      href: f.href,
    });
    if (res.data) saveBase64(res.data, res.filename || f.name);
  } catch (err: unknown) {
    console.error("Error downloading file:", err);
    error(`Error downloading ${f.name}.`);
  } finally {
    downloading.value.delete(f.href);
  }
};
</script>
