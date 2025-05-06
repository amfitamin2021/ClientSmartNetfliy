// Константы для хранения конфигурации в localStorage
const SERVER_URL_KEY = 'smart_home_server_url'
const DEMO_MODE_KEY = 'smart_home_demo_mode'

// Значения по умолчанию
const DEFAULT_SERVER_URL = 'http://localhost:3000/api'

// Функция для получения URL сервера
export const getServerUrl = () => {
  return localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL
}

// Функция для получения статуса демо-режима
export const getDemoMode = () => {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

// Константы для работы с сервером
export const SERVER_CONFIG = {
  DEFAULT_SERVER_URL,
  SERVER_URL_KEY,
  DEMO_MODE_KEY
} 