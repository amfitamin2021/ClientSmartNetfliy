<template>
  <div class="server-settings-page p-4 md:p-8">
    <h1 class="text-2xl font-bold mb-6">Настройки сервера</h1>
    
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-server mr-2 text-blue-500"></i>
        Подключение к серверу
      </h2>
      
      <form @submit.prevent="saveSettings" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1" for="server-url">
            Адрес сервера
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-link text-gray-400"></i>
            </div>
            <input 
              id="server-url"
              v-model="serverUrl"
              type="text" 
              placeholder="http://localhost:3000/api"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            >
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Формат: http://hostname:port/api (или https://hostname/api)
          </p>
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            type="button" 
            @click="testConnectionToServer" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            :disabled="isTestingConnection"
          >
            <i :class="['fas mr-2', isTestingConnection ? 'fa-spinner animate-spin' : 'fa-plug']"></i>
            Проверить соединение
          </button>
          
          <div v-if="connectionTestResult" class="ml-2 text-sm">
            <span :class="connectionTestResult.success ? 'text-green-500' : 'text-red-500'">
              <i :class="['fas', connectionTestResult.success ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
              {{ connectionTestResult.message }}
            </span>
          </div>
        </div>
      </form>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-desktop mr-2 text-blue-500"></i>
        Режим работы
      </h2>
      
      <div class="space-y-4">
        <div class="flex items-center">
          <label class="inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="demoMode" class="sr-only peer">
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span class="ml-3 text-sm font-medium text-gray-900">Демонстрационный режим</span>
          </label>
        </div>
        
        <p class="text-sm text-gray-500">
          В демонстрационном режиме приложение будет работать без реального подключения к серверу, используя тестовые данные. Это полезно для демонстрации или отладки интерфейса.
        </p>
        
        <div v-if="demoMode" class="bg-blue-50 border-l-4 border-blue-400 p-4 mt-2">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-info-circle text-blue-400"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                Демонстрационный режим активен. Все данные являются имитацией и не отражают реальное состояние вашей системы.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between">
      <button 
        @click="resetToDefaults" 
        class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <i class="fas fa-undo mr-2"></i>
        Сбросить настройки
      </button>
      
      <button 
        @click="saveSettings" 
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <i class="fas fa-save mr-2"></i>
        Сохранить настройки
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useServerStore } from '../store/serverStore'
import { useRouter } from 'vue-router'
import { useNotify } from '../composables/useNotify'

const serverStore = useServerStore()
const router = useRouter()
const { notify } = useNotify()

// Локальные копии состояния
const serverUrl = ref(serverStore.serverUrl)
const demoMode = ref(serverStore.demoMode)
const isTestingConnection = ref(false)
const connectionTestResult = ref(null)

// Следим за изменениями demoMode в локальном состоянии
watch(demoMode, (newValue) => {
  // При изменении демо-режима сразу применяем, чтобы пользователь мог видеть изменения
  serverStore.setDemoMode(newValue)
})

// Проверка соединения с сервером
const testConnectionToServer = async () => {
  isTestingConnection.value = true
  connectionTestResult.value = null
  
  try {
    const success = await serverStore.testConnection()
    
    if (success) {
      connectionTestResult.value = {
        success: true,
        message: 'Соединение установлено успешно'
      }
    } else {
      connectionTestResult.value = {
        success: false,
        message: serverStore.connectionError || 'Не удалось подключиться к серверу'
      }
    }
  } catch (error) {
    connectionTestResult.value = {
      success: false,
      message: error.message || 'Произошла ошибка при проверке соединения'
    }
  } finally {
    isTestingConnection.value = false
  }
}

// Сохранение настроек
const saveSettings = () => {
  // Обновляем URL сервера
  const formattedUrl = serverStore.setServerUrl(serverUrl.value)
  serverUrl.value = formattedUrl
  
  // Уже установили demoMode через watcher
  
  // Показываем уведомление об успешном сохранении
  notify({
    title: 'Настройки сохранены',
    text: 'Настройки сервера успешно сохранены',
    type: 'success'
  })
}

// Сброс настроек
const resetToDefaults = () => {
  // Запрос подтверждения
  if (confirm('Вы уверены, что хотите сбросить настройки сервера к значениям по умолчанию?')) {
    // Сбрасываем настройки в хранилище
    serverStore.resetServerSettings()
    
    // Обновляем локальные копии
    serverUrl.value = serverStore.serverUrl
    demoMode.value = serverStore.demoMode
    
    // Оповещаем пользователя
    notify({
      title: 'Настройки сброшены',
      text: 'Настройки сервера сброшены к значениям по умолчанию',
      type: 'info'
    })
  }
}

// При монтировании компонента обновляем локальные копии
onMounted(() => {
  serverUrl.value = serverStore.serverUrl
  demoMode.value = serverStore.demoMode
})
</script>

<style scoped>
.server-settings-page {
  max-width: 800px;
  margin: 0 auto;
}
</style> 