import { defineStore } from 'pinia'
import axios from 'axios'

// Используем относительный URL (будет проксирован через Vite)
const API_URL = '/api'

// Создаем отдельный экземпляр для авторизации
const authClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
  
  getters: {
    // Получить текущего пользователя
    currentUser: (state) => state.user,
    
    // Проверка авторизации
    isLoggedIn: (state) => state.isAuthenticated,
    
    // Получить JWT токен
    getToken: (state) => state.token,
    
    // Проверка наличия ролей
    hasRole: (state) => (role) => {
      if (!state.user || !state.user.roles) return false
      return state.user.roles.includes(role)
    },
    
    // Проверка, является ли пользователь админом
    isAdmin: (state) => {
      if (!state.user || !state.user.roles) return false
      return state.user.roles.includes('ROLE_ADMIN')
    }
  },
  
  actions: {
    // Вход пользователя
    async login(credentials) {
      try {
        const response = await authClient.post('/auth/login', credentials)
        
        // Обновление состояния хранилища
        this.token = response.data.token
        this.user = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          roles: response.data.roles
        }
        this.isAuthenticated = true
        
        // Установка токена в локальное хранилище для последующего использования в API
        localStorage.setItem('token', this.token)
        
        return response.data
      } catch (error) {
        console.error('Ошибка при входе:', error)
        throw error
      }
    },
    
    // Выход пользователя
    logout() {
      // Очистка состояния
      this.user = null
      this.token = null
      this.isAuthenticated = false
      
      // Удаление токена из хранилища
      localStorage.removeItem('token')
    },
    
    // Регистрация пользователя
    async register(userData) {
      try {
        const response = await authClient.post('/auth/register', userData)
        return response.data
      } catch (error) {
        console.error('Ошибка при регистрации:', error)
        throw error
      }
    },
    
    // Получение информации о текущем пользователе
    async fetchCurrentUser() {
      try {
        if (!this.token) {
          throw new Error('Пользователь не авторизован')
        }
        
        const response = await authClient.get('/users/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
        
        // Обновление данных пользователя
        this.user = response.data
        
        return response.data
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error)
        
        // Если ошибка авторизации, очищаем состояние
        if (error.response && error.response.status === 401) {
          this.logout()
        }
        
        throw error
      }
    },
    
    // Обновление данных пользователя
    async updateUserProfile(userData) {
      try {
        if (!this.token) {
          throw new Error('Пользователь не авторизован')
        }
        
        const response = await authClient.put('/users/me', userData, {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
        
        // Обновление данных пользователя в хранилище
        this.user = {
          ...this.user,
          ...response.data
        }
        
        return response.data
      } catch (error) {
        console.error('Ошибка при обновлении профиля:', error)
        throw error
      }
    },
    
    // Инициализация из локального хранилища при запуске приложения
    initializeFromLocalStorage() {
      const token = localStorage.getItem('token')
      
      if (token) {
        this.token = token
        this.isAuthenticated = true
        
        // Загружаем данные пользователя с сервера
        this.fetchCurrentUser().catch(() => {
          // Если не удалось получить данные пользователя, выполняем логаут
          this.logout()
        })
      }
    }
  },
  
  // Сохранение состояния в localStorage
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user-store',
        storage: localStorage,
        paths: ['token', 'isAuthenticated'] // Сохраняем только токен и флаг аутентификации
      }
    ]
  }
}) 