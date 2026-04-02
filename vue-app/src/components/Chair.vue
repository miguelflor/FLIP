<template>
  <li class="transition-all duration-200 hover:translate-x-1">
    <span class="flex items-center">
      <span class="mr-2 flex items-center justify-center h-5 w-5">
        <span v-if="loading" class="animate-spin inline-block rounded-full border-4 h-5 w-5 border-slate-600 border-t-transparent align-[-0.125em]"></span>
        <button
          v-else
          @click="handleDownload"
          class="text-slate-600 hover:text-slate-800 cursor-pointer flex items-center justify-center"
          :disabled="loading"
          type="button"
          style="min-width: 20px; min-height: 20px"
        >
          <FolderDown class="h-5 w-5" />
        </button>
      </span>
      <span class="truncate">{{ chair.text }}</span>
    </span>
  </li>
  <Notification
    v-if="notification"
    :type="notification.type"
    :message="notification.message"
    @close="notification = null"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FolderDown } from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import Notification from './Notification.vue';
import { PERIOD_N, PERIOD_TYPE, UNIDADE, YEAR } from '../lib/clipVars';

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

interface Props {
  chair: ChairType;
  idx: number;
}

const props = defineProps<Props>();

const loading = ref(false);
const notification = ref<{ type: 'success' | 'error', message: string } | null>(null);

const parseHrefParams = (href: string) => {
  const params: Record<string, string> = {};
  const queryStart = href.indexOf('?');
  if (queryStart === -1) return params;
  
  const query = href.substring(queryStart + 1);
  const pairs = query.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value);
    }
  }
  return params;
};

const handleDownload = async () => {
  loading.value = true;

  try {
    const sessionId = localStorage.getItem('clipSessionId');
    if (!sessionId) {
      notification.value = {
        type: 'error',
        message: 'Not authenticated. Please log in again.'
      };
      loading.value = false;
      return;
    }

    const hrefParams = parseHrefParams(props.chair.href);
    
    const params: FileParams = {
      session_id: sessionId,
      period: hrefParams[PERIOD_N] || '',
      unit_id: hrefParams[UNIDADE] || '',
      file_type: 'all',
      name: props.chair.text,
      year: hrefParams[YEAR] || '',
      type_period: hrefParams[PERIOD_TYPE] || ''
    };

    const res = await invoke<FileResponse>('get_file', { params });

    if (!res.success || !res.data) {
      notification.value = {
        type: 'error',
        message: res.error || 'Failed to download file'
      };
    } else {
      // Convert base64 back to blob and download
      const byteCharacters = atob(res.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || 'download.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      notification.value = {
        type: 'success',
        message: 'File downloaded successfully!'
      };
    }
  } catch (err: unknown) {
    console.error('Error downloading chair:', err);
    notification.value = {
      type: 'error',
      message: 'Error downloading file.'
    };
  } finally {
    loading.value = false;
  }
};
</script>
