<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Мониторинг безопасности</h2>
      <div class="flex gap-3">
        <div class="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center">
          <span class="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          <span>Система активна</span>
        </div>
        <button class="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center">
          <i class="fas fa-bell-slash mr-2"></i>Отключить
        </button>
      </div>
    </div>

    <!-- Сводка статистики -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center mb-2">
          <div class="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h3 class="text-lg font-medium">Общий статус</h3>
        </div>
        <div class="flex items-baseline">
          <p class="text-2xl font-semibold text-green-600">Нормальный</p>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center mb-2">
          <div class="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-3">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 class="text-lg font-medium">Активные тревоги</h3>
        </div>
        <div class="flex items-baseline">
          <p class="text-2xl font-semibold">0</p>
          <p class="text-sm text-gray-500 ml-2">за 24 часа</p>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center mb-2">
          <div class="h-10 w-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
            <i class="fas fa-bell"></i>
          </div>
          <h3 class="text-lg font-medium">События</h3>
        </div>
        <div class="flex items-baseline">
          <p class="text-2xl font-semibold">12</p>
          <p class="text-sm text-gray-500 ml-2">за 24 часа</p>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center mb-2">
          <div class="h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3">
            <i class="fas fa-plug"></i>
          </div>
          <h3 class="text-lg font-medium">Датчики</h3>
        </div>
        <div class="flex items-baseline">
          <p class="text-2xl font-semibold">8/8</p>
          <p class="text-sm text-gray-500 ml-2">активных</p>
        </div>
      </div>
    </div>

    <!-- План дома -->
    <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h3 class="text-lg font-medium mb-4">План дома</h3>
      <div class="bg-gray-100 rounded-lg p-4 min-h-[400px] relative">
        <!-- Упрощенная схема дома -->
        <div class="absolute w-[80%] h-[80%] border-2 border-gray-400 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <!-- Комнаты -->
          <div class="absolute top-0 left-0 w-1/2 h-1/2 border-r-2 border-b-2 border-gray-400 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-bed text-gray-600 text-xl mb-2"></i>
              <p class="text-sm">Спальня</p>
              <!-- Датчик движения -->
              <div class="absolute top-5 right-5 h-4 w-4 rounded-full bg-green-500 animate-pulse" title="Датчик движения активен"></div>
            </div>
          </div>
          
          <div class="absolute top-0 right-0 w-1/2 h-1/2 border-b-2 border-gray-400 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-couch text-gray-600 text-xl mb-2"></i>
              <p class="text-sm">Гостиная</p>
              <!-- Датчик движения -->
              <div class="absolute top-5 left-5 h-4 w-4 rounded-full bg-green-500" title="Датчик движения активен"></div>
              <!-- Датчик окна -->
              <div class="absolute bottom-5 right-5 h-4 w-4 rounded-full bg-green-500" title="Датчик окна активен"></div>
            </div>
          </div>
          
          <div class="absolute bottom-0 left-0 w-1/2 h-1/2 border-r-2 border-gray-400 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-utensils text-gray-600 text-xl mb-2"></i>
              <p class="text-sm">Кухня</p>
              <!-- Датчик дыма -->
              <div class="absolute top-5 right-5 h-4 w-4 rounded-full bg-green-500" title="Датчик дыма активен"></div>
            </div>
          </div>
          
          <div class="absolute bottom-0 right-0 w-1/2 h-1/2 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-door-open text-gray-600 text-xl mb-2"></i>
              <p class="text-sm">Прихожая</p>
              <!-- Датчик двери -->
              <div class="absolute top-5 left-5 h-4 w-4 rounded-full bg-green-500" title="Датчик двери активен"></div>
              <!-- Датчик движения -->
              <div class="absolute bottom-5 right-5 h-4 w-4 rounded-full bg-green-500" title="Датчик движения активен"></div>
            </div>
          </div>
          
          <!-- Входная дверь -->
          <div class="absolute bottom-[45%] right-[-10px] h-[10%] w-[10px] bg-gray-600"></div>
        </div>
        
        <!-- Легенда -->
        <div class="absolute bottom-2 left-2 bg-white p-2 rounded-lg shadow-sm text-xs">
          <div class="flex items-center mb-1">
            <div class="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span>Активный датчик</span>
          </div>
          <div class="flex items-center">
            <div class="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
            <span>Тревога</span>
          </div>
        </div>
      </div>
    </div>

    <!-- События безопасности -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-medium">Последние события безопасности</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">Время</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">Устройство</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">Событие</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">Расположение</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="event in securityEvents" :key="event.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(event.timestamp) }}</td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ event.device }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="getEventClass(event.type)">{{ event.event }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ event.location }}</td>
              <td class="px-6 py-4 text-sm">
                <span :class="event.status === 'Решено' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 py-1 rounded-full text-xs">
                  {{ event.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <button class="text-sm text-blue-600 hover:text-blue-800">
          Показать все события
        </button>
        <div class="flex items-center space-x-2">
          <button class="px-3 py-1 border rounded-md text-sm">Назад</button>
          <span class="text-sm text-gray-700">Страница 1 из 3</span>
          <button class="px-3 py-1 border rounded-md text-sm">Далее</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MonitoringView',
  
  setup() {
    // События безопасности
    const securityEvents = ref([
      {
        id: 1,
        timestamp: new Date(Date.now() - 1800000),
        device: 'Датчик движения',
        event: 'Движение обнаружено',
        type: 'info',
        location: 'Гостиная',
        status: 'Решено'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000),
        device: 'Датчик двери',
        event: 'Дверь открыта',
        type: 'info',
        location: 'Входная дверь',
        status: 'Решено'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 7200000),
        device: 'Датчик движения',
        event: 'Движение обнаружено',
        type: 'info',
        location: 'Спальня',
        status: 'Решено'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 43200000),
        device: 'Датчик окна',
        event: 'Окно открыто',
        type: 'warning',
        location: 'Гостиная',
        status: 'Отмечено'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 86400000),
        device: 'Датчик дыма',
        event: 'Повышенный уровень дыма',
        type: 'alert',
        location: 'Кухня',
        status: 'Решено'
      }
    ])
    
    // Форматирование даты
    const formatDate = (date) => {
      return new Date(date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Класс для типа события
    const getEventClass = (type) => {
      switch (type) {
        case 'info':
          return 'text-blue-600'
        case 'warning':
          return 'text-yellow-600'
        case 'alert':
          return 'text-red-600'
        default:
          return 'text-gray-700'
      }
    }
    
    return {
      securityEvents,
      formatDate,
      getEventClass
    }
  }
})
</script> 