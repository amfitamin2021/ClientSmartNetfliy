<template>
  <div class="p-6">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold">История</h1>
      <div class="flex gap-2">
        <select v-model="selectedDevice" class="px-3 py-2 border rounded-lg bg-white">
          <option value="all">Все устройства</option>
          <option v-for="device in devices" :key="device.id" :value="device.id">
            {{ device.name }}
          </option>
        </select>
        <select v-model="period" class="px-3 py-2 border rounded-lg bg-white">
          <option value="day">Сегодня</option>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else class="grid gap-6">
      <!-- График активности -->
      <div class="p-6 bg-white rounded-xl shadow-sm">
        <h2 class="text-xl font-semibold mb-4">Активность устройств</h2>
        <div class="h-64">
          <!-- Здесь будет график активности -->
          <div class="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <p class="text-gray-500">График будет добавлен позже</p>
          </div>
        </div>
      </div>

      <!-- Таблица истории -->
      <div class="p-6 bg-white rounded-xl shadow-sm">
        <h2 class="text-xl font-semibold mb-4">Журнал событий</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-2">Дата и время</th>
                <th class="px-4 py-2">Устройство</th>
                <th class="px-4 py-2">Событие</th>
                <th class="px-4 py-2">Значение</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(event, index) in historyEvents" :key="index" class="border-t">
                <td class="px-4 py-2 text-sm text-gray-600">{{ formatDate(event.timestamp) }}</td>
                <td class="px-4 py-2">{{ event.deviceName }}</td>
                <td class="px-4 py-2">{{ event.eventType }}</td>
                <td class="px-4 py-2">{{ event.value }}</td>
              </tr>
              <tr v-if="historyEvents.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                  Нет данных за выбранный период
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex justify-center">
          <button 
            class="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
            :disabled="page === 1"
            @click="prevPage"
          >
            &laquo; Назад
          </button>
          <span class="mx-4 py-2">Страница {{ page }}</span>
          <button 
            class="px-4 py-2 bg-gray-100 rounded-lg text-gray-700"
            :disabled="isLastPage"
            @click="nextPage"
          >
            Вперед &raquo;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useDevicesStore } from '@/store'

export default defineComponent({
  name: 'HistoryView',
  
  setup() {
    const devicesStore = useDevicesStore()
    const selectedDevice = ref('all')
    const period = ref('day')
    const loading = ref(false)
    const error = ref(null)
    const page = ref(1)
    const pageSize = 10
    
    // Временные данные истории для примера
    const allHistoryEvents = ref([
      { 
        timestamp: new Date(Date.now() - 3600000 * 2), 
        deviceId: 1, 
        deviceName: 'Термостат Гостиная', 
        eventType: 'Изменение температуры', 
        value: '23°C'
      },
      { 
        timestamp: new Date(Date.now() - 3600000 * 4), 
        deviceId: 2, 
        deviceName: 'Лампа Гостиная', 
        eventType: 'Включение', 
        value: 'Вкл'
      },
      { 
        timestamp: new Date(Date.now() - 3600000 * 5), 
        deviceId: 3, 
        deviceName: 'Лампа Кухня', 
        eventType: 'Выключение', 
        value: 'Выкл'
      },
      { 
        timestamp: new Date(Date.now() - 86400000), 
        deviceId: 4, 
        deviceName: 'Датчик движения Коридор', 
        eventType: 'Обнаружено движение', 
        value: 'Да'
      },
      { 
        timestamp: new Date(Date.now() - 86400000 * 2), 
        deviceId: 1, 
        deviceName: 'Термостат Гостиная', 
        eventType: 'Изменение температуры', 
        value: '22°C'
      },
    ])
    
    // Фильтрация событий по устройству и периоду
    const filteredEvents = computed(() => {
      let startTime = new Date()
      
      // Определяем начальную дату для фильтрации по периоду
      switch(period.value) {
        case 'day':
          startTime.setHours(0, 0, 0, 0)
          break
        case 'week':
          startTime.setDate(startTime.getDate() - 7)
          break
        case 'month':
          startTime.setMonth(startTime.getMonth() - 1)
          break
      }
      
      return allHistoryEvents.value
        .filter(event => {
          // Фильтруем по периоду
          const eventTime = new Date(event.timestamp)
          const isPeriodMatch = eventTime >= startTime
          
          // Фильтруем по устройству
          const isDeviceMatch = selectedDevice.value === 'all' || 
                                event.deviceId === parseInt(selectedDevice.value)
          
          return isPeriodMatch && isDeviceMatch
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Сортировка по дате
    })
    
    // Пагинация
    const historyEvents = computed(() => {
      const start = (page.value - 1) * pageSize
      return filteredEvents.value.slice(start, start + pageSize)
    })
    
    const isLastPage = computed(() => {
      return page.value * pageSize >= filteredEvents.value.length
    })
    
    // Форматирование даты
    const formatDate = (date) => {
      return new Date(date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Функции пагинации
    const nextPage = () => {
      if (!isLastPage.value) {
        page.value++
      }
    }
    
    const prevPage = () => {
      if (page.value > 1) {
        page.value--
      }
    }
    
    // Сбрасываем страницу при изменении фильтров
    watch([selectedDevice, period], () => {
      page.value = 1
    })
    
    onMounted(() => {
      devicesStore.fetchDevices()
      // В реальном приложении здесь был бы запрос на получение истории
      loading.value = true
      setTimeout(() => {
        // Имитация загрузки данных
        loading.value = false
      }, 1000)
    })
    
    return {
      devices: computed(() => devicesStore.devices),
      selectedDevice,
      period,
      loading,
      error,
      historyEvents,
      page,
      isLastPage,
      formatDate,
      nextPage,
      prevPage
    }
  }
})
</script> 