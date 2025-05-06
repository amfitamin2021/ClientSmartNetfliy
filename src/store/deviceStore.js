import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDeviceStore = defineStore('devices', {
  state: () => ({
    devices: [],
    loading: false,
    error: null,
  }),
  
  getters: {
    getDeviceById: (state) => (id) => {
      return state.devices.find(device => device.id === id)
    },
    
    getDevicesByRoom: (state) => (roomId) => {
      if (roomId === 'all') return state.devices
      return state.devices.filter(device => device.roomId === roomId)
    },
    
    getDevicesByType: (state) => (type) => {
      return state.devices.filter(device => device.type === type)
    },
    
    getFilteredDevices: (state) => (roomId, searchQuery) => {
      return state.devices.filter(device => {
        // Фильтрация по комнате
        const roomMatch = roomId === 'all' || device.roomId === roomId
        
        // Фильтрация по поисковому запросу
        const query = searchQuery.toLowerCase()
        const searchMatch = !query || 
          device.name.toLowerCase().includes(query) ||
          device.type.toLowerCase().includes(query) ||
          device.room.toLowerCase().includes(query)
        
        return roomMatch && searchMatch
      })
    }
  },
  
  actions: {
    async fetchDevices() {
      try {
        this.loading = true
        this.error = null
        
        const response = await api.devices.getDevices()
        this.devices = response.map(device => this.mapDeviceFromBackend(device))
        
        return this.devices
      } catch (error) {
        console.error('Ошибка при получении устройств:', error)
        this.error = 'Не удалось загрузить устройства. Пожалуйста, попробуйте позже.'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // Маппинг данных устройства с бэкенда в формат фронтенда
    mapDeviceFromBackend(backendDevice) {
      const properties = backendDevice.properties || {}
      
      // Преобразуем значения из строк в нужные типы данных
      // Для определения активности используем умную логику в зависимости от типа устройства
      let active;
      if (backendDevice.category === 'APPLIANCES' && backendDevice.subType === 'TV') {
        // Для ТВ требуются оба свойства для активности
        active = properties.attr_server_active === 'true' && properties.tb_power === 'on';
      } else {
        // Для других устройств проверяем оба свойства, но достаточно любого из них
        const serverActive = properties.attr_server_active === 'true';
        const powerOn = properties.tb_power === 'on';
        
        if (properties.attr_server_active !== undefined && properties.tb_power !== undefined) {
          // Если есть оба свойства, используем активное если хотя бы одно из них активно
          active = serverActive || powerOn;
        } else if (properties.attr_server_active !== undefined) {
          active = serverActive;
        } else if (properties.tb_power !== undefined) {
          active = powerOn;
        } else {
          active = false; // По умолчанию устройство не активно
        }
      }
      
      const brightness = parseInt(properties.brightness || properties.tb_brightness || '0')
      const color = properties.color ? `#${properties.color}` : (properties.tb_color ? `#${properties.tb_color}` : '#FFFFFF')
      const online = backendDevice.status !== 'OFFLINE'
      const isVirtual = backendDevice.protocol === 'VIRTUAL'
      
      return {
        id: backendDevice.id,
        name: backendDevice.name,
        type: backendDevice.type.toLowerCase(),
        category: backendDevice.category || null,
        subType: backendDevice.subType || null,
        room: backendDevice.roomName || 'Неназначено',
        roomId: backendDevice.roomId,
        active: active,
        brightness: brightness,
        color: color,
        online: online,
        isVirtual: isVirtual,  // Добавляем флаг виртуального устройства
        canControl: online || isVirtual, // Можно управлять устройством, если оно онлайн или виртуальное
        hasColor: backendDevice.type === 'LIGHT' || 
                 (backendDevice.category === 'LIGHTING' && 
                  (backendDevice.subType === 'SMART_BULB' || backendDevice.subType === 'LED_STRIP')),
        protocol: backendDevice.protocol,
        // Сохраняем оригинальные свойства для отправки на сервер
        rawProperties: properties,
        manufacturer: backendDevice.manufacturer,
        model: backendDevice.model,
        // Добавляем информацию о связи с ThingsBoard
        thingsboardId: backendDevice.thingsboardId || null,
        thingsboardToken: backendDevice.thingsboardToken || null
      }
    },
    
    // Преобразует данные для отправки на бэкенд
    mapDeviceToBackend(frontendData) {
      // Преобразуем состояние для бэкенда
      const backendData = {}
      
      if (frontendData.active !== undefined) {
        // Используем attr_server_active для всех устройств
        backendData.attr_server_active = frontendData.active.toString()
        
        // Для обратной совместимости добавляем tb_power
        backendData.tb_power = frontendData.active ? 'on' : 'off'
      }
      
      if (frontendData.brightness !== undefined) {
        // Для яркости добавляем оба варианта параметра
        backendData.brightness = frontendData.brightness.toString()
        backendData.tb_brightness = frontendData.brightness.toString()
      }
      
      if (frontendData.color !== undefined) {
        // Убираем # из цвета для бэкенда и добавляем оба варианта параметра
        const colorValue = frontendData.color.replace('#', '')
        backendData.color = colorValue
        backendData.tb_color = colorValue
      }
      
      console.log('Данные для отправки на бэкенд:', backendData)
      return backendData
    },
    
    async addDevice(deviceData) {
      try {
        // Не показываем индикатор загрузки, чтобы избежать эффекта зависания
        this.error = null
        
        // Отправляем данные на сервер
        const newDevice = await api.devices.createDevice(deviceData)
        console.log('Устройство успешно создано на сервере:', newDevice)
        
        // Проверяем, нет ли уже такого устройства в списке
        const existingDeviceIndex = this.devices.findIndex(device => device.id === newDevice.id)
        
        if (existingDeviceIndex !== -1) {
          // Если устройство уже есть, обновляем его данные
          console.log('Устройство уже существует, обновляем данные:', newDevice.id)
          this.devices[existingDeviceIndex] = this.mapDeviceFromBackend(newDevice)
        } else {
          // Иначе добавляем новое устройство
          console.log('Добавляем новое устройство в список:', newDevice.id)
          this.devices.push(this.mapDeviceFromBackend(newDevice))
        }
        
        return newDevice
      } catch (error) {
        console.error('Ошибка при добавлении устройства:', error)
        this.error = 'Не удалось добавить устройство. Пожалуйста, попробуйте позже.'
        throw error
      }
    },
    
    async updateDevice(id, deviceData) {
      try {
        // Не показываем индикатор загрузки при обновлении
        this.error = null
        
        console.log('Обновление устройства:', id, deviceData)
        
        // Если deviceData содержит весь объект устройства, используем его напрямую
        if (deviceData.id && deviceData.name && deviceData.type) {
          const index = this.devices.findIndex(device => device.id === id)
          if (index !== -1) {
            this.devices[index] = this.mapDeviceFromBackend(deviceData)
            console.log('Устройство полностью обновлено:', this.devices[index])
            return this.devices[index]
          }
        }
        
        // Для частичного обновления попробуем использовать API
        try {
          // Отправляем данные на сервер
          const updatedDevice = await api.devices.updateState(id, deviceData)
          
          const index = this.devices.findIndex(device => device.id === id)
          if (index !== -1) {
            // Объединяем существующие данные с полученными из ответа
            this.devices[index] = { 
              ...this.devices[index], 
              ...this.mapDeviceFromBackend(updatedDevice)
            }
            console.log('Устройство частично обновлено через API:', this.devices[index])
            return this.devices[index]
          }
        } catch (error) {
          console.error('Ошибка при обновлении через API:', error)
          
          // В случае ошибки API, обновим локальные данные на основе переданных параметров
          const index = this.devices.findIndex(device => device.id === id)
          if (index !== -1) {
            // Только обновляем конкретные поля, которые были в deviceData
            if (deviceData.active !== undefined) {
              this.devices[index].active = deviceData.active === true || deviceData.active === 'true'
            }
            
            if (deviceData.brightness !== undefined) {
              this.devices[index].brightness = parseInt(deviceData.brightness)
            }
            
            if (deviceData.color !== undefined) {
              this.devices[index].color = deviceData.color.startsWith('#') 
                ? deviceData.color 
                : `#${deviceData.color}`
            }
            
            console.log('Устройство обновлено локально:', this.devices[index])
            return this.devices[index]
          }
        }
        
        throw new Error('Устройство не найдено')
      } catch (error) {
        console.error('Ошибка при обновлении устройства:', error)
        this.error = 'Не удалось обновить устройство. Пожалуйста, попробуйте позже.'
        throw error
      }
    },
    
    async deleteDevice(id) {
      try {
        // Не показываем индикатор загрузки при удалении
        this.error = null
        
        // Отправляем запрос на сервер
        await api.devices.deleteDevice(id)
        
        const index = this.devices.findIndex(device => device.id === id)
        if (index !== -1) {
          this.devices.splice(index, 1)
          return true
        }
        
        return false
      } catch (error) {
        console.error('Ошибка при удалении устройства:', error)
        this.error = 'Не удалось удалить устройство. Пожалуйста, попробуйте позже.'
        throw error
      }
    },
    
    async sendCommand(deviceId, command, params = {}) {
      try {
        console.log(`Отправка команды ${command} для устройства ${deviceId}:`, params);
        
        // Отправляем команду на сервер
        const result = await api.devices.sendCommand(deviceId, {
          command: command,
          parameters: params
        });
        
        // Обновляем локальное состояние устройства, если команда выполнена успешно
        const device = this.getDeviceById(deviceId);
        if (device) {
          // Для команды setState обновляем параметры устройства
          if (command === 'setState' && params) {
            if (!device.rawProperties) {
              device.rawProperties = {};
            }
            
            // Обновляем каждый измененный параметр
            Object.keys(params).forEach(key => {
              device.rawProperties[key] = params[key];
            });
            
            // Если это было изменение состояния замка, добавляем запись в историю
            if (params.tb_locked !== undefined && 
                (device.type === 'lock' || 
                (device.category === 'SECURITY' && device.subType === 'SMART_LOCK'))) {
              this.addLockHistoryEntry(deviceId, params.tb_locked === 'true');
            }
          }
        }
        
        return result;
      } catch (error) {
        console.error('Ошибка при отправке команды устройству:', error);
        throw error;
      }
    },
    
    // Метод для добавления записи в историю замка
    async addLockHistoryEntry(deviceId, isLocked) {
      try {
        const device = this.getDeviceById(deviceId);
        if (!device) return;
        
        const historyEntry = {
          deviceId: deviceId,
          deviceName: device.name,
          action: isLocked ? 'Заблокировано' : 'Разблокировано',
          user: 'Текущий пользователь', // В реальном приложении - имя текущего пользователя
          method: 'Приложение'
        };
        
        // Отправляем запись в историю на сервер
        await api.devices.addLockHistoryEntry(deviceId, historyEntry);
        console.log('Запись о состоянии замка добавлена в историю:', historyEntry);
      } catch (error) {
        console.error('Ошибка при добавлении записи в историю замка:', error);
      }
    },
    
    // Метод для переключения состояния замка
    async toggleLock(deviceId) {
      const device = this.getDeviceById(deviceId);
      if (!device) {
        throw new Error('Устройство не найдено');
      }
      
      // Проверяем, является ли устройство замком
      if (!(device.type === 'lock' || 
          (device.category === 'SECURITY' && device.subType === 'SMART_LOCK'))) {
        throw new Error('Устройство не является замком');
      }
      
      // Получаем текущее состояние
      const currentState = device.rawProperties?.tb_locked === 'true';
      const newState = !currentState;
      
      // Отправляем команду
      return this.sendCommand(deviceId, 'setState', { 
        tb_locked: newState.toString() 
      });
    },
    
    // Методы для работы с умной лампой
    
    // Включить/выключить устройство
    async toggleDevice(id, active) {
      try {
        const device = this.getDeviceById(id)
        if (!device) throw new Error('Устройство не найдено')
        
        if (!device.canControl) {
          throw new Error('Устройство не может быть контролируемо (OFFLINE)')
        }
        
        // Формируем данные для бэкенда
        const backendData = { 
          tb_power: active ? 'on' : 'off',
          attr_server_active: active.toString()
        }
        
        // Для датчика влажности устанавливаем дополнительные параметры
        if (device.category === 'CLIMATE' && device.subType === 'HUMIDITY_SENSOR') {
          // Обновляем время последнего обновления
          backendData.tb_last_updated = new Date().toISOString()
        }
        
        // Отправляем команду на сервер
        await this.sendCommand(id, 'setState', backendData)
        
        // Обновляем устройство локально
        device.active = active
        
        return true
      } catch (error) {
        console.error('Ошибка при переключении устройства:', error)
        throw error
      }
    },
    
    // Изменить яркость лампы
    async setBrightness(id, brightness) {
      try {
        const device = this.getDeviceById(id)
        if (!device) throw new Error('Устройство не найдено')
        
        if (!device.canControl) {
          throw new Error('Устройство не может быть контролируемо (OFFLINE)')
        }
        
        // Формируем данные для бэкенда
        const backendData = { 
          tb_brightness: brightness.toString(),
          brightness: brightness.toString() // Добавляем стандартный ключ brightness
        }
        
        // Отправляем команду на сервер
        await this.sendCommand(id, 'setState', backendData)
        
        // Обновляем устройство локально
        device.brightness = brightness
        
        return true
      } catch (error) {
        console.error('Ошибка при изменении яркости:', error)
        throw error
      }
    },
    
    // Изменить цвет лампы
    async setLightColor(id, color) {
      try {
        const device = this.getDeviceById(id)
        if (!device) throw new Error('Устройство не найдено')
        
        if (!device.canControl) {
          throw new Error('Устройство не может быть контролируемо (OFFLINE)')
        }
        
        // Удаляем решетку из цвета если она есть
        if (color.startsWith('#')) {
          color = color.substring(1)
        }
        
        // Формируем данные для бэкенда
        const backendData = { 
          tb_color: color,
          color: color // Добавляем стандартный ключ color
        }
        
        // Отправляем команду на сервер
        await this.sendCommand(id, 'setState', backendData)
        
        // Обновляем устройство локально
        device.color = `#${color}`
        
        return true
      } catch (error) {
        console.error('Ошибка при изменении цвета:', error)
        throw error
      }
    },
    
    // Обновить цвет и яркость лампы одновременно
    async updateLightProperties(id, { color, brightness }) {
      try {
        const device = this.getDeviceById(id)
        if (!device) throw new Error('Устройство не найдено')
        
        if (!device.canControl) {
          throw new Error('Устройство не может быть контролируемо (OFFLINE)')
        }
        
        // Подготавливаем данные
        const backendData = {
          // Устанавливаем устройство в активное состояние
          attr_server_active: 'true',
          tb_power: 'on'
        }
        
        // Удаляем решетку из цвета если она есть
        if (color) {
          if (color.startsWith('#')) {
            color = color.substring(1)
          }
          backendData.tb_color = color
          backendData.color = color // Добавляем стандартный ключ color
        }
        
        // Добавляем яркость
        if (brightness !== undefined) {
          backendData.tb_brightness = brightness.toString()
          backendData.brightness = brightness.toString() // Добавляем стандартный ключ brightness
        }
        
        // Отправляем команду на сервер
        await this.sendCommand(id, 'setState', backendData)
        
        // Обновляем устройство локально
        if (color) {
          device.color = `#${color}`
        }
        
        if (brightness !== undefined) {
          device.brightness = brightness
        }
        
        // Убедимся, что устройство отмечено как активное
        device.active = true
        
        return true
      } catch (error) {
        console.error('Ошибка при обновлении свойств лампы:', error)
        throw error
      }
    },
    
    // Получение доступных устройств из ThingsBoard
    async getAvailableDevices() {
      try {
        return await api.devices.getAvailableDevices()
      } catch (error) {
        console.error('Ошибка при получении доступных устройств:', error)
        throw error
      }
    },
    
    // Обновление данных датчика влажности
    async updateHumiditySensorData(id, { humidity, battery }) {
      try {
        const device = this.getDeviceById(id)
        if (!device) throw new Error('Устройство не найдено')
        
        if (device.category !== 'CLIMATE' || device.subType !== 'HUMIDITY_SENSOR') {
          throw new Error('Устройство не является датчиком влажности')
        }
        
        // Формируем данные для бэкенда
        const backendData = {
          // Добавляем значение влажности для телеметрии ThingsBoard (без префикса 'tb_')
          humidity: humidity.toString(),
          battery: battery.toString(),
          // Также обновляем свойства устройства
          tb_humidity: humidity.toString(),
          tb_battery: battery.toString(),
          tb_last_updated: new Date().toISOString()
        }
        
        // Отправляем команду на сервер
        await this.sendCommand(id, 'updateTelemetry', backendData)
        
        // Обновляем устройство локально
        if (device.rawProperties) {
          device.rawProperties.tb_humidity = humidity.toString()
          device.rawProperties.tb_battery = battery.toString()
          device.rawProperties.tb_last_updated = backendData.tb_last_updated
        }
        
        return true
      } catch (error) {
        console.error('Ошибка при обновлении данных датчика влажности:', error)
        throw error
      }
    },

    async getHumidityHistory(deviceId, interval = 'day') {
      try {
        const device = this.getDeviceById(deviceId)
        if (!device) throw new Error('Устройство не найдено')
        
        if (device.category !== 'CLIMATE' || device.subType !== 'HUMIDITY_SENSOR') {
          throw new Error('Устройство не является датчиком влажности')
        }

        const response = await api.devices.getHumidityHistory(deviceId, interval)
        return response.map(item => ({
          time: new Date(item.ts).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          value: parseFloat(item.value)
        }))
      } catch (error) {
        console.error('Ошибка при получении истории влажности:', error)
        throw error
      }
    },

    async getTemperatureHistory(deviceId, interval = 'day') {
      try {
        const device = this.getDeviceById(deviceId)
        if (!device) throw new Error('Устройство не найдено')
        
        if (device.category !== 'CLIMATE' || 
            (device.subType !== 'TEMPERATURE_SENSOR' && device.subType !== 'HUMIDITY_SENSOR')) {
          throw new Error('Устройство не является датчиком температуры')
        }

        const response = await api.devices.getTemperatureHistory(deviceId, interval)
        return response.map(item => ({
          time: new Date(item.ts).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          value: parseFloat(item.value)
        }))
      } catch (error) {
        console.error('Ошибка при получении истории температуры:', error)
        throw error
      }
    },

    // Методы для работы со смарт-замками
    
    // Метод для переключения состояния замка
    async toggleLock(deviceId) {
      const device = this.getDeviceById(deviceId);
      if (!device) {
        throw new Error('Устройство не найдено');
      }
      
      // Проверяем, является ли устройство замком
      if (!(device.type === 'lock' || 
          (device.category === 'SECURITY' && device.subType === 'SMART_LOCK'))) {
        throw new Error('Устройство не является замком');
      }
      
      // Получаем текущее состояние
      const currentState = device.rawProperties?.tb_locked === 'true';
      const newState = !currentState;
      
      // Отправляем команду
      return this.sendCommand(deviceId, 'setState', { 
        tb_locked: newState.toString() 
      });
    },
    
    // Метод для работы с датчиками безопасности
    
    // Обновление состояния датчика движения
    async updateMotionSensor(deviceId, isMotionDetected, options = {}) {
      try {
        // Валидация параметров
        if (!deviceId) {
          throw new Error('Не указан ID датчика движения')
        }
        
        const device = this.devices.find(d => d.id === deviceId)
        if (!device) {
          throw new Error(`Датчик с ID ${deviceId} не найден`)
        }
        
        // Проверяем, является ли устройство датчиком движения
        if (device.type !== 'sensor' || (device.subType !== 'MOTION_SENSOR' && 
            device.rawProperties?.tb_sensorType !== 'motion')) {
          throw new Error('Устройство не является датчиком движения')
        }
        
        // Преобразуем булево значение в строку для сохранения
        const motionValue = isMotionDetected ? 'true' : 'false'
        const batteryLevel = options.battery || (device.rawProperties?.tb_battery || '70')
        const priority = isMotionDetected ? 'medium' : 'low'
        
        // Обновляем локальное состояние
        if (!device.rawProperties) {
          device.rawProperties = {}
        }
        
        device.rawProperties.tb_motion = motionValue
        device.rawProperties.tb_battery = batteryLevel
        
        // Вместо сеттера (для реактивности)
        const index = this.devices.findIndex(d => d.id === deviceId)
        if (index !== -1) {
          this.devices[index] = { ...device }
        }
        
        // Отправляем команду на сервер для обновления состояния
        const commandResult = await this.sendCommand(deviceId, 'updateAttributes', {
          tb_motion: motionValue,
          tb_battery: batteryLevel
        })
        
        console.log('Результат отправки команды:', commandResult)
        
        // Только если обнаружено движение, добавляем запись в историю
        if (isMotionDetected) {
          await this.addSensorHistoryEntry(deviceId, 'motion', {
            detected: isMotionDetected,
            battery: batteryLevel,
            priority
          })
        }
        
        return { success: true, isMotionDetected }
      } catch (error) {
        console.error('Ошибка при обновлении датчика движения:', error)
        return { success: false, error: error.message }
      }
    },
    
    // Обновление состояния датчика открытия
    async updateContactSensor(deviceId, isOpen, options = {}) {
      try {
        // Валидация параметров
        if (!deviceId) {
          throw new Error('Не указан ID датчика открытия')
        }
        
        const device = this.devices.find(d => d.id === deviceId)
        if (!device) {
          throw new Error(`Датчик с ID ${deviceId} не найден`)
        }
        
        // Проверяем, является ли устройство датчиком открытия
        if (device.type !== 'sensor' || (device.subType !== 'CONTACT_SENSOR' && 
            device.rawProperties?.tb_sensorType !== 'contact')) {
          throw new Error('Устройство не является датчиком открытия')
        }
        
        // Преобразуем булево значение в строку для сохранения
        const contactValue = isOpen ? 'open' : 'closed'
        const batteryLevel = options.battery || (device.rawProperties?.tb_battery || '70')
        const priority = isOpen ? 'high' : 'low'
        
        // Обновляем локальное состояние
        if (!device.rawProperties) {
          device.rawProperties = {}
        }
        
        device.rawProperties.tb_contact = contactValue
        device.rawProperties.tb_battery = batteryLevel
        
        // Вместо сеттера (для реактивности)
        const index = this.devices.findIndex(d => d.id === deviceId)
        if (index !== -1) {
          this.devices[index] = { ...device }
        }
        
        // Отправляем команду на сервер для обновления состояния
        const commandResult = await this.sendCommand(deviceId, 'updateAttributes', {
          tb_contact: contactValue,
          tb_battery: batteryLevel
        })
        
        console.log('Результат отправки команды:', commandResult)
        
        // Только если контакт открыт, добавляем запись в историю
        if (isOpen) {
          await this.addSensorHistoryEntry(deviceId, 'contact', {
            isOpen,
            battery: batteryLevel,
            priority
          })
        }
        
        return { success: true, isOpen }
      } catch (error) {
        console.error('Ошибка при обновлении датчика открытия:', error)
        return { success: false, error: error.message }
      }
    },
    
    // Обновление состояния датчика дыма
    async updateSmokeSensor(deviceId, isSmokeDetected, options = {}) {
      try {
        // Валидация параметров
        if (!deviceId) {
          throw new Error('Не указан ID датчика дыма')
        }
        
        const device = this.devices.find(d => d.id === deviceId)
        if (!device) {
          throw new Error(`Датчик с ID ${deviceId} не найден`)
        }
        
        // Проверяем, является ли устройство датчиком дыма
        if (device.type !== 'sensor' || (device.subType !== 'SMOKE_SENSOR' && 
            device.rawProperties?.tb_sensorType !== 'smoke')) {
          throw new Error('Устройство не является датчиком дыма')
        }
        
        // Преобразуем булево значение в строку для сохранения
        const smokeValue = isSmokeDetected ? 'true' : 'false'
        const batteryLevel = options.battery || (device.rawProperties?.tb_battery || '70')
        const priority = isSmokeDetected ? 'critical' : 'low'
        
        // Обновляем локальное состояние
        if (!device.rawProperties) {
          device.rawProperties = {}
        }
        
        device.rawProperties.tb_smoke = smokeValue
        device.rawProperties.tb_battery = batteryLevel
        
        // Вместо сеттера (для реактивности)
        const index = this.devices.findIndex(d => d.id === deviceId)
        if (index !== -1) {
          this.devices[index] = { ...device }
        }
        
        // Отправляем команду на сервер для обновления состояния
        const commandResult = await this.sendCommand(deviceId, 'updateAttributes', {
          tb_smoke: smokeValue,
          tb_battery: batteryLevel
        })
        
        console.log('Результат отправки команды:', commandResult)
        
        // Только если обнаружен дым, добавляем запись в историю
        if (isSmokeDetected) {
          await this.addSensorHistoryEntry(deviceId, 'smoke', {
            detected: isSmokeDetected,
            battery: batteryLevel,
            priority
          })
        }
        
        return { success: true, isSmokeDetected }
      } catch (error) {
        console.error('Ошибка при обновлении датчика дыма:', error)
        return { success: false, error: error.message }
      }
    },
    
    // Обновление состояния датчика протечки
    async updateLeakSensor(deviceId, isLeakDetected, options = {}) {
      try {
        // Валидация параметров
        if (!deviceId) {
          throw new Error('Не указан ID датчика протечки')
        }
        
        const device = this.devices.find(d => d.id === deviceId)
        if (!device) {
          throw new Error(`Датчик с ID ${deviceId} не найден`)
        }
        
        // Проверяем, является ли устройство датчиком протечки
        if (device.type !== 'sensor' || (device.subType !== 'LEAK_SENSOR' && 
            device.rawProperties?.tb_sensorType !== 'leak')) {
          throw new Error('Устройство не является датчиком протечки')
        }
        
        // Преобразуем булево значение в строку для сохранения
        const leakValue = isLeakDetected ? 'true' : 'false'
        const batteryLevel = options.battery || (device.rawProperties?.tb_battery || '70')
        const priority = isLeakDetected ? 'critical' : 'low'
        
        // Обновляем локальное состояние
        if (!device.rawProperties) {
          device.rawProperties = {}
        }
        
        device.rawProperties.tb_leak = leakValue
        device.rawProperties.tb_battery = batteryLevel
        
        // Вместо сеттера (для реактивности)
        const index = this.devices.findIndex(d => d.id === deviceId)
        if (index !== -1) {
          this.devices[index] = { ...device }
        }
        
        // Отправляем команду на сервер для обновления состояния
        const commandResult = await this.sendCommand(deviceId, 'updateAttributes', {
          tb_leak: leakValue,
          tb_battery: batteryLevel
        })
        
        console.log('Результат отправки команды:', commandResult)
        
        // Только если обнаружена протечка, добавляем запись в историю
        if (isLeakDetected) {
          await this.addSensorHistoryEntry(deviceId, 'leak', {
            detected: isLeakDetected,
            battery: batteryLevel,
            priority
          })
        }
        
        return { success: true, isLeakDetected }
      } catch (error) {
        console.error('Ошибка при обновлении датчика протечки:', error)
        return { success: false, error: error.message }
      }
    },
    
    // Метод для добавления записи в историю датчиков
    async addSensorHistoryEntry(deviceId, sensorType, data = {}) {
      try {
        // Проверка на наличие deviceId и тип датчика
        if (!deviceId) {
          console.error('Не указан ID устройства при добавлении истории датчика')
          return { success: false }
        }
        
        // Находим устройство для получения информации о нем
        const device = this.devices.find(d => d.id === deviceId)
        if (!device) {
          console.warn(`Устройство с ID ${deviceId} не найдено при добавлении истории`)
        }
        
        // Получаем сообщение в зависимости от типа датчика
        const message = this.getSensorMessage(sensorType, data)
        
        // Получаем приоритет срабатывания
        let priority = data.priority || 'normal'
        // Если это важное срабатывание (например, дым или протечка), повышаем приоритет
        if (sensorType === 'smoke' && data.detected) {
          priority = 'critical'
        } else if (sensorType === 'leak' && data.detected) {
          priority = 'high'
        } else if (sensorType === 'contact' && data.isOpen) {
          priority = 'medium'
        }
        
        // Формируем запись для истории
        const historyEntry = {
          deviceId: deviceId,
          deviceName: device ? device.name : 'Неизвестное устройство',
          room: device ? device.room : '',
          sensorType: sensorType,
          value: data.detected ? 'true' : 
                 data.isOpen ? 'open' : 
                 data.value || 'false',
          message: message,
          priority: priority,
          acknowledged: false
        }
        
        // Отправляем на сервер
        try {
          const response = await api.devices.addSensorHistoryEntry(deviceId, historyEntry)
          console.log('Запись в историю датчиков добавлена:', response)
          return { success: true, entry: response }
        } catch (err) {
          console.error('Ошибка при отправке истории на сервер:', err)
          
          // В режиме разработки сохраняем запись локально
          if (process.env.NODE_ENV === 'development') {
            // Получаем текущую историю из localStorage
            const historyKey = 'sensor_history'
            let sensorHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
            
            // Добавляем ID для локальной версии
            const entry = {
              ...historyEntry,
              id: Date.now().toString(),
              timestamp: new Date().toISOString()
            }
            
            // Добавляем запись в начало массива
            sensorHistory.unshift(entry)
            
            // Ограничиваем историю до 100 записей
            if (sensorHistory.length > 100) {
              sensorHistory = sensorHistory.slice(0, 100)
            }
            
            // Сохраняем обновленную историю
            localStorage.setItem(historyKey, JSON.stringify(sensorHistory))
            
            return { success: true, entry, isLocalOnly: true }
          }
          
          return { success: false, error: err.message }
        }
      } catch (err) {
        console.error('Ошибка при добавлении истории датчика:', err)
        return { success: false, error: err.message }
      }
    },
    
    // Получение текста сообщения в зависимости от типа датчика
    getSensorMessage(sensorType, data) {
      switch(sensorType) {
        case 'motion':
          return data.detected ? 'Обнаружено движение' : 'Движение прекратилось'
        case 'contact':
          return data.isOpen ? 'Дверь/окно открыто' : 'Дверь/окно закрыто'
        case 'smoke':
          return data.detected ? 'Обнаружен дым!' : 'Дым не обнаружен'
        case 'leak':
          return data.detected ? 'Обнаружена протечка воды!' : 'Протечка не обнаружена'
        default:
          return 'Изменение состояния датчика'
      }
    },
    
    async getSensorHistory(deviceId = null, options = {}) {
      try {
        // Запрос истории датчиков с сервера
        let sensorHistory
        
        if (deviceId) {
          // Получаем историю для конкретного датчика
          sensorHistory = await api.devices.getSensorHistory(deviceId)
        } else {
          // Получаем общую историю всех датчиков
          sensorHistory = await api.devices.getAllSensorHistory()
        }
        
        // Применяем дополнительные фильтры из options
        if (options.sensorType) {
          sensorHistory = sensorHistory.filter(entry => entry.sensorType === options.sensorType)
        }
        
        if (options.startDate) {
          const startDate = new Date(options.startDate)
          sensorHistory = sensorHistory.filter(entry => new Date(entry.timestamp) >= startDate)
        }
        
        if (options.endDate) {
          const endDate = new Date(options.endDate)
          sensorHistory = sensorHistory.filter(entry => new Date(entry.timestamp) <= endDate)
        }
        
        if (options.acknowledged !== undefined) {
          sensorHistory = sensorHistory.filter(entry => entry.acknowledged === options.acknowledged)
        }
        
        // Возвращаем только реальные данные из API
        return sensorHistory
      } catch (err) {
        console.error('Ошибка при получении истории датчиков:', err)
        // В случае ошибки возвращаем пустой массив
        return []
      }
    },
    
    // Обновление записи в истории датчиков (например, пометка "прочитано")
    async updateSensorHistoryEntry(entryId, updateData) {
      try {
        // Отправляем запрос на сервер
        if (updateData.acknowledged !== undefined) {
          const result = await api.devices.acknowledgeSensorHistoryEntry(entryId)
          return { success: true, entry: result }
        } else {
          throw new Error('Неподдерживаемый тип обновления')
        }
      } catch (err) {
        console.error('Ошибка при обновлении истории датчика:', err)
        
        // В режиме разработки обновляем локально
        if (process.env.NODE_ENV === 'development') {
          const historyKey = 'sensor_history'
          let sensorHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
          
          // Находим запись для обновления
          const entryIndex = sensorHistory.findIndex(entry => entry.id === entryId)
          if (entryIndex === -1) {
            console.warn(`Запись с ID ${entryId} не найдена в истории датчиков`)
            return { success: false }
          }
          
          // Обновляем запись
          sensorHistory[entryIndex] = {
            ...sensorHistory[entryIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
          }
          
          // Сохраняем обновления
          localStorage.setItem(historyKey, JSON.stringify(sensorHistory))
          
          return { success: true, entry: sensorHistory[entryIndex], isLocalOnly: true }
        }
        
        return { success: false, error: err.message }
      }
    },
    
    // Пометка всех записей как прочитанные
    async acknowledgeAllSensorHistory(deviceId = null) {
      try {
        // Отправляем запрос на сервер
        if (deviceId) {
          const result = await api.devices.acknowledgeAllSensorHistoryForDevice(deviceId)
          return { success: true, count: result.acknowledgedCount }
        } else {
          const result = await api.devices.acknowledgeAllSensorHistory()
          return { success: true, count: result.acknowledgedCount }
        }
      } catch (err) {
        console.error('Ошибка при массовом обновлении истории датчиков:', err)
        
        // В режиме разработки обновляем локально
        if (process.env.NODE_ENV === 'development') {
          const historyKey = 'sensor_history'
          let sensorHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
          
          // Обновляем статус "прочитано" для всех записей
          let count = 0
          sensorHistory = sensorHistory.map(entry => {
            // Если указан deviceId, обновляем только для этого устройства
            if (deviceId && entry.deviceId !== deviceId) {
              return entry
            }
            
            if (!entry.acknowledged) {
              count++
              return { ...entry, acknowledged: true, updatedAt: new Date().toISOString() }
            }
            
            return entry
          })
          
          // Сохраняем обновления
          localStorage.setItem(historyKey, JSON.stringify(sensorHistory))
          
          return { success: true, count, isLocalOnly: true }
        }
        
        return { success: false, error: err.message }
      }
    },

    // Для симуляции данных изменяем метод, чтобы он был более реалистичным
    getDemoSensorHistory(deviceId = null) {
      // Генерируем случайные временные метки за последние 7 дней
      const generateRandomDate = () => {
        const now = new Date()
        const daysAgo = Math.floor(Math.random() * 7) // От 0 до 7 дней назад
        const hoursAgo = Math.floor(Math.random() * 24) // От 0 до 24 часов назад
        const minutesAgo = Math.floor(Math.random() * 60) // От 0 до 60 минут назад
        
        now.setDate(now.getDate() - daysAgo)
        now.setHours(now.getHours() - hoursAgo)
        now.setMinutes(now.getMinutes() - minutesAgo)
        
        return now
      }
      
      // Список демо-устройств для выбора, если deviceId не указан
      const demoDevices = [
        { id: 'motion-sensor-1', name: 'Датчик движения (Гостиная)', room: 'Гостиная', type: 'motion' },
        { id: 'motion-sensor-2', name: 'Датчик движения (Коридор)', room: 'Коридор', type: 'motion' },
        { id: 'contact-sensor-1', name: 'Датчик открытия (Входная дверь)', room: 'Прихожая', type: 'contact' },
        { id: 'contact-sensor-2', name: 'Датчик открытия (Окно - Спальня)', room: 'Спальня', type: 'contact' },
        { id: 'smoke-sensor-1', name: 'Датчик дыма (Кухня)', room: 'Кухня', type: 'smoke' },
        { id: 'leak-sensor-1', name: 'Датчик протечки (Ванная)', room: 'Ванная', type: 'leak' }
      ]
      
      // Функция для генерации сообщений по типу датчика
      const getMessageByType = (type, state) => {
        switch(type) {
          case 'motion':
            return state ? 'Обнаружено движение' : 'Движение прекратилось'
          case 'contact':
            return state ? 'Дверь/окно открыто' : 'Дверь/окно закрыто'
          case 'smoke':
            return state ? 'Обнаружен дым!' : 'Дым не обнаружен'
          case 'leak':
            return state ? 'Обнаружена протечка воды!' : 'Протечка не обнаружена'
          default:
            return 'Изменение состояния датчика'
        }
      }
      
      // Генерация приоритета по типу и состоянию
      const getPriorityByType = (type, state) => {
        if (!state) return 'low' // Если датчик вернулся в нормальное состояние
        
        switch(type) {
          case 'smoke': return 'critical'
          case 'leak': return 'high'
          case 'contact': return 'medium'
          case 'motion': return 'normal'
          default: return 'normal'
        }
      }
      
      // Генерируем историю
      const historyItems = []
      
      // Количество записей для генерации
      const entryCount = Math.floor(Math.random() * 10) + 5 // от 5 до 15
      
      for (let i = 0; i < entryCount; i++) {
        // Выбираем устройство
        let device
        
        if (deviceId) {
          // Если задан конкретный deviceId, используем его
          device = demoDevices.find(d => d.id === deviceId) || demoDevices[0]
        } else {
          // Иначе выбираем случайное устройство
          const randomDeviceIndex = Math.floor(Math.random() * demoDevices.length)
          device = demoDevices[randomDeviceIndex]
        }
        
        // Определяем состояние (активация/деактивация)
        const state = Math.random() > 0.5
        
        // Создаем запись
        const entry = {
          id: `demo-${Date.now()}-${i}`,
          deviceId: device.id,
          deviceName: device.name,
          room: device.room,
          type: device.type,
          timestamp: generateRandomDate(),
          acknowledged: Math.random() > 0.3, // 70% шанс, что событие уже прочитано
          priority: getPriorityByType(device.type, state),
          message: getMessageByType(device.type, state),
          data: {
            state,
            timestamp: new Date()
          }
        }
        
        historyItems.push(entry)
      }
      
      // Сортировка по времени (новые в начале)
      historyItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      return historyItems
    }
  }
}) 