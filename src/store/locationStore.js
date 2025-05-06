import { defineStore } from 'pinia'
import api from '@/services/api'

export const useLocationStore = defineStore('location', {
  state: () => ({
    locations: [],
    activeLocationId: null,
    rooms: [],
    loading: false,
    error: null
  }),

  getters: {
    activeLocation: (state) => {
      return state.locations.find(loc => loc.id === state.activeLocationId) || null
    },
    
    roomsGroupedByLocation: (state) => {
      const grouped = {}
      state.locations.forEach(location => {
        grouped[location.id] = state.rooms.filter(room => room.locationId === location.id)
      })
      return grouped
    },
    
    getRoomById: (state) => (id) => {
      return state.rooms.find(room => room.id === id) || { id: null, name: 'Неназначено' }
    }
  },

  actions: {
    /**
     * Загрузить список локаций
     */
    async fetchLocations() {
      this.loading = true
      this.error = null

      try {
        const locations = await api.locations.getLocations()
        console.log('Загруженные локации:', locations)
        this.locations = locations

        // Если нет активной локации, установим первую из списка
        if (locations.length > 0 && !this.activeLocationId) {
          this.activeLocationId = locations[0].id
          console.log('Установлена активная локация:', this.activeLocationId)
        }

        // Если установлена активная локация, загрузим комнаты для неё
        if (this.activeLocationId) {
          await this.fetchRooms(this.activeLocationId)
        }

        return locations
      } catch (error) {
        console.error('Ошибка при загрузке локаций:', error)
        this.error = error.message || 'Не удалось загрузить локации'
        return []
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Загрузить комнаты для указанной локации
     * @param {string|number} locationId - ID локации
     */
    async fetchRooms(locationId) {
      if (!locationId) {
        console.error('ID локации не указан')
        return []
      }

      this.loading = true
      this.error = null

      try {
        console.log('Загрузка комнат для локации:', locationId)
        // Используем новый прямой метод API для получения комнат
        const rooms = await api.locations.getRooms(locationId)
        console.log('Полученные комнаты:', rooms)
        
        if (rooms && Array.isArray(rooms)) {
          // Добавляем locationId к каждой комнате для удобства
          const mappedRooms = rooms.map(room => ({
            ...room,
            locationId
          }))
          console.log('Маппинг комнат с locationId:', mappedRooms)
          
          // Обновляем только комнаты для текущей локации, сохраняя другие
          this.rooms = [
            ...this.rooms.filter(room => room.locationId !== locationId),
            ...mappedRooms
          ]
          
          return mappedRooms
        } else {
          console.warn('Неверный формат данных комнат в ответе API:', rooms)
          return []
        }
      } catch (error) {
        console.error(`Ошибка при загрузке комнат для локации ${locationId}:`, error)
        this.error = error.message || 'Не удалось загрузить комнаты'
        return []
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Добавить новую локацию
     * @param {Object} locationData - данные новой локации
     */
    async addLocation(locationData) {
      this.loading = true
      this.error = null

      try {
        console.log('Создание локации с данными:', locationData)
        const newLocation = await api.locations.createLocation(locationData)
        console.log('Ответ API при создании локации:', newLocation)
        
        if (!newLocation || !newLocation.id) {
          throw new Error('API вернул некорректные данные локации')
        }
        
        // Добавляем новую локацию в список
        this.locations.push(newLocation)
        console.log('Обновленный список локаций:', this.locations)
        
        // Если это первая локация, делаем её активной
        if (this.locations.length === 1) {
          this.activeLocationId = newLocation.id
          console.log('Установлена новая активная локация:', this.activeLocationId)
        }
        
        return newLocation
      } catch (error) {
        console.error('Ошибка при добавлении локации:', error)
        this.error = error.message || 'Не удалось добавить локацию'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Добавить новую комнату в локацию
     * @param {string|number} locationId - ID локации
     * @param {Object} roomData - данные новой комнаты
     */
    async addRoom(locationId, roomData) {
      if (!locationId) {
        const error = new Error('ID локации не указан')
        this.error = error.message
        throw error
      }

      this.loading = true
      this.error = null

      try {
        console.log('Добавление комнаты в локацию:', locationId, roomData)
        
        // Используем новый прямой метод API для создания комнаты
        const newRoom = await api.locations.createRoom(locationId, roomData)
        console.log('Созданная комната:', newRoom)
        
        if (!newRoom || !newRoom.id) {
          throw new Error('API вернул некорректные данные комнаты')
        }
        
        // Добавляем locationId к комнате
        const roomWithLocation = {
          ...newRoom,
          locationId
        }
        
        // Добавляем новую комнату в список, сохраняя существующие
        this.rooms.push(roomWithLocation)
        
        console.log('Обновленный список комнат:', this.rooms)
        return newRoom
      } catch (error) {
        console.error(`Ошибка при добавлении комнаты в локацию ${locationId}:`, error)
        this.error = error.message || 'Не удалось добавить комнату'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Установить активную локацию
     * @param {string|number} locationId - ID локации
     */
    async setActiveLocation(locationId) {
      console.log('Установка активной локации:', locationId)
      this.activeLocationId = locationId
      
      // При смене активной локации загружаем комнаты для неё
      if (locationId) {
        await this.fetchRooms(locationId)
      } else {
        this.rooms = []
      }
    }
  }
}) 