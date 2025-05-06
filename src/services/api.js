import axios from 'axios'
import { getServerUrl, getDemoMode } from '../config/serverConfig'
import { getDemoData } from './demoData'

// Функция для создания API-клиента с текущим адресом сервера
const createApiClient = () => {
  const serverUrl = getServerUrl()
  
  return axios.create({
    baseURL: serverUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// Создаем экземпляр axios с базовыми настройками
let apiClient = createApiClient()

// Функция для обновления API-клиента с новым URL сервера
export const updateApiClient = () => {
  apiClient = createApiClient()
  // Переустанавливаем интерцепторы
  setupInterceptors()
}

// Функция для установки интерцепторов
const setupInterceptors = () => {
  // Очищаем существующие интерцепторы если они есть
  if (apiClient.interceptors) {
    apiClient.interceptors.request.handlers = []
    apiClient.interceptors.response.handlers = []
  }
  
  // Интерцептор для добавления токена авторизации
  apiClient.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  // Интерцептор для обработки ошибок (в том числе 401 Unauthorized)
  apiClient.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Удаляем токен и редиректим на страницу логина
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

// Устанавливаем интерцепторы при первом создании
setupInterceptors()

// Функция-обертка для запросов API, которая проверяет демо-режим
const apiRequest = (method, url, data = null, params = null) => {
  // Проверяем, активен ли демо-режим
  if (getDemoMode()) {
    return new Promise((resolve) => {
      // Имитируем задержку сети
      setTimeout(() => {
        // Получаем демо-данные для запроса
        const demoResponse = getDemoData(method, url, data, params)
        resolve(demoResponse)
      }, 300)
    })
  }
  
  // Если демо-режим не активен, выполняем реальный запрос
  const config = { method, url }
  
  if (data) {
    config.data = data
  }
  
  if (params) {
    config.params = params
  }
  
  return apiClient(config).then(response => response.data)
}

// API-методы для устройств
const devicesApi = {
  /**
   * Получить список всех устройств
   * @returns {Promise<Array>} - массив устройств
   */
  getDevices() {
    return apiRequest('get', '/devices')
  },

  /**
   * Получить устройство по ID
   * @param {string|number} id - идентификатор устройства
   * @returns {Promise<Object>} - данные устройства
   */
  getDevice(id) {
    return apiRequest('get', `/devices/${id}`)
  },

  /**
   * Создать новое устройство
   * @param {Object} deviceData - данные устройства
   * @returns {Promise<Object>} - созданное устройство
   */
  createDevice(deviceData) {
    // Проверка обязательных полей перед отправкой на сервер
    if (!deviceData.name) {
      return Promise.reject(new Error('Имя устройства не может быть пустым'));
    }
    
    if (!deviceData.type) {
      return Promise.reject(new Error('Тип устройства должен быть указан'));
    }
    
    // Сохраняем уникальный ID для проверки дубликатов
    if (!deviceData.properties) {
      deviceData.properties = {};
    }
    
    if (!deviceData.properties.device_unique_id) {
      deviceData.properties.device_unique_id = 'device_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Отправляем запрос на сервер
    return apiRequest('post', '/devices', deviceData)
      .catch(error => {
        // Специальная обработка ошибок при создании устройства
        if (error.response && error.response.status === 409) {
          throw new Error('Устройство с таким именем уже существует');
        }
        throw error;
      });
  },

  /**
   * Отправить команду устройству
   * @param {string|number} id - идентификатор устройства
   * @param {Object} commandData - данные команды
   * @returns {Promise<Object>} - результат выполнения команды
   */
  sendCommand(id, commandData) {
    return apiRequest('post', `/devices/${id}/command`, commandData)
  },

  /**
   * Проверить состояние устройства
   * @param {string|number} id - идентификатор устройства
   * @returns {Promise<Object>} - состояние устройства
   */
  checkDeviceStatus(id) {
    return apiRequest('get', `/devices/${id}/status`)
  },

  /**
   * Обновить устройство
   * @param {string|number} id - идентификатор устройства
   * @param {Object} deviceData - данные устройства
   * @returns {Promise<Object>} - обновленное устройство
   */
  updateDevice(id, deviceData) {
    return apiRequest('put', `/devices/${id}`, deviceData)
  },

  /**
   * Удалить устройство
   * @param {string|number} id - идентификатор устройства
   * @returns {Promise<void>}
   */
  deleteDevice(id) {
    return apiRequest('delete', `/devices/${id}`)
  },

  /**
   * Получить список доступных устройств из ThingsBoard
   * @returns {Promise<Array>} - массив доступных устройств
   */
  getAvailableDevices() {
    return apiRequest('get', '/devices/available-devices')
  },
  
  /**
   * Синхронизировать устройство с ThingsBoard
   * @param {string|number} id - идентификатор устройства
   * @returns {Promise<Object>} - результат синхронизации
   */
  syncThingsBoard(id) {
    return apiRequest('post', `/devices/${id}/sync-thingsboard`)
  },

  /**
   * Получить исторические данные влажности
   * @param {string} deviceId - ID устройства
   * @param {string} interval - Интервал (hour, day, week, month)
   * @returns {Promise<Array>} - массив данных
   */
  getHumidityHistory(deviceId, interval = 'day') {
    return apiRequest('get', `/devices/${deviceId}/humidity-history`, null, { interval })
  },

  /**
   * Получить исторические данные температуры
   * @param {string} deviceId - ID устройства
   * @param {string} interval - Интервал (hour, day, week, month)
   * @returns {Promise<Array>} - массив данных
   */
  getTemperatureHistory(deviceId, interval = 'day') {
    return apiRequest('get', `/devices/${deviceId}/temperature-history`, null, { interval })
  },

  /**
   * Получить историю замка
   * @param {string} deviceId - ID замка
   * @returns {Promise<Array>} - история замка
   */
  getLockHistory(deviceId) {
    return apiRequest('get', `/devices/${deviceId}/lock-history`)
  },

  /**
   * Получить общую историю всех замков
   * @returns {Promise<Array>} - история всех замков
   */
  getAllLockHistory() {
    return apiRequest('get', `/devices/lock-history`)
  },

  /**
   * Добавить запись в историю замка
   * @param {string} deviceId - ID замка
   * @param {Object} historyEntry - запись истории
   * @returns {Promise<Object>} - добавленная запись
   */
  addLockHistoryEntry(deviceId, historyEntry) {
    return apiRequest('post', `/devices/${deviceId}/lock-history`, historyEntry)
  },
  
  /**
   * Получить историю срабатываний датчика
   * @param {string} deviceId - ID датчика
   * @returns {Promise<Array>} - история датчика
   */
  getSensorHistory(deviceId) {
    return apiRequest('get', `/devices/${deviceId}/sensor-history`)
  },
  
  /**
   * Получить общую историю всех датчиков
   * @returns {Promise<Array>} - история всех датчиков
   */
  getAllSensorHistory() {
    return apiRequest('get', `/devices/sensor-history`)
  },
  
  /**
   * Добавить запись в историю датчика
   * @param {string} deviceId - ID датчика
   * @param {Object} historyEntry - запись истории
   * @returns {Promise<Object>} - добавленная запись
   */
  addSensorHistoryEntry(deviceId, historyEntry) {
    return apiRequest('post', `/devices/${deviceId}/sensor-history`, historyEntry)
  },
  
  /**
   * Подтвердить запись в истории датчика
   * @param {string} entryId - ID записи
   * @returns {Promise<Object>} - обновленная запись
   */
  acknowledgeSensorHistoryEntry(entryId) {
    return apiRequest('put', `/devices/sensor-history/${entryId}/acknowledge`)
  },
  
  /**
   * Подтвердить все записи в истории датчиков
   * @returns {Promise<Object>} - результат операции
   */
  acknowledgeAllSensorHistory() {
    return apiRequest('post', `/devices/sensor-history/acknowledge-all`)
  },
  
  /**
   * Подтвердить все записи в истории датчика
   * @param {string} deviceId - ID датчика
   * @returns {Promise<Object>} - результат операции
   */
  acknowledgeAllSensorHistoryForDevice(deviceId) {
    return apiRequest('post', `/devices/${deviceId}/sensor-history/acknowledge-all`)
  }
}

// API-методы для сценариев
const scenariosApi = {
  /**
   * Получить список всех сценариев
   * @returns {Promise<Array>} - массив сценариев
   */
  getScenarios() {
    return apiRequest('get', '/scenarios')
  },

  /**
   * Получить сценарий по ID
   * @param {string|number} id - идентификатор сценария
   * @returns {Promise<Object>} - данные сценария
   */
  getScenario(id) {
    return apiRequest('get', `/scenarios/${id}`)
  },

  /**
   * Создать новый сценарий
   * @param {Object} scenarioData - данные сценария
   * @returns {Promise<Object>} - созданный сценарий
   */
  createScenario(scenarioData) {
    return apiRequest('post', '/scenarios', scenarioData)
  },

  /**
   * Обновить сценарий
   * @param {string|number} id - идентификатор сценария
   * @param {Object} scenarioData - данные сценария
   * @returns {Promise<Object>} - обновленный сценарий
   */
  updateScenario(id, scenarioData) {
    return apiRequest('put', `/scenarios/${id}`, scenarioData)
  },

  /**
   * Удалить сценарий
   * @param {string|number} id - идентификатор сценария
   * @returns {Promise<void>}
   */
  deleteScenario(id) {
    return apiRequest('delete', `/scenarios/${id}`)
  },

  /**
   * Запустить сценарий
   * @param {string|number} id - идентификатор сценария
   * @returns {Promise<Object>} - результат выполнения
   */
  runScenario(id) {
    return apiRequest('post', `/scenarios/${id}/run`)
  }
}

// API-методы для уведомлений
const notificationsApi = {
  /**
   * Получить список уведомлений
   * @param {string} status - статус уведомлений (all, read, unread)
   * @returns {Promise<Array>} - массив уведомлений
   */
  getNotifications(status = 'all') {
    return apiRequest('get', `/notifications?status=${status}`)
  },

  /**
   * Пометить уведомление как прочитанное
   * @param {string|number} id - идентификатор уведомления
   * @returns {Promise<Object>} - обновленное уведомление
   */
  markAsRead(id) {
    return apiRequest('put', `/notifications/${id}/read`)
  },

  /**
   * Удалить уведомление
   * @param {string|number} id - идентификатор уведомления
   * @returns {Promise<void>}
   */
  deleteNotification(id) {
    return apiRequest('delete', `/notifications/${id}`)
  }
}

// API-методы для пользователя
const userApi = {
  /**
   * Получить информацию о текущем пользователе
   * @returns {Promise<Object>} - данные пользователя
   */
  getCurrentUser() {
    return apiRequest('get', '/users/me')
  },

  /**
   * Обновить данные пользователя
   * @param {Object} userData - данные пользователя
   * @returns {Promise<Object>} - обновленные данные пользователя
   */
  updateUser(userData) {
    return apiRequest('put', '/users/me', userData)
  },

  /**
   * Вход пользователя
   * @param {Object} credentials - учетные данные
   * @returns {Promise<Object>} - токен и данные пользователя
   */
  login(credentials) {
    return apiRequest('post', '/auth/login', credentials)
      .then(response => {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data))
        }
        return response.data
      })
  },

  /**
   * Выход пользователя
   * @returns {Promise<void>}
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  /**
   * Регистрация нового пользователя
   * @param {Object} userData - данные пользователя
   * @returns {Promise<Object>} - созданный пользователь
   */
  register(userData) {
    return apiRequest('post', '/auth/register', userData)
  }
}

// API-методы для статистики
const statsApi = {
  /**
   * Получить данные по потреблению энергии
   * @param {string} period - период (day, week, month)
   * @returns {Promise<Object>} - данные по потреблению
   */
  getEnergyConsumption(period = 'day') {
    return apiRequest('get', `/stats/energy/${period}`)
  },

  /**
   * Получить историю активности устройств
   * @param {Object} params - параметры запроса (deviceId, startDate, endDate)
   * @returns {Promise<Array>} - история активности
   */
  getDeviceHistory(params = {}) {
    return apiRequest('get', '/stats/device-history', null, params)
  },

  /**
   * Получить сводную статистику системы
   * @returns {Promise<Object>} - сводная статистика
   */
  getDashboardStats() {
    return apiRequest('get', '/stats/dashboard')
  },

  /**
   * Получить статистику потребления
   * @param {string} period - период (day, week, month, year)
   * @returns {Promise<Object>} - статистика
   */
  getConsumptionStats(period = 'day') {
    return apiRequest('get', `/statistics/consumption?period=${period}`)
  },

  /**
   * Получить статистику использования устройств
   * @returns {Promise<Object>} - статистика
   */
  getDeviceUsageStats() {
    return apiRequest('get', '/statistics/devices/usage')
  }
}

// API-методы для локаций (комнат)
const locationsApi = {
  /**
   * Получить список всех локаций
   * @returns {Promise<Array>} - список локаций
   */
  getLocations() {
    return apiRequest('get', '/locations')
  },

  /**
   * Получить локацию по ID
   * @param {string|number} id - идентификатор локации
   * @returns {Promise<Object>} - данные локации
   */
  getLocation(id) {
    return apiRequest('get', `/locations/${id}`)
  },

  /**
   * Создать новую локацию
   * @param {Object} locationData - данные локации
   * @returns {Promise<Object>} - созданная локация
   */
  createLocation(locationData) {
    return apiRequest('post', '/locations', locationData)
  },

  /**
   * Обновить локацию
   * @param {string|number} id - идентификатор локации
   * @param {Object} locationData - новые данные
   * @returns {Promise<Object>} - обновленная локация
   */
  updateLocation(id, locationData) {
    return apiRequest('put', `/locations/${id}`, locationData)
  },

  /**
   * Удалить локацию
   * @param {string|number} id - идентификатор локации
   * @returns {Promise<void>}
   */
  deleteLocation(id) {
    return apiRequest('delete', `/locations/${id}`)
  },
  
  /**
   * Получить комнаты для локации
   * @param {string|number} locationId - ID локации
   * @returns {Promise<Array>} - список комнат
   */
  getRooms(locationId) {
    return apiRequest('get', `/locations/${locationId}/rooms`)
  },
  
  /**
   * Создать комнату в локации
   * @param {string|number} locationId - ID локации
   * @param {Object} roomData - данные комнаты
   * @returns {Promise<Object>} - созданная комната
   */
  createRoom(locationId, roomData) {
    return apiRequest('post', `/locations/${locationId}/rooms`, roomData)
  },
  
  /**
   * Обновить комнату
   * @param {string|number} locationId - ID локации
   * @param {string|number} roomId - ID комнаты
   * @param {Object} roomData - новые данные
   * @returns {Promise<Object>} - обновленная комната
   */
  updateRoom(locationId, roomId, roomData) {
    return apiRequest('put', `/locations/${locationId}/rooms/${roomId}`, roomData)
  },
  
  /**
   * Удалить комнату
   * @param {string|number} locationId - ID локации
   * @param {string|number} roomId - ID комнаты
   * @returns {Promise<void>}
   */
  deleteRoom(locationId, roomId) {
    return apiRequest('delete', `/locations/${locationId}/rooms/${roomId}`)
  }
}

// Объединяем все API-методы в один объект
export default {
  devices: devicesApi,
  scenarios: scenariosApi,
  notifications: notificationsApi,
  user: userApi,
  stats: statsApi,
  locations: locationsApi
}

// Отдельные экспорты для прямого импорта
export { devicesApi, scenariosApi, notificationsApi, userApi, statsApi, locationsApi }