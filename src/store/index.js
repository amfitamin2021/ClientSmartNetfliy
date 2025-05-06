import { defineStore } from 'pinia'

// Общее хранилище для приложения
export const useAppStore = defineStore('app', {
  state: () => ({
    isDarkMode: false,
    sidebarOpen: true,
    loading: false,
    error: null
  }),
  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      document.body.classList.toggle('dark', this.isDarkMode)
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    setLoading(status) {
      this.loading = status
    },
    setError(error) {
      this.error = error
    },
    clearError() {
      this.error = null
    }
  },
  persist: {
    paths: ['isDarkMode']
  }
})

// Хранилище для устройств
export const useDevicesStore = defineStore('devices', {
  state: () => ({
    devices: [],
    loading: false,
    error: null
  }),
  getters: {
    getDeviceById: (state) => (id) => {
      return state.devices.find(device => device.id === id)
    },
    getDevicesByRoom: (state) => (room) => {
      return state.devices.filter(device => device.roomId === room)
    },
    getDevicesByType: (state) => (type) => {
      return state.devices.filter(device => device.type === type)
    },
    activeDevicesCount: (state) => {
      return state.devices.filter(device => device.active).length
    }
  },
  actions: {
    async fetchDevices() {
      this.loading = true
      try {
        // Использование API для получения устройств
        const api = await import('@/services/api').then(m => m.default)
        const devices = await api.devices.getDevices()
        this.devices = devices
        this.error = null
      } catch (error) {
        this.error = error.message || 'Не удалось загрузить устройства'
        // Если API недоступен - используем демо-данные
        this.devices = [
          { 
            id: 1, 
            name: 'Smart TV', 
            type: 'tv', 
            room: 'Гостиная',
            roomId: 'livingroom',
            active: true,
            status: 'Netflix • Сейчас играет'
          },
          { 
            id: 2, 
            name: 'Кондиционер', 
            type: 'aircon', 
            room: 'Спальня',
            roomId: 'bedroom',
            active: true,
            temperature: 22,
            mode: 'cooling'
          },
          { 
            id: 3, 
            name: 'Умная лампа', 
            type: 'light', 
            room: 'Кухня',
            roomId: 'kitchen',
            active: true,
            brightness: 80,
            color: '#2196F3'
          }
        ]
      } finally {
        this.loading = false
      }
    },
    async addDevice(deviceData) {
      this.loading = true
      try {
        const api = await import('@/services/api').then(m => m.default)
        const newDevice = await api.devices.createDevice(deviceData)
        this.devices.push(newDevice)
        return newDevice
      } catch (error) {
        this.error = error.message || 'Не удалось добавить устройство'
        throw error
      } finally {
        this.loading = false
      }
    },
    async toggleDevice(id) {
      const device = this.devices.find(d => d.id === id)
      if (device) {
        device.active = !device.active
        
        try {
          const api = await import('@/services/api').then(m => m.default)
          await api.devices.updateState(id, { active: device.active })
        } catch (error) {
          // Откатываем изменения при ошибке
          device.active = !device.active
          this.error = error.message || 'Не удалось обновить состояние устройства'
          throw error
        }
      }
    },
    async updateDeviceProperty(id, property, value) {
      const device = this.devices.find(d => d.id === id)
      if (device) {
        const oldValue = device[property] // Сохраняем старое значение для возможного отката
        device[property] = value
        
        try {
          const api = await import('@/services/api').then(m => m.default)
          await api.devices.updateState(id, { [property]: value })
        } catch (error) {
          // Откатываем изменения при ошибке
          device[property] = oldValue
          this.error = error.message || 'Не удалось обновить свойство устройства'
          throw error
        }
      }
    }
  }
})

// Хранилище для уведомлений
export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    loading: false,
    error: null,
    unreadCount: 0
  }),
  getters: {
    getUnreadCount: (state) => {
      return state.unreadCount
    },
    getRecentNotifications: (state) => {
      return state.notifications
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
    }
  },
  actions: {
    async fetchNotifications() {
      this.loading = true
      try {
        // В реальном приложении здесь будет вызов API
        // const response = await api.get('/notifications')
        // this.notifications = response.data
        
        // Временные данные для демонстрации
        this.notifications = [
          { id: 1, message: 'Обнаружено движение (Гараж)', type: 'warning', read: false, timestamp: new Date() },
          { id: 2, message: 'Низкий заряд батареи (Датчик)', type: 'warning', read: false, timestamp: new Date(Date.now() - 3600000) },
          { id: 3, message: 'Завершено обновление ПО', type: 'info', read: true, timestamp: new Date(Date.now() - 86400000) }
        ]
        
        this.unreadCount = this.notifications.filter(n => !n.read).length
        this.error = null
      } catch (error) {
        this.error = error.message || 'Не удалось загрузить уведомления'
      } finally {
        this.loading = false
      }
    },
    async markAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        this.unreadCount--
        
        // В реальном приложении здесь будет вызов API
        // await api.put(`/notifications/${id}`, { read: true })
      }
    },
    async markAllAsRead() {
      this.notifications.forEach(n => {
        n.read = true
      })
      this.unreadCount = 0
      
      // В реальном приложении здесь будет вызов API
      // await api.put('/notifications/mark-all-read')
    }
  }
})

// Хранилище для сценариев автоматизации
export const useScenariosStore = defineStore('scenarios', {
  state: () => ({
    scenarios: [],
    loading: false,
    error: null
  }),
  getters: {
    getActiveScenarios: (state) => {
      return state.scenarios.filter(s => s.isActive)
    }
  },
  actions: {
    async fetchScenarios() {
      this.loading = true
      try {
        // В реальном приложении здесь будет вызов API
        // const response = await api.get('/scenarios')
        // this.scenarios = response.data
        
        // Временные данные для демонстрации
        this.scenarios = [
          { id: 1, name: 'Закрыть окна при дожде', isActive: true, trigger: 'weather', conditions: ['rain'] },
          { id: 2, name: 'Выключить свет при выходе', isActive: true, trigger: 'location', conditions: ['away'] },
          { id: 3, name: 'Ночной режим', isActive: false, trigger: 'time', conditions: ['22:00'] }
        ]
        
        this.error = null
      } catch (error) {
        this.error = error.message || 'Не удалось загрузить сценарии'
      } finally {
        this.loading = false
      }
    },
    async toggleScenario(id) {
      const scenario = this.scenarios.find(s => s.id === id)
      if (scenario) {
        scenario.isActive = !scenario.isActive
        
        // В реальном приложении здесь будет вызов API
        // await api.put(`/scenarios/${id}`, { isActive: scenario.isActive })
      }
    }
  }
}) 