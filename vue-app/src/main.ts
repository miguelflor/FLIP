import { createApp } from 'vue'
// Bundled with the app: no request to Google on launch, and the font works offline
import '@fontsource-variable/inter'
import './style.css'
import App from './App.vue'
import router from './router'
import './composables/useTheme'
import { watchEffect } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { locale } from './lib/i18n'

// The backend draws a little text itself (the folder picker's title): keep it in step
watchEffect(() => {
  invoke('set_language', { locale: locale.value }).catch((e) => console.error('Error setting language:', e))
})

createApp(App).use(router).mount('#app')
