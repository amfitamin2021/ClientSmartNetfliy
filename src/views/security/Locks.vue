<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Умные замки</h2>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" @click="refreshLocks">
          <i class="fas fa-sync-alt mr-2"></i>Обновить
        </button>
        <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg">
          <i class="fas fa-plus mr-2"></i>Добавить замок
        </router-link>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
      <i class="fas fa-exclamation-circle mr-2"></i>{{ error }}
    </div>

    <!-- Сообщение, если нет замков -->
    <div v-else-if="locks.length === 0" class="bg-gray-50 p-8 rounded-lg text-center">
      <i class="fas fa-lock text-gray-300 text-5xl mb-4"></i>
      <h3 class="text-xl font-medium mb-2">Умные замки не найдены</h3>
      <p class="text-gray-600 mb-4">В вашей системе пока нет умных замков. Добавьте новые устройства на странице устройств.</p>
      <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center">
        <i class="fas fa-plus mr-2"></i>Добавить устройства
      </router-link>
    </div>

    <!-- Сетка замков -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="lock in locks" :key="lock.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="p-4">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold">{{ lock.name }}</h3>
              <p class="text-sm text-gray-600">{{ lock.room }}</p>
            </div>
            <div class="flex items-center">
              <span class="inline-block h-2 w-2 rounded-full mr-1" :class="lock.online ? 'bg-green-500' : 'bg-gray-400'"></span>
              <span class="text-xs text-gray-600">{{ lock.online ? 'Онлайн' : 'Офлайн' }}</span>
            </div>
          </div>

          <div class="mb-4 flex justify-center">
            <div class="text-center">
              <div class="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <i :class="['text-4xl', isLocked(lock) ? 'fas fa-lock text-red-500' : 'fas fa-lock-open text-green-500']"></i>
              </div>
              <p class="font-medium" :class="isLocked(lock) ? 'text-red-500' : 'text-green-500'">
                {{ isLocked(lock) ? 'Заблокировано' : 'Разблокировано' }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button 
              class="flex-1 px-3 py-2 rounded-lg border"
              :class="isLocked(lock) ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'"
              @click="toggleLock(lock)"
              :disabled="!lock.online || !lock.canControl"
            >
              <i class="fas" :class="isLocked(lock) ? 'fa-lock-open' : 'fa-lock'"></i>
              {{ isLocked(lock) ? 'Разблокировать' : 'Заблокировать' }}
            </button>
            <button 
              class="flex-none px-3 py-2 rounded-lg border border-gray-300 text-gray-700"
              @click="showHistory(lock)"
            >
              <i class="fas fa-history"></i>
            </button>
          </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 border-t">
          <div class="flex justify-between text-sm">
            <div>
              <span class="text-gray-600">Батарея:</span>
              <span :class="getBatteryLevel(lock) < 20 ? 'text-red-500' : ''">{{ getBatteryLevel(lock) }}%</span>
            </div>
            <div>
              <span class="text-gray-600">Последнее действие:</span>
              <span>{{ formatDate(lock.lastSeen || new Date()) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- История активности -->
    <div v-if="locks.length > 0" class="mt-8">
      <h2 class="text-xl font-semibold mb-4">История активности</h2>
      
      <!-- Индикатор загрузки истории -->
      <div v-if="loadingHistory" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Сообщение об ошибке истории -->
      <div v-else-if="historyError" class="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
        <i class="fas fa-exclamation-circle mr-2"></i>{{ historyError }}
      </div>
      
      <!-- Отображение истории -->
      <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div v-if="lockHistory.length === 0" class="p-6 text-center text-gray-500">
          <i class="fas fa-history text-gray-300 text-3xl mb-3"></i>
          <p>История активности пуста</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Время</th>
                <th class="px-4 py-3 text-left">Замок</th>
                <th class="px-4 py-3 text-left">Событие</th>
                <th class="px-4 py-3 text-left">Пользователь</th>
                <th class="px-4 py-3 text-left">Метод</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in lockHistory" :key="activity.id" class="border-t">
                <td class="px-4 py-3">{{ formatDate(activity.timestamp) }}</td>
                <td class="px-4 py-3">{{ activity.deviceName }}</td>
                <td class="px-4 py-3" :class="getActivityClass(activity.action)">{{ activity.action }}</td>
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
import { useDeviceStore } from '../../store/deviceStore'
import api from '../../services/api'

export default defineComponent({
  name: 'LocksView',
  
  setup() {
    const deviceStore = useDeviceStore()
    
    // Флаги загрузки и ошибок
    const loading = ref(true)
    const error = ref(null)
    const loadingHistory = ref(true)
    const historyError = ref(null)
    
    // История активности замков
    const lockHistory = ref([])
    
    // Получение списка замков из хранилища устройств
    const locks = computed(() => {
      return deviceStore.devices.filter(device => 
        device.type === 'lock' || 
        (device.category === 'SECURITY' && device.subType === 'SMART_LOCK')
      )
    })
    
    // Метод для проверки, заблокирован ли замок
    const isLocked = (lock) => {
      return lock.rawProperties?.tb_locked === 'true'
    }
    
    // Получение уровня заряда батареи
    const getBatteryLevel = (lock) => {
      return parseInt(lock.rawProperties?.battery || lock.rawProperties?.tb_battery || '70')
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
    
    // Переключение состояния замка
    const toggleLock = async (lock) => {
      try {
        // Вместо sendCommand используем специальный метод toggleLock
        await deviceStore.toggleLock(lock.id)
        
        // После успешного выполнения команды обновляем историю
        fetchLockHistory()
      } catch (err) {
        console.error('Ошибка при переключении замка:', err)
        // Показываем уведомление об ошибке
        // Здесь можно добавить код для отображения уведомления
      }
    }
    
    // Показать историю для конкретного замка
    const showHistory = (lock) => {
      // Фильтруем историю для отображения только для выбранного замка
      fetchLockHistory(lock.id)
    }
    
    // Обновление списка замков
    const refreshLocks = async () => {
      loading.value = true
      error.value = null
      
      try {
        await deviceStore.fetchDevices()
      } catch (err) {
        console.error('Ошибка при загрузке устройств:', err)
        error.value = 'Не удалось загрузить данные о замках. Пожалуйста, попробуйте позже.'
      } finally {
        loading.value = false
      }
      
      // Также обновляем историю
      fetchLockHistory()
    }
    
    // Получение истории замков
    const fetchLockHistory = async (deviceId = null) => {
      loadingHistory.value = true;
      historyError.value = null;
      
      try {
        let historyData;
        
        if (deviceId) {
          // Получаем историю для конкретного замка
          historyData = await api.devices.getLockHistory(deviceId);
        } else {
          // Получаем общую историю всех замков
          historyData = await api.devices.getAllLockHistory();
        }
        
        // Обновляем данные истории
        lockHistory.value = historyData || [];
      } catch (err) {
        console.error('Ошибка при загрузке истории замков:', err);
        historyError.value = 'Не удалось загрузить историю. Пожалуйста, попробуйте позже.';
        // В режиме разработки можем использовать статические данные
        if (process.env.NODE_ENV === 'development') {
          lockHistory.value = getDemoHistory();
        }
      } finally {
        loadingHistory.value = false;
      }
    }
    
    // Получение демо-данных для истории (используется только в режиме разработки)
    const getDemoHistory = () => {
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
    
    // Получение класса для действия с замком
    const getActivityClass = (action) => {
      switch (action) {
        case 'Заблокировано':
          return 'text-red-600'
        case 'Разблокировано':
          return 'text-green-600'
        case 'Ошибка доступа':
          return 'text-yellow-600'
        default:
          return ''
      }
    }
    
    // При монтировании компонента загружаем данные
    onMounted(() => {
      refreshLocks()
    })
    
    return {
      locks,
      lockHistory,
      loading,
      error,
      loadingHistory,
      historyError,
      formatDate,
      toggleLock,
      showHistory,
      getActivityClass,
      refreshLocks,
      isLocked,
      getBatteryLevel
    }
  }
})
</script> 