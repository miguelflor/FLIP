import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AppLayout from '../views/AppLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useStudent } from '../composables/useStudent'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/app',
      component: AppLayout,
      children: [
        {
          path: '',
          redirect: '/app/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// The app's pages need a session: without one (the app was reloaded, or the session
// ended) they go to the login page, which logs back in by itself when it can.
router.beforeEach((to) => {
  if (to.path.startsWith('/app') && !useStudent().isAuthenticated.value) return '/'
})

export default router
