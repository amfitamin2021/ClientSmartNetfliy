<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Профиль</h1>
      <p class="text-gray-500">Управление личными данными и настройками</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Боковая панель с фото и основной информацией -->
      <div class="md:col-span-1">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex flex-col items-center mb-4">
            <div class="w-32 h-32 overflow-hidden rounded-full mb-4 bg-gray-100 flex items-center justify-center">
              <img 
                v-if="profileImage" 
                :src="profileImage" 
                alt="Фото профиля" 
                class="w-full h-full object-cover"
              />
              <i v-else class="fas fa-user text-5xl text-gray-400"></i>
            </div>
            <h2 class="text-xl font-semibold">{{ user.name }}</h2>
            <p class="text-gray-500">{{ user.email }}</p>
            
            <button class="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
              Изменить фото
            </button>
          </div>
          
          <div class="border-t pt-4">
            <div class="flex items-center mb-3">
              <i class="fas fa-home text-gray-500 w-6"></i>
              <span>{{ user.homeCount }} {{ getHomesText }}</span>
            </div>
            <div class="flex items-center mb-3">
              <i class="fas fa-mobile-alt text-gray-500 w-6"></i>
              <span>{{ user.devicesCount }} {{ getDevicesText }}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-calendar-alt text-gray-500 w-6"></i>
              <span>Дата регистрации: {{ formatDate(user.registrationDate) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Основная информация профиля -->
      <div class="md:col-span-3">
        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold mb-6">Личные данные</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Имя</label>
              <input 
                type="text" 
                v-model="form.name" 
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label class="block text-sm text-gray-600 mb-1">Фамилия</label>
              <input 
                type="text" 
                v-model="form.lastName" 
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label class="block text-sm text-gray-600 mb-1">Email</label>
              <input 
                type="email" 
                v-model="form.email" 
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label class="block text-sm text-gray-600 mb-1">Номер телефона</label>
              <input 
                type="tel" 
                v-model="form.phone" 
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-600 mb-1">Адрес</label>
              <input 
                type="text" 
                v-model="form.address" 
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div class="mt-6">
            <button 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg"
              @click="saveProfile"
            >
              Сохранить изменения
            </button>
          </div>
        </div>
        
        <!-- Доступ к дому -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 class="text-xl font-semibold mb-6">Доступ к дому</h2>
          
          <div class="mb-4">
            <label class="block text-sm text-gray-600 mb-1">Основной дом</label>
            <select v-model="form.primaryHome" class="w-full px-3 py-2 border rounded-lg bg-white">
              <option v-for="home in homes" :key="home.id" :value="home.id">
                {{ home.name }}
              </option>
            </select>
          </div>
          
          <div class="border-t pt-4">
            <h3 class="font-medium mb-4">Пользователи с доступом</h3>
            
            <div class="space-y-4">
              <div v-for="member in homeMembers" :key="member.id" class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <i v-if="!member.image" class="fas fa-user text-gray-400"></i>
                    <img v-else :src="member.image" class="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <p class="font-medium">{{ member.name }}</p>
                    <p class="text-sm text-gray-500">{{ member.role }}</p>
                  </div>
                </div>
                
                <div>
                  <button 
                    v-if="member.id !== user.id"
                    class="text-red-500 hover:text-red-700"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <button class="mt-4 flex items-center text-blue-600">
              <i class="fas fa-plus mr-2"></i> Добавить пользователя
            </button>
          </div>
        </div>
        
        <!-- Активные сессии -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold mb-6">Активные сессии</h2>
          
          <div class="space-y-4">
            <div v-for="(session, index) in sessions" :key="index" class="flex justify-between items-center pb-3 border-b">
              <div>
                <div class="flex items-center">
                  <i :class="getDeviceIcon(session.device)" class="text-gray-600 mr-3"></i>
                  <div>
                    <p class="font-medium">{{ session.device }}</p>
                    <p class="text-sm text-gray-500">{{ session.location }} • {{ formatDate(session.lastActivity) }}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <span v-if="session.current" class="text-green-500 mr-4">Текущая</span>
                <button class="text-red-500 hover:text-red-700">
                  Завершить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useUserStore } from '../store/userStore'

export default defineComponent({
  name: 'ProfileView',
  
  setup() {
    const userStore = useUserStore()
    
    // Загружаем пользователя из хранилища
    const currentUser = computed(() => userStore.user || {})
    
    // Данные пользователя (объединяем с данными из API)
    const user = ref({
      id: currentUser.value?.id || 1,
      name: currentUser.value?.username || 'Пользователь',
      email: currentUser.value?.email || 'user@example.com',
      homeCount: 1,
      devicesCount: 5,
      registrationDate: new Date() // В реальном приложении должно приходить с сервера
    })
    
    // Форма для редактирования данных
    const form = ref({
      name: user.value.name,
      lastName: '',
      email: user.value.email,
      phone: '',
      address: '',
      primaryHome: 1
    })
    
    // Изображение профиля
    const profileImage = ref(null)
    
    // Метод сохранения профиля
    const saveProfile = async () => {
      try {
        // Подготовка данных для обновления
        const userData = {
          name: form.value.name,
          email: form.value.email,
          // Другие поля...
        }
        
        // Вызов API для обновления профиля
        await userStore.updateUserProfile(userData)
        
        // Обновление локальных данных
        user.value.name = form.value.name
        user.value.email = form.value.email
        
        alert('Профиль успешно обновлен')
      } catch (error) {
        console.error('Ошибка при обновлении профиля', error)
        alert('Произошла ошибка при обновлении профиля')
      }
    }
    
    // Геттеры для корректного склонения слов
    const getHomesText = computed(() => {
      const count = user.value.homeCount
      if (count === 1) return 'дом'
      else if (count > 1 && count < 5) return 'дома'
      else return 'домов'
    })
    
    const getDevicesText = computed(() => {
      const count = user.value.devicesCount
      if (count === 1) return 'устройство'
      else if (count > 1 && count < 5) return 'устройства'
      else return 'устройств'
    })
    
    // Форматирование даты
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU')
    }
    
    // Получение иконки устройства
    const getDeviceIcon = (device) => {
      if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('ios')) {
        return 'fab fa-apple'
      } else if (device.toLowerCase().includes('android')) {
        return 'fab fa-android'
      } else if (device.toLowerCase().includes('windows')) {
        return 'fab fa-windows'
      } else {
        return 'fas fa-desktop'
      }
    }
    
    // Имитация данных о домах
    const homes = ref([
      { id: 1, name: 'Мой дом' },
      { id: 2, name: 'Дача' }
    ])
    
    // Имитация данных о пользователях с доступом
    const homeMembers = ref([
      { id: 1, name: user.value.name, role: 'Владелец', image: null },
      { id: 2, name: 'Александр Петров', role: 'Гость', image: null }
    ])
    
    // Имитация данных о сессиях
    const sessions = ref([
      { 
        device: 'Windows 10 - Chrome',
        location: 'Москва, Россия',
        lastActivity: new Date(),
        current: true 
      },
      { 
        device: 'iPhone 12 - Safari',
        location: 'Москва, Россия',
        lastActivity: new Date(Date.now() - 86400000), // вчера
        current: false 
      }
    ])
    
    // Загрузка данных при монтировании компонента
    onMounted(async () => {
      try {
        // Попытка загрузить актуальные данные пользователя
        await userStore.fetchCurrentUser()
        
        // Обновление локальных данных
        user.value.id = currentUser.value?.id || 1
        user.value.name = currentUser.value?.username || 'Пользователь'
        user.value.email = currentUser.value?.email || 'user@example.com'
        
        // Обновление формы
        form.value.name = user.value.name
        form.value.email = user.value.email
        
        // Обновление списка участников
        homeMembers.value[0].name = user.value.name
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя', error)
      }
    })
    
    return {
      user,
      form,
      profileImage,
      saveProfile,
      getHomesText,
      getDevicesText,
      formatDate,
      getDeviceIcon,
      homes,
      homeMembers,
      sessions
    }
  }
})
</script> 