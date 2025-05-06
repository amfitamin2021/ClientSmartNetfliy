<template>
  <div class="sensor-history">
    <div class="mb-4 flex justify-between items-center">
      <h3 class="text-lg font-semibold">История срабатывания датчиков</h3>
      <div class="flex gap-2">
        <button 
          @click="refreshHistory" 
          class="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <i class="fas fa-sync-alt mr-1"></i>Обновить
        </button>
        <button 
          v-if="hasUnacknowledgedEvents"
          @click="acknowledgeAll" 
          class="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
        >
          <i class="fas fa-check mr-1"></i>Прочитать все
        </button>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Пустая история -->
    <div v-else-if="historyItems.length === 0" class="bg-gray-50 text-center p-6 rounded-lg">
      <i class="fas fa-history text-gray-300 text-3xl mb-3"></i>
      <p class="text-gray-600">Нет записей о срабатывании датчиков</p>
    </div>

    <!-- Таблица истории -->
    <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">Время</th>
              <th class="px-4 py-3 text-left">Датчик</th>
              <th class="px-4 py-3 text-left">Событие</th>
              <th class="px-4 py-3 text-left">Помещение</th>
              <th class="px-4 py-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in historyItems" 
              :key="item.id" 
              class="border-t"
              :class="{ 'bg-yellow-50': !item.acknowledged && item.priority === 'normal', 'bg-red-50': !item.acknowledged && item.priority === 'high' }"
            >
              <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(item.timestamp) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center">
                  <i :class="getSensorIcon(item.type)" class="mr-2 text-gray-400"></i>
                  <span>{{ item.deviceName }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs"
                  :class="getEventClass(item)"
                >
                  <i v-if="!item.acknowledged && item.priority === 'high'" class="fas fa-exclamation-triangle mr-1"></i>
                  {{ item.message }}
                </span>
              </td>
              <td class="px-4 py-3">{{ item.room }}</td>
              <td class="px-4 py-3">
                <button 
                  v-if="!item.acknowledged"
                  @click="acknowledgeEvent(item)" 
                  class="text-blue-600 hover:text-blue-800"
                  title="Отметить как прочитанное"
                >
                  <i class="fas fa-check"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Пагинация, если нужна -->
    <div v-if="historyItems.length > 0" class="mt-3 flex justify-end">
      <div class="text-sm text-gray-500">
        Показано {{ Math.min(historyItems.length, 10) }} из {{ totalHistory }} записей
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '../../store/deviceStore'

export default defineComponent({
  name: 'SensorHistory',
  
  props: {
    deviceId: {
      type: String,
      default: null
    },
    limit: {
      type: Number,
      default: 10
    }
  },
  
  setup(props, { emit }) {
    const deviceStore = useDeviceStore()
    
    // Состояние компонента
    const loading = ref(true)
    const historyItems = ref([])
    const totalHistory = ref(0)
    
    // Получаем неподтвержденные события
    const hasUnacknowledgedEvents = computed(() => {
      return historyItems.value.some(item => !item.acknowledged)
    })
    
    // Получение истории датчиков
    const fetchHistory = async () => {
      loading.value = true
      
      try {
        // Получаем историю с сервера через API
        const history = await deviceStore.getSensorHistory(props.deviceId)
        historyItems.value = history.slice(0, props.limit)
        totalHistory.value = history.length
      } catch (error) {
        console.error('Ошибка при загрузке истории датчиков:', error)
        // При ошибке используем пустой массив
        historyItems.value = []
        totalHistory.value = 0
      } finally {
        loading.value = false
      }
    }
    
    // Обновление истории
    const refreshHistory = () => {
      fetchHistory()
    }
    
    // Подтверждение события (отметить как прочитанное)
    const acknowledgeEvent = async (item) => {
      try {
        // Обновляем запись в истории через deviceStore
        const result = await deviceStore.updateSensorHistoryEntry(item.id, { acknowledged: true })
        if (result.success) {
          // Обновляем состояние в UI
          item.acknowledged = true
          emit('event-acknowledged', item)
        }
      } catch (error) {
        console.error('Ошибка при подтверждении события:', error)
      }
    }
    
    // Подтверждение всех событий
    const acknowledgeAll = async () => {
      try {
        // Обновляем все записи в истории через deviceStore
        const result = await deviceStore.acknowledgeAllSensorHistory(props.deviceId)
        if (result.success) {
          // Обновляем состояние в UI
          historyItems.value.forEach(item => {
            if (!item.acknowledged) {
              item.acknowledged = true
            }
          })
          emit('all-events-acknowledged')
          
          // Обновляем историю, чтобы получить актуальные данные
          refreshHistory()
        }
      } catch (error) {
        console.error('Ошибка при подтверждении всех событий:', error)
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
    
    // Получение иконки для типа датчика
    const getSensorIcon = (type) => {
      switch (type) {
        case 'motion':
          return 'fas fa-running'
        case 'contact':
          return 'fas fa-door-open'
        case 'smoke':
          return 'fas fa-smog'
        case 'leak':
          return 'fas fa-tint'
        default:
          return 'fas fa-bell'
      }
    }
    
    // Получение класса для типа события
    const getEventClass = (item) => {
      // Базовый класс в зависимости от приоритета
      const baseClass = item.priority === 'high' 
        ? 'bg-red-100 text-red-800' 
        : 'bg-blue-100 text-blue-800'
      
      // Если событие не подтверждено, добавляем анимацию пульсации для высокого приоритета
      if (!item.acknowledged && item.priority === 'high') {
        return `${baseClass} animate-pulse`
      }
      
      return baseClass
    }
    
    // При монтировании компонента загружаем историю
    onMounted(() => {
      fetchHistory()
    })
    
    return {
      loading,
      historyItems,
      totalHistory,
      hasUnacknowledgedEvents,
      refreshHistory,
      acknowledgeEvent,
      acknowledgeAll,
      formatDate,
      getSensorIcon,
      getEventClass
    }
  }
})
</script> 