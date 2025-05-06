/**
 * Модуль с демо-данными для работы приложения без подключения к серверу
 * Используется, когда активирован демо-режим в настройках приложения
 */

import { v4 as uuidv4 } from 'uuid'

// Генерация случайных значений для демонстрации
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const getRandomBoolean = () => Math.random() > 0.5

// Демо-устройства для показа в интерфейсе
const demoDevices = [
  {
    id: 'device-001',
    name: 'Умная лампа - Гостиная',
    type: 'light',
    category: 'LIGHTING',
    subType: 'SMART_BULB',
    room: 'Гостиная',
    online: true,
    active: true,
    brightness: 80,
    color: '#FFFFFF',
    canControl: true,
    lastUpdated: new Date().toISOString(),
    properties: {
      attr_server_active: 'true',
      tb_color: 'FFFFFF',
      tb_brightness: '80',
      tb_power: 'on'
    }
  },
  {
    id: 'device-002',
    name: 'Датчик температуры - Спальня',
    type: 'thermostat',
    category: 'CLIMATE',
    subType: 'TEMPERATURE_SENSOR',
    room: 'Спальня',
    online: true,
    active: true,
    canControl: false,
    lastUpdated: new Date().toISOString(),
    rawProperties: {
      tb_temperature: '22.5',
      tb_battery: '87',
      tb_last_updated: new Date().toISOString()
    }
  },
  {
    id: 'device-003',
    name: 'Датчик влажности - Спальня',
    type: 'humidity',
    category: 'CLIMATE',
    subType: 'HUMIDITY_SENSOR',
    room: 'Спальня',
    online: true,
    active: true,
    canControl: false,
    lastUpdated: new Date().toISOString(),
    rawProperties: {
      tb_humidity: '52',
      tb_battery: '91',
      tb_last_updated: new Date().toISOString()
    }
  },
  {
    id: 'device-004',
    name: 'Умный замок - Входная дверь',
    type: 'lock',
    category: 'SECURITY',
    subType: 'SMART_LOCK',
    room: 'Прихожая',
    online: true,
    active: true,
    canControl: true,
    lastUpdated: new Date().toISOString(),
    rawProperties: {
      tb_locked: 'true',
      tb_battery: '78',
      tb_last_updated: new Date().toISOString()
    }
  },
  {
    id: 'device-005',
    name: 'Телевизор - Гостиная',
    type: 'tv',
    category: 'APPLIANCES',
    subType: 'TV',
    room: 'Гостиная',
    online: true,
    active: false,
    canControl: true,
    lastUpdated: new Date().toISOString(),
    rawProperties: {
      tb_power: 'off',
      tb_volume: '30',
      tb_channel: '1',
      tb_input_source: 'hdmi1',
      attr_server_active: 'false'
    }
  }
]

// Демо-история температуры
const generateTemperatureHistory = (deviceId, count = 24) => {
  const baseTemp = getRandomNumber(20, 25)
  const result = []
  
  for (let i = 0; i < count; i++) {
    const time = new Date()
    time.setHours(time.getHours() - (count - i))
    
    result.push({
      id: uuidv4(),
      deviceId,
      timestamp: time.toISOString(),
      value: (baseTemp + getRandomNumber(-20, 20) / 10).toFixed(1)
    })
  }
  
  return result
}

// Демо-история влажности
const generateHumidityHistory = (deviceId, count = 24) => {
  const baseHumidity = getRandomNumber(45, 60)
  const result = []
  
  for (let i = 0; i < count; i++) {
    const time = new Date()
    time.setHours(time.getHours() - (count - i))
    
    result.push({
      id: uuidv4(),
      deviceId,
      timestamp: time.toISOString(),
      value: (baseHumidity + getRandomNumber(-10, 10)).toString()
    })
  }
  
  return result
}

// Демо-история замка
const lockHistory = [
  {
    id: uuidv4(),
    deviceId: 'device-004',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(),
    action: 'unlock',
    user: 'Александр',
    method: 'app'
  },
  {
    id: uuidv4(),
    deviceId: 'device-004',
    timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
    action: 'lock',
    user: 'Александр',
    method: 'app'
  },
  {
    id: uuidv4(),
    deviceId: 'device-004',
    timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 30)).toISOString(),
    action: 'unlock',
    user: 'Анна',
    method: 'key'
  },
  {
    id: uuidv4(),
    deviceId: 'device-004',
    timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 25)).toISOString(),
    action: 'lock',
    user: 'Анна',
    method: 'key'
  }
]

