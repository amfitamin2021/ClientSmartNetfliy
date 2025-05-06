import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import { useUserStore } from '../store/userStore'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/devices',
    name: 'Devices',
    component: () => import('../views/Devices.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: () => import('../views/Rooms.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scenarios',
    name: 'Scenarios',
    component: () => import('../views/Scenarios.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/server-settings',
    name: 'ServerSettings',
    component: () => import('../views/ServerSettings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/Notifications.vue'),
    meta: { requiresAuth: true }
  },
  // Маршруты аутентификации
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true }
  },
  // Вложенные маршруты для безопасности
  {
    path: '/security',
    name: 'Security',
    component: () => import('../views/Security.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'cameras',
        name: 'Cameras',
        component: () => import('../views/security/Cameras.vue')
      },
      {
        path: 'sensors',
        name: 'Sensors',
        component: () => import('../views/security/Sensors.vue')
      },
      {
        path: 'locks',
        name: 'Locks',
        component: () => import('../views/security/Locks.vue')
      },
      {
        path: 'alarms',
        name: 'Alarms',
        component: () => import('../views/security/Alarms.vue')
      }
    ]
  },
  // Маршрут для 404 страницы
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some(record => record.meta.guest)
  
  // Проверяем, авторизован ли пользователь
  if (requiresAuth && !userStore.isLoggedIn) {
    // Если не авторизован и маршрут требует авторизации, перенаправляем на страницу входа
    next('/login')
  } else if (isGuestRoute && userStore.isLoggedIn) {
    // Если пользователь уже авторизован, но пытается зайти на страницу входа или регистрации,
    // перенаправляем на главную страницу
    next('/')
  } else {
    // В остальных случаях разрешаем переход
    next()
  }
})

export default router 