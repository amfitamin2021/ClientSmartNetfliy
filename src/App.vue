<script>
import Sidebar from './components/layout/Sidebar.vue'
import Header from './components/layout/Header.vue'
import ServerConnectionModal from './components/ServerConnectionModal.vue'
import { useUserStore } from './store/userStore'
import { useServerStore } from './store/serverStore'
import { computed, ref, onMounted } from 'vue'

export default {
  name: 'App',
  components: {
    Sidebar,
    Header,
    ServerConnectionModal
  },
  setup() {
    const userStore = useUserStore()
    const serverStore = useServerStore()
    const isLoggedIn = computed(() => userStore.isLoggedIn)
    const showServerModal = ref(false)
    
    // Проверяем настройки сервера при запуске
    onMounted(() => {
      // Если пользователь авторизован и URL сервера не задан - показываем модальное окно
      const isFirstRun = !localStorage.getItem('app_first_run_completed')
      
      if (isLoggedIn.value && (
          // Если это первый запуск приложения и мы не в демо-режиме
          (isFirstRun && !serverStore.demoMode) || 
          // Или сервер не задан и мы не в демо-режиме
          (!serverStore.serverUrl && !serverStore.demoMode)
        )) {
        // Показываем модальное окно с настройками сервера
        showServerModal.value = true
        
        // Отмечаем, что приложение уже запускалось
        localStorage.setItem('app_first_run_completed', 'true')
      }
    })
    
    return {
      isLoggedIn,
      showServerModal
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex" id="smart-home-app">
    <!-- Боковое меню - показываем только для авторизованных пользователей -->
    <Sidebar v-if="isLoggedIn" />
    
    <!-- Основной контент -->
    <main id="main-content" :class="{'lg:ml-56': isLoggedIn}" class="min-h-screen flex-1">
      <!-- Хедер - показываем только для авторизованных пользователей -->
      <Header v-if="isLoggedIn" />
      <router-view />
    </main>

    <!-- Модальное окно выбора сервера (при первом запуске в облаке) -->
    <ServerConnectionModal 
      v-if="showServerModal"
      @close="showServerModal = false"
    />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#main-content {
  min-height: 100vh;
  background-color: #f7f7f7;
}

/* Мобильная адаптация */
@media (max-width: 1024px) {
  #main-content {
    margin-left: 0;
  }
}
</style>