// Функция для имитации обработки запросов
export const getDemoData = (method, url, data, params) => {
  // Парсим URL
  const urlParts = url.split('/')
  
  // Обработка запросов к устройствам
  if (url.startsWith('/devices')) {
    // Получение списка всех устройств
    if (url === '/devices') {
      return [...demoDevices]
    }
    
    // Получение конкретного устройства по ID
    if (urlParts.length === 3 && urlParts[1] === 'devices') {
      const deviceId = urlParts[2]
      const device = demoDevices.find(d => d.id === deviceId)
      return device ? { ...device } : null
    }
    
    // Получение температурной истории
    if (url.includes('temperature-history')) {
      const deviceId = urlParts[2]
      return generateTemperatureHistory(deviceId, params?.interval === 'hour' ? 12 : 24)
    }
    
    // Получение истории влажности
    if (url.includes('humidity-history')) {
      const deviceId = urlParts[2]
      return generateHumidityHistory(deviceId, params?.interval === 'hour' ? 12 : 24)
    }
    
    // Получение истории замка
    if (url.includes('lock-history')) {
      if (urlParts.length === 3) {
        // Общая история всех замков
        return [...lockHistory]
      } else {
        // История конкретного замка
        const deviceId = urlParts[2]
        return lockHistory.filter(entry => entry.deviceId === deviceId)
      }
    }
    
    // Отправка команды устройству
    if (url.includes('/command')) {
      const deviceId = urlParts[2]
      const device = demoDevices.find(d => d.id === deviceId)
      
      if (!device) return { success: false, message: 'Устройство не найдено' }
      
      // Обработка команды
      if (data?.command === 'setState') {
        // Обновляем свойства устройства
        if (data.parameters) {
          device.rawProperties = { ...device.rawProperties, ...data.parameters }
          
          // Обновляем также основные свойства
          if (data.parameters.tb_power) {
            device.active = data.parameters.tb_power === 'on'
          }
          
          if (data.parameters.tb_brightness) {
            device.brightness = parseInt(data.parameters.tb_brightness)
          }
          
          if (data.parameters.tb_color) {
            device.color = `#${data.parameters.tb_color}`
          }
        }
        
        return { success: true, device }
      }
      
      return { success: true, message: 'Команда выполнена' }
    }
  }
  
  // Запрос к API здоровья системы
  if (url.includes('/health')) {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }
  
  // Запрос пользовательских данных
  if (url.includes('/users/me')) {
    return {
      id: 'user-001',
      name: 'Тестовый Пользователь',
      email: 'demo@smarthouse.io',
      role: 'admin',
      lastLogin: new Date().toISOString()
    }
  }
  
  // Запрос данных для дашборда
  if (url.includes('/stats/dashboard')) {
    return {
      deviceCount: demoDevices.length,
      activeDeviceCount: demoDevices.filter(d => d.active).length,
      offlineDeviceCount: demoDevices.filter(d => !d.online).length,
      recentEvents: [
        { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(), type: 'device_status', message: 'Изменение статуса устройства "Умная лампа - Гостиная"' },
        { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 2)).toISOString(), type: 'security', message: 'Дверь "Входная дверь" была открыта' },
        { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(), type: 'climate', message: 'Температура в комнате "Спальня" упала ниже 21°C' }
      ]
    }
  }
  
  // Запрос уведомлений
  if (url.includes('/notifications')) {
    return [
      { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(), title: 'Внимание!', message: 'Обнаружена активность в зоне "Входная дверь"', type: 'security', isRead: false },
      { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(), title: 'Изменение температуры', message: 'Температура в спальне опустилась ниже комфортного уровня', type: 'climate', isRead: true },
      { id: uuidv4(), timestamp: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(), title: 'Оповещение', message: 'Устройство "Телевизор - Гостиная" было выключено', type: 'device', isRead: true }
    ]
  }
  
  // По умолчанию возвращаем пустой объект
  return { success: false, message: 'Запрос не может быть обработан в демо-режиме' }
} 