<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Хедер модального окна -->
      <div class="bg-blue-600 px-6 py-4 text-white">
        <h2 class="text-xl font-semibold">Настройка подключения к серверу</h2>
      </div>
      
      <!-- Содержимое модального окна -->
      <div class="px-6 py-4">
        <p class="mb-4 text-gray-700">
          Для работы приложения требуется подключение к серверу "Умного дома" или выбор демонстрационного режима.
        </p>
        
        <!-- Форма настройки сервера -->
        <div class="space-y-4">
          <div class="flex flex-col">
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
              Например: http://192.168.1.100:3000/api
            </p>
          </div>
          
          <!-- Проверка соединения -->
          <div class="mt-2">
            <button 
              @click="testConnection" 
              class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isTestingConnection"
            >
              <i :class="['fas mr-2', isTestingConnection ? 'fa-spinner animate-spin' : 'fa-plug']"></i>
              {{ isTestingConnection ? 'Проверка соединения...' : 'Проверить соединение' }}
            </button>
            
            <div v-if="connectionTestResult" class="mt-2 p-2 rounded-md text-sm" :class="{
              'bg-green-50 text-green-700': connectionTestResult.success,
              'bg-red-50 text-red-700': !connectionTestResult.success
            }">
              <div class="flex">
                <i :class="['fas mr-2', connectionTestResult.success ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
                <span>{{ connectionTestResult.message }}</span>
              </div>
            </div>
          </div>
          
          <!-- Разделитель -->
          <div class="relative py-3">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-3 bg-white text-sm text-gray-500">Или</span>
            </div>
          </div>
          
          <!-- Демо-режим -->
          <div class="flex items-center space-x-4 mt-4">
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="demoMode" class="sr-only peer">
              <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span class="ml-3 text-sm font-medium text-gray-900">Демонстрационный режим</span>
            </label>
          </div>
          
          <p class="text-sm text-gray-500 mt-1" v-if="demoMode">
            В демо-режиме будут использоваться тестовые данные без подключения к реальному серверу.
          </p>
        </div>
      </div>
      
      <!-- Футер модального окна -->
      <div class="bg-gray-50 px-6 py-4 flex justify-between">
        <button 
          @click="close" 
          class="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Отмена
        </button>
        
        <button 
          @click="saveSettings" 
          class="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          :disabled="isTestingConnection"
        >
          <i class="fas fa-save mr-2"></i>
          Сохранить настройки
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useServerStore } from '../store/serverStore'
import { useNotify } from '../composables/useNotify'

const serverStore = useServerStore()
const { notify } = useNotify()

// Локальные копии состояния
const serverUrl = ref(serverStore.serverUrl)
const demoMode = ref(serverStore.demoMode)
const isTestingConnection = ref(false)
const connectionTestResult = ref(null)

// Метод для проверки соединения
const testConnection = async () => {
  if (!serverUrl.value && !demoMode.value) {
    notify({
      title: 'Внимание',
      text: 'Введите адрес сервера или включите демонстрационный режим',
      type: 'warning'
    })
    return
  }
  
  if (demoMode.value) {
    // В демо-режиме соединение всегда успешное
    connectionTestResult.value = {
      success: true,
      message: 'Демонстрационный режим активирован'
    }
    return
  }
  
  // Проверка соединения с сервером
  isTestingConnection.value = true
  
  try {
    // Временно устанавливаем URL для теста
    serverStore.setServerUrl(serverUrl.value)
    const success = await serverStore.testConnection()
    
    if (success) {
      connectionTestResult.value = {
        success: true,
        message: 'Соединение с сервером успешно установлено'
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
  // Если в демо-режиме, просто сохраняем настройки
  if (demoMode.value) {
    serverStore.setDemoMode(true)
    
    // Оповещаем и закрываем модальное окно
    notify({
      title: 'Демо-режим активирован',
      text: 'Приложение будет работать с тестовыми данными',
      type: 'success'
    })
    
    emit('close')
    return
  }
  
  // Проверка адреса сервера
  if (!serverUrl.value) {
    notify({
      title: 'Ошибка',
      text: 'Необходимо указать адрес сервера или включить демо-режим',
      type: 'error'
    })
    return
  }
  
  // Если не проверяли соединение, проверим перед сохранением
  if (!connectionTestResult.value) {
    testConnection().then(() => {
      if (connectionTestResult.value?.success) {
        finalizeSettings()
      }
    })
  } else if (connectionTestResult.value.success) {
    finalizeSettings()
  } else {
    // Спрашиваем, хочет ли пользователь сохранить настройки, несмотря на ошибку
    if (confirm('Соединение с сервером не установлено. Все равно сохранить настройки?')) {
      finalizeSettings()
    }
  }
}

// Финальное сохранение настроек
const finalizeSettings = () => {
  // Устанавливаем URL сервера
  serverStore.setServerUrl(serverUrl.value)
  
  // Устанавливаем демо-режим
  serverStore.setDemoMode(demoMode.value)
  
  // Оповещаем пользователя
  notify({
    title: 'Настройки сохранены',
    text: 'Настройки подключения успешно сохранены',
    type: 'success'
  })
  
  // Закрываем модальное окно
  emit('close')
}

// Следим за изменениями демо-режима
watch(demoMode, (newValue) => {
  // Если включается демо-режим, сбрасываем результаты проверки соединения
  if (newValue) {
    connectionTestResult.value = null
  }
})

// Обработка закрытия модального окна
const emit = defineEmits(['close'])
const close = () => {
  if (!serverStore.serverUrl && !serverStore.demoMode) {
    // Если нет настроек подключения, включаем демо-режим по умолчанию
    serverStore.setDemoMode(true)
    
    notify({
      title: 'Демо-режим активирован',
      text: 'Для работы с реальным сервером настройте подключение в разделе "Настройки сервера"',
      type: 'info'
    })
  }
  
  emit('close')
}
</script> 