<template>
  <header class="bg-white shadow-sm p-3 flex justify-between items-center">
    <h1 class="text-xl font-medium">Мой Дом</h1>
    
    <div class="flex items-center space-x-3">
      <div class="flex items-center space-x-2">
        <router-link to="/notifications" class="notification-btn relative">
          <i class="fas fa-bell text-gray-600"></i>
        </router-link>
        <button class="dark-mode-toggle">
          <i class="fas fa-moon text-gray-600"></i>
        </button>
        <div class="relative">
          <button @click="toggleUserMenu" class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <img :src="userAvatarUrl" :alt="username" class="w-full h-full object-cover" />
          </button>
          
          <!-- Выпадающее меню пользователя -->
          <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
            <router-link to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Профиль</router-link>
            <router-link to="/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Настройки</router-link>
            <button @click="logout" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Выйти</button>
          </div>
        </div>
      </div>
    </div>
  </header>
  
  <div class="bg-white shadow-sm px-3 py-1 flex items-center space-x-3">
    <button class="px-3 py-1 rounded-md flex items-center text-red-600 hover:bg-red-50">
      <i class="fas fa-power-off mr-2"></i>
      <span>Выключить всё</span>
    </button>
    
    <button class="px-3 py-1 rounded-md flex items-center text-green-600 hover:bg-green-50">
      <i class="fas fa-leaf mr-2"></i>
      <span>Эко-режим</span>
    </button>
    
    <button class="px-3 py-1 rounded-md flex items-center text-blue-600 hover:bg-blue-50">
      <i class="fas fa-shield-alt mr-2"></i>
      <span>Охрана</span>
    </button>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/userStore'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const isUserMenuOpen = ref(false)
    
    // Имя пользователя для отображения и аватарки
    const username = computed(() => userStore.user?.username || 'User')
    
    // URL аватарки
    const userAvatarUrl = computed(() => {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(username.value)}&background=random`
    })
    
    // Переключение меню пользователя
    const toggleUserMenu = () => {
      isUserMenuOpen.value = !isUserMenuOpen.value
    }
    
    // Выход из системы
    const logout = () => {
      userStore.logout()
      router.push('/login')
    }
    
    return {
      isUserMenuOpen,
      username,
      userAvatarUrl,
      toggleUserMenu,
      logout
    }
  }
}
</script> 