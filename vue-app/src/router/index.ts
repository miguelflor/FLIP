import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import Files from '../views/Files.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/app',
      component: Layout,
      children: [
        {
          path: '',
          redirect: '/app/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard
        },
        {
          path: 'files',
          name: 'files',
          component: Files
        }
      ]
    }
  ]
})

export default router
