import { createApp } from 'vue'
// Bundled with the app: no request to Google on launch, and the font works offline
import '@fontsource-variable/inter'
import './style.css'
import App from './App.vue'
import router from './router'
import './composables/useTheme'

createApp(App).use(router).mount('#app')
