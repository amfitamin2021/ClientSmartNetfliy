import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { updateApiClient } from '../services/api'
import { getServerUrl, getDemoMode, SERVER_CONFIG } from '../config/serverConfig'

// Константы из конфигурации
const { DEFAULT_SERVER_URL, SERVER_URL_KEY, DEMO_MODE_KEY } = SERVER_CONFIG

export const useServerStore = defineStore('server', () => {
  // Состояние
  const serverUrl = ref(getServerUrl())
  const demoMode = ref(getDemoMode())
  const isConnected = ref(false)
  const connectionError = ref(null)
  const isTestingConnection = ref(false)

  // Инициализация состояния из localStorage при загрузке
  const initializeFromStorage = () => {
    serverUrl.value = getServerUrl()
    demoMode.value = getDemoMode()
  }

  // Сохранение URL сервера
  const setServerUrl = (url) => {
    if (!url) {
      url = DEFAULT_SERVER_URL
    }
    
    // Проверка и форматирование URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url
    }
    
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = url.endsWith('/') ? url + 'api' : url + '/api'
    }
    
    // Обновляем состояние и localStorage
    serverUrl.value = url
    localStorage.setItem(SERVER_URL_KEY, url)
    
    // Обновляем API-клиент
    updateApiClient()
    
    return url
  }

  // Включение/выключение демо-режима
  const setDemoMode = (enabled) => {
    demoMode.value = enabled
    localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false')
    
    // Обновление API-клиента важно и при переключении демо-режима
    updateApiClient()
  }

  // Проверка соединения с сервером
  const testConnection = async () => {
    if (demoMode.value) {
      isConnected.value = true
      connectionError.value = null
      return true
    }
    
    isTestingConnection.value = true
    connectionError.value = null
    
    try {
      const response = await fetch(`${serverUrl.value}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      })
      
      if (response.ok) {
        isConnected.value = true
        connectionError.value = null
        return true
      } else {
        isConnected.value = false
        connectionError.value = `Ошибка соединения: ${response.status} ${response.statusText}`
        return false
      }
    } catch (error) {
      isConnected.value = false
      connectionError.value = `Ошибка соединения: ${error.message}`
      return false
    } finally {
      isTestingConnection.value = false
    }
  }

  // Сброс настроек сервера к значениям по умолчанию
  const resetServerSettings = () => {
    setServerUrl(DEFAULT_SERVER_URL)
    setDemoMode(false)
    isConnected.value = false
    connectionError.value = null
  }

  // Следим за изменениями URL сервера и состояния демо-режима
  watch(serverUrl, (newUrl) => {
    localStorage.setItem(SERVER_URL_KEY, newUrl)
  })

  watch(demoMode, (newMode) => {
    localStorage.setItem(DEMO_MODE_KEY, newMode ? 'true' : 'false')
  })

  // Инициализируем состояние из хранилища при создании экземпляра хранилища
  initializeFromStorage()

  return {
    serverUrl,
    demoMode,
    isConnected,
    connectionError,
    isTestingConnection,
    setServerUrl,
    setDemoMode,
    testConnection,
    resetServerSettings
  }
}) 