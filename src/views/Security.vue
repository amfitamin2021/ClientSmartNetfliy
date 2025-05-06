<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Безопасность</h1>
      <p class="text-gray-500">Управление системой безопасности и мониторинг</p>
    </div>

    <!-- Вкладки для подразделов безопасности -->
    <div class="mb-6 border-b">
      <div class="flex gap-6">
        <router-link 
          to="/security/cameras" 
          class="pb-3 px-1 border-b-2 transition-colors"
          :class="isActive('cameras') ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'"
        >
          <i class="fas fa-video mr-2"></i>Камеры
        </router-link>
        <router-link 
          to="/security/sensors" 
          class="pb-3 px-1 border-b-2 transition-colors"
          :class="isActive('sensors') ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'"
        >
          <i class="fas fa-bullseye mr-2"></i>Датчики
        </router-link>
        <router-link 
          to="/security/locks" 
          class="pb-3 px-1 border-b-2 transition-colors"
          :class="isActive('locks') ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'"
        >
          <i class="fas fa-lock mr-2"></i>Замки
        </router-link>
        <router-link 
          to="/security/alarms" 
          class="pb-3 px-1 border-b-2 transition-colors"
          :class="isActive('alarms') ? 'border-blue-500 text-blue-600' : 'border-transparent hover:border-gray-300'"
        >
          <i class="fas fa-bell mr-2"></i>Сигнализация
        </router-link>
      </div>
    </div>

    <!-- Панель статуса безопасности -->
    <div v-if="isRootRoute" class="mb-6 p-4 bg-white rounded-xl shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          class="p-4 rounded-lg text-center"
          :class="securityStatus.system === 'armed' ? 'bg-green-50 text-green-700' : 'bg-gray-50'"
        >
          <div class="text-xl mb-1">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3 class="font-semibold">Система</h3>
          <p>{{ securityStatus.system === 'armed' ? 'Активна' : 'Отключена' }}</p>
        </div>
        <div 
          class="p-4 rounded-lg text-center"
          :class="securityStatus.activeCameras > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50'"
        >
          <div class="text-xl mb-1">
            <i class="fas fa-video"></i>
          </div>
          <h3 class="font-semibold">Камеры</h3>
          <p>{{ securityStatus.activeCameras }} из {{ securityStatus.totalCameras }} активны</p>
        </div>
      </div>
      
      <!-- Управление режимом охраны -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-lg">Режим охраны</h3>
            <p class="text-gray-600">{{ securityStatus.system === 'armed' ? 'Система находится под охраной' : 'Охрана отключена' }}</p>
          </div>
          <div class="flex gap-3">
            <button 
              class="px-4 py-2 rounded-lg"
              :class="securityStatus.system === 'armed' ? 'bg-gray-200 text-gray-700' : 'bg-green-600 text-white'"
              @click="toggleSecuritySystem"
              :disabled="securityStatus.system === 'armed'"
            >
              <i class="fas fa-shield-alt mr-2"></i>Включить
            </button>
            <button 
              class="px-4 py-2 rounded-lg"
              :class="securityStatus.system === 'disarmed' ? 'bg-gray-200 text-gray-700' : 'bg-red-600 text-white'"
              @click="toggleSecuritySystem"
              :disabled="securityStatus.system === 'disarmed'"
            >
              <i class="fas fa-shield-alt mr-2"></i>Отключить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Содержимое вложенных маршрутов -->
    <router-view></router-view>
    
    <!-- Последние события безопасности -->
    <div v-if="isRootRoute" class="mt-6">
      <h2 class="text-xl font-semibold mb-4">Последние события</h2>
      
      <!-- Индикатор загрузки -->
      <div v-if="loadingHistory" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Сообщение об ошибке истории -->
      <div v-else-if="historyError" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
        <i class="fas fa-exclamation-circle mr-2"></i>{{ historyError }}
      </div>
      
      <!-- Сообщение, если нет истории -->
      <div v-else-if="lockHistory.length === 0" class="bg-gray-50 p-8 rounded-lg text-center">
        <i class="fas fa-history text-gray-300 text-5xl mb-4"></i>
        <h3 class="text-xl font-medium mb-2">История событий пуста</h3>
        <p class="text-gray-600 mb-4">История событий безопасности пока не содержит записей.</p>
      </div>
      
      <!-- Таблица истории -->
      <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Время</th>
                <th class="px-4 py-3 text-left">Устройство</th>
                <th class="px-4 py-3 text-left">Событие</th>
                <th class="px-4 py-3 text-left">Пользователь</th>
                <th class="px-4 py-3 text-left">Метод</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in lockHistory" :key="activity.id" class="border-t">
                <td class="px-4 py-3">{{ formatDate(activity.timestamp) }}</td>
                <td class="px-4 py-3">{{ activity.deviceName }}</td>
                <td class="px-4 py-3" :class="getEventActionClass(activity.action)">{{ activity.action }}</td>
                <td class="px-4 py-3">{{ activity.user }}</td>
                <td class="px-4 py-3">{{ activity.method }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { useDeviceStore } from '../store/deviceStore'

export default defineComponent({
  name: 'SecurityView',
  
  setup() {
    const route = useRoute()
    const deviceStore = useDeviceStore()
    
    // Флаги загрузки и ошибок
    const loadingHistory = ref(false)
    const historyError = ref(null)
    
    // Проверка, находимся ли мы на корневом маршруте /security
    const isRootRoute = computed(() => {
      return route.path === '/security'
    })
    
    // Определение активной вкладки
    const isActive = (routeName) => {
      return route.path.includes(`/security/${routeName}`)
    }
    
    // Статус системы безопасности
    const securityStatus = ref({
      system: 'armed', // armed или disarmed
      activeCameras: 4,
      totalCameras: 5
    })
    
    // Переключение системы безопасности
    const toggleSecuritySystem = () => {
      securityStatus.value.system = securityStatus.value.system === 'armed' ? 'disarmed' : 'armed'
    }
    
    // События безопасности
    const lockHistory = ref([])
    
    // Получение истории замков
    const fetchLockHistory = async () => {
      loadingHistory.value = true
      historyError.value = null
      
      try {
        const historyData = await api.devices.getAllLockHistory()
        lockHistory.value = historyData || []
        
        // Если нет данных и режим разработки, используем демо-данные
        if (lockHistory.value.length === 0 && process.env.NODE_ENV === 'development') {
          lockHistory.value = getDemoLockHistory()
        }
      } catch (err) {
        console.error('Ошибка при загрузке истории замков:', err)
        historyError.value = 'Не удалось загрузить историю. Попробуйте позже.'
        
        // В режиме разработки используем демо-данные
        if (process.env.NODE_ENV === 'development') {
          lockHistory.value = getDemoLockHistory()
        }
      } finally {
        loadingHistory.value = false
      }
    }
    
    // Демо-данные для истории замков
    const getDemoLockHistory = () => {
      return [
        {
          id: 1,
          timestamp: new Date(Date.now() - 3600000),
          deviceName: 'Замок входной двери',
          action: 'Заблокировано',
          user: 'Иван Петров',
          method: 'Приложение'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 7200000),
          deviceName: 'Замок гаража',
          action: 'Разблокировано',
          user: 'Система',
          method: 'Автоматически'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 10800000),
          deviceName: 'Замок входной двери',
          action: 'Разблокировано',
          user: 'Иван Петров',
          method: 'Ключ-карта'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 86400000),
          deviceName: 'Замок черного входа',
          action: 'Заблокировано',
          user: 'Анна Сидорова',
          method: 'Приложение'
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 172800000),
          deviceName: 'Замок гаража',
          action: 'Ошибка доступа',
          user: 'Неизвестно',
          method: 'Код доступа'
        }
      ]
    }
    
    // Получение класса для статуса события
    const getEventActionClass = (action) => {
      switch (action) {
        case 'Заблокировано':
          return 'text-red-600'
        case 'Разблокировано':
          return 'text-green-600'
        case 'Ошибка доступа':
          return 'text-yellow-600'
        default:
          return 'text-gray-500'
      }
    }
    
    // Форматирование даты
    const formatDate = (date) => {
      return new Date(date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    onMounted(async () => {
      // Загружаем устройства, если они еще не загружены
      if (deviceStore.devices.length === 0) {
        await deviceStore.fetchDevices()
      }
      
      // Загружаем историю замков
      fetchLockHistory()
    })
    
    return {
      isRootRoute,
      isActive,
      securityStatus,
      lockHistory,
      loadingHistory,
      historyError,
      toggleSecuritySystem,
      getEventActionClass,
      formatDate
    }
  }
})
</script> 