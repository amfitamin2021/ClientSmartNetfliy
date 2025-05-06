<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Система сигнализации</h2>
      <div class="flex gap-3">
        <button 
          @click="toggleAlarmSystem" 
          class="px-4 py-2 rounded-lg flex items-center"
          :class="alarmSystemActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'"
        >
          <i class="fas mr-2" :class="alarmSystemActive ? 'fa-bell-slash' : 'fa-bell'"></i>
          {{ alarmSystemActive ? 'Деактивировать' : 'Активировать' }}
        </button>
      </div>
    </div>

    <!-- Статус системы -->
    <div class="mb-6 p-6 bg-white shadow-sm rounded-xl">
      <div class="flex items-center mb-2">
        <div :class="alarmSystemActive ? 'bg-green-500' : 'bg-gray-300'" class="h-8 w-8 rounded-full flex items-center justify-center mr-3">
          <i class="fas fa-shield-alt text-white"></i>
        </div>
        <h3 class="text-lg font-medium">
          Статус системы сигнализации:
          <span :class="alarmSystemActive ? 'text-green-600' : 'text-gray-500'">
            {{ alarmSystemActive ? 'Активна' : 'Отключена' }}
          </span>
        </h3>
      </div>
      
      <div class="mt-4 flex flex-wrap gap-3">
        <div :class="zones.perimeter ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'" class="p-3 rounded-lg border">
          <i :class="zones.perimeter ? 'text-green-500' : 'text-gray-400'" class="fas fa-home mr-2"></i>
          <span>Периметр</span>
        </div>
        <div :class="zones.interior ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'" class="p-3 rounded-lg border">
          <i :class="zones.interior ? 'text-green-500' : 'text-gray-400'" class="fas fa-couch mr-2"></i>
          <span>Внутренние помещения</span>
        </div>
        <div :class="zones.emergency ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'" class="p-3 rounded-lg border">
          <i :class="zones.emergency ? 'text-green-500' : 'text-gray-400'" class="fas fa-exclamation-triangle mr-2"></i>
          <span>Экстренные датчики</span>
        </div>
      </div>
    </div>

    <!-- Уведомление о тревоге, если есть -->
    <div v-if="activeAlarm" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 animate-pulse">
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle text-3xl mr-4"></i>
        <div>
          <h3 class="text-lg font-semibold">Внимание! Сработала сигнализация</h3>
          <p>{{ activeAlarm.message }} ({{ formatDate(activeAlarm.timestamp) }})</p>
        </div>
      </div>
      <div class="mt-4 flex gap-3 justify-end">
        <button @click="acknowledgeAlarm" class="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
          Принять уведомление
        </button>
        <button @click="disableAlarm" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Отключить тревогу
        </button>
      </div>
    </div>

    <!-- Настройки сигнализации -->
    <div class="mb-6">
      <div class="bg-white shadow-sm rounded-xl overflow-hidden">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-semibold">Настройки сигнализации</h3>
        </div>
        
        <div class="p-6">
          <!-- Режимы охраны -->
          <div class="mb-6">
            <h4 class="font-medium mb-3">Режим охраны</h4>
            <div class="flex flex-wrap gap-4">
              <button 
                @click="setAlarmMode('full')" 
                :class="alarmSystemMode === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
                class="px-4 py-2 rounded-lg"
              >
                <i class="fas fa-shield-alt mr-2"></i>Полная охрана
              </button>
              <button 
                @click="setAlarmMode('perimeter')" 
                :class="alarmSystemMode === 'perimeter' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
                class="px-4 py-2 rounded-lg"
              >
                <i class="fas fa-building mr-2"></i>Только периметр
              </button>
              <button 
                @click="setAlarmMode('night')" 
                :class="alarmSystemMode === 'night' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
                class="px-4 py-2 rounded-lg"
              >
                <i class="fas fa-moon mr-2"></i>Ночной режим
              </button>
              <button 
                @click="setAlarmMode('emergency')" 
                :class="alarmSystemMode === 'emergency' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
                class="px-4 py-2 rounded-lg"
              >
                <i class="fas fa-fire mr-2"></i>Только экстренные датчики
              </button>
            </div>
          </div>
          
          <!-- Время задержки -->
          <div class="mb-6">
            <h4 class="font-medium mb-3">Время задержки</h4>
            <div class="flex flex-wrap gap-6">
              <div class="w-full md:w-64">
                <label class="block text-sm text-gray-600 mb-1">Задержка выхода (сек)</label>
                <input 
                  type="number" 
                  v-model="settings.exitDelay"
                  min="0"
                  max="300"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div class="text-xs text-gray-500 mt-1">Время на выход из помещения после активации</div>
              </div>
              <div class="w-full md:w-64">
                <label class="block text-sm text-gray-600 mb-1">Задержка входа (сек)</label>
                <input 
                  type="number" 
                  v-model="settings.entryDelay"
                  min="0"
                  max="120"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div class="text-xs text-gray-500 mt-1">Время на отключение после входа</div>
              </div>
            </div>
          </div>
          
          <!-- Уведомления -->
          <div class="mb-6">
            <h4 class="font-medium mb-3">Уведомления</h4>
            <div class="flex flex-col gap-3">
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="settings.notifications.app" class="h-4 w-4 text-blue-600">
                <span class="ml-2">Уведомления в приложении</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="settings.notifications.push" class="h-4 w-4 text-blue-600">
                <span class="ml-2">Push-уведомления</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="settings.notifications.email" class="h-4 w-4 text-blue-600">
                <span class="ml-2">Уведомления по электронной почте</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" v-model="settings.notifications.siren" class="h-4 w-4 text-blue-600">
                <span class="ml-2">Включать сирену при тревоге</span>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end">
            <button @click="saveSettings" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Сохранить настройки
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- События сигнализации -->
    <div>
      <h3 class="text-lg font-semibold mb-4">История событий сигнализации</h3>
      <div class="bg-white shadow-sm rounded-xl overflow-hidden">
        <div v-if="alarmEvents.length === 0" class="p-6 text-center text-gray-500">
          <i class="fas fa-bell-slash text-gray-300 text-3xl mb-3"></i>
          <p>Нет записей о срабатывании сигнализации</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Время</th>
                <th class="px-4 py-3 text-left">Тип</th>
                <th class="px-4 py-3 text-left">Устройство</th>
                <th class="px-4 py-3 text-left">Сообщение</th>
                <th class="px-4 py-3 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in alarmEvents" :key="event.id" class="border-t">
                <td class="px-4 py-3">{{ formatDate(event.timestamp) }}</td>
                <td class="px-4 py-3">
                  <span 
                    class="inline-block px-2 py-1 rounded-full text-xs"
                    :class="getEventClass(event.priority)"
                  >
                    {{ event.type }}
                  </span>
                </td>
                <td class="px-4 py-3">{{ event.deviceName }}</td>
                <td class="px-4 py-3">{{ event.message }}</td>
                <td class="px-4 py-3">
                  <span 
                    class="inline-block px-2 py-1 rounded-full text-xs"
                    :class="event.acknowledged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                  >
                    {{ event.acknowledged ? 'Обработано' : 'Ожидает' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '../../store/deviceStore'

export default {
  name: 'AlarmsView',
  
  setup() {
    const deviceStore = useDeviceStore()
    
    // Состояние системы безопасности
    const alarmSystemActive = ref(false)
    const alarmSystemMode = ref('full') // full, perimeter, night, emergency
    const activeAlarm = ref(null)
    const loading = ref(false)
    const error = ref(null)
    
    // Настройки сигнализации
    const settings = ref({
      exitDelay: 30, // задержка на выход в секундах
      entryDelay: 20, // задержка на вход в секундах
      notifications: {
        app: true,      // уведомления в приложении
        push: true,     // push-уведомления
        email: false,   // email-уведомления
        siren: true     // включение сирены
      },
      autoArm: {
        enabled: false,
        time: '23:00',
        days: [1, 2, 3, 4, 5] // дни недели (0 = воскресенье, 1-6 = пн-сб)
      },
      autoDisarm: {
        enabled: false,
        time: '07:00',
        days: [1, 2, 3, 4, 5]
      },
      sensorActions: []  // действия при срабатывании датчиков
    })
    
    // Зоны сигнализации
    const zones = ref({
      perimeter: true,   // периметр (датчики на окнах и дверях)
      interior: true,    // внутренние помещения (датчики движения)
      emergency: true    // экстренные датчики (дым, затопление и т.д.)
    })
    
    // Список событий сигнализации
    const alarmEvents = ref([
      {
        id: 1,
        timestamp: new Date('2023-06-15T15:30:00'),
        type: 'motion',
        deviceId: 'motion-sensor-1',
        deviceName: 'Датчик движения (Гостиная)',
        message: 'Обнаружено движение в гостиной',
        acknowledged: true,
        priority: 'medium'
      },
      {
        id: 2,
        timestamp: new Date('2023-06-15T18:45:00'),
        type: 'contact',
        deviceId: 'contact-sensor-2',
        deviceName: 'Датчик открытия (Входная дверь)',
        message: 'Входная дверь открыта',
        acknowledged: true,
        priority: 'high'
      },
      {
        id: 3,
        timestamp: new Date('2023-06-16T10:15:00'),
        type: 'smoke',
        deviceId: 'smoke-sensor-1',
        deviceName: 'Датчик дыма (Кухня)',
        message: 'Обнаружен дым на кухне',
        acknowledged: false,
        priority: 'critical'
      }
    ])
    
    // Получение датчиков, доступных для настройки сигнализации
    const availableSensors = computed(() => {
      return deviceStore.devices.filter(device => 
        device.type === 'sensor' || 
        (device.category === 'SECURITY' && [
          'MOTION_SENSOR',
          'CONTACT_SENSOR',
          'SMOKE_SENSOR',
          'LEAK_SENSOR'
        ].includes(device.subType))
      )
    })
    
    // Получение статуса системы сигнализации
    const alarmSystemStatus = computed(() => {
      if (activeAlarm.value) return 'alarm'
      if (alarmSystemActive.value) return 'armed'
      return 'disarmed'
    })
    
    // Активные зоны (строкой)
    const activeZonesText = computed(() => {
      const active = []
      if (zones.value.perimeter) active.push('Периметр')
      if (zones.value.interior) active.push('Внутренние помещения')
      if (zones.value.emergency) active.push('Экстренные датчики')
      
      return active.join(', ')
    })
    
    // Проверка наличия неподтвержденных событий
    const hasUnacknowledgedEvents = computed(() => {
      return alarmEvents.value.some(event => !event.acknowledged)
    })
    
    // Получение названия режима сигнализации
    const getModeName = (mode) => {
      switch (mode) {
        case 'full': return 'Полная охрана'
        case 'perimeter': return 'Охрана периметра'
        case 'night': return 'Ночной режим'
        case 'emergency': return 'Только экстренные датчики'
        default: return 'Неизвестный режим'
      }
    }
    
    // Форматирование даты
    const formatDate = (date) => {
      if (!date) return ''
      
      if (typeof date === 'string') {
        date = new Date(date)
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    
    // Переключение состояния сигнализации
    const toggleAlarmSystem = async () => {
      // В реальном приложении здесь должен быть API-запрос для включения/выключения сигнализации
      alarmSystemActive.value = !alarmSystemActive.value
      
      if (alarmSystemActive.value) {
        // Имитация задержки выхода
        console.log(`Система охраны активирована (Режим: ${getModeName(alarmSystemMode.value)}, Задержка: ${settings.value.exitDelay} сек.)`)
      } else {
        // Деактивация тревоги, если она активна
        if (activeAlarm.value) {
          activeAlarm.value = null
        }
        console.log('Система охраны деактивирована')
      }
    }
    
    // Установка режима охраны
    const setAlarmMode = (mode) => {
      alarmSystemMode.value = mode
      
      // Настройка зон в зависимости от режима
      switch (mode) {
        case 'full':
          zones.value = { perimeter: true, interior: true, emergency: true }
          break
        case 'perimeter':
          zones.value = { perimeter: true, interior: false, emergency: true }
          break
        case 'night':
          zones.value = { perimeter: true, interior: false, emergency: true }
          break
        case 'emergency':
          zones.value = { perimeter: false, interior: false, emergency: true }
          break
      }
      
      console.log(`Режим охраны изменен: ${getModeName(mode)}`)
    }
    
    // Сохранение настроек
    const saveSettings = () => {
      // В реальном приложении здесь должен быть API-запрос для сохранения настроек
      console.log('Настройки сохранены')
    }
    
    // Симуляция срабатывания тревоги
    const simulateAlarm = (type) => {
      if (!alarmSystemActive.value) {
        error.value = 'Сигнализация не активирована. Активируйте систему для тестирования тревоги.'
        setTimeout(() => {
          error.value = null
        }, 3000)
        return
      }
      
      const alarmTypes = {
        motion: {
          message: 'Обнаружено движение в гостиной',
          deviceName: 'Датчик движения (Гостиная)',
          priority: 'medium',
          zone: 'interior',
          deviceId: availableSensors.value.find(s => s.subType === 'MOTION_SENSOR')?.id || 'motion-sensor-1'
        },
        contact: {
          message: 'Разбито окно в спальне',
          deviceName: 'Датчик разбития стекла (Спальня)',
          priority: 'high',
          zone: 'perimeter',
          deviceId: availableSensors.value.find(s => s.subType === 'CONTACT_SENSOR')?.id || 'contact-sensor-1'
        },
        smoke: {
          message: 'Обнаружен дым на кухне',
          deviceName: 'Датчик дыма (Кухня)',
          priority: 'critical',
          zone: 'emergency',
          deviceId: availableSensors.value.find(s => s.subType === 'SMOKE_SENSOR')?.id || 'smoke-sensor-1'
        }
      }
      
      const alarmInfo = alarmTypes[type]
      
      // Проверяем, включена ли зона, к которой относится датчик
      if ((alarmInfo.zone === 'interior' && !zones.value.interior) ||
          (alarmInfo.zone === 'perimeter' && !zones.value.perimeter) ||
          (alarmInfo.zone === 'emergency' && !zones.value.emergency)) {
        error.value = `Зона "${alarmInfo.zone === 'interior' ? 'Внутренние помещения' : 
                        alarmInfo.zone === 'perimeter' ? 'Периметр' : 
                        'Экстренные датчики'}" отключена. Тревога не сработает.`
        setTimeout(() => {
          error.value = null
        }, 3000)
        return
      }
      
      // Активируем соответствующий датчик
      triggerSensorByType(type, alarmInfo.deviceId);
      
      // Активируем тревогу
      activeAlarm.value = {
        type,
        message: alarmInfo.message,
        deviceName: alarmInfo.deviceName,
        timestamp: new Date()
      }
      
      // Добавляем событие в историю
      const newEvent = {
        id: alarmEvents.value.length + 1,
        timestamp: new Date(),
        type,
        deviceId: alarmInfo.deviceId,
        deviceName: alarmInfo.deviceName,
        message: alarmInfo.message,
        acknowledged: false,
        priority: alarmInfo.priority
      }
      
      alarmEvents.value.unshift(newEvent)
      
      console.log(`ТРЕВОГА: ${alarmInfo.message}`)
    }
    
    // Вспомогательная функция для активации датчика по типу
    const triggerSensorByType = async (type, deviceId) => {
      try {
        // Находим датчик по типу если deviceId не был передан
        if (!deviceId) {
          const sensors = availableSensors.value;
          let sensor;
          
          switch (type) {
            case 'motion':
              sensor = sensors.find(s => s.subType === 'MOTION_SENSOR');
              break;
            case 'contact':
              sensor = sensors.find(s => s.subType === 'CONTACT_SENSOR');
              break;
            case 'smoke':
              sensor = sensors.find(s => s.subType === 'SMOKE_SENSOR');
              break;
            case 'leak':
              sensor = sensors.find(s => s.subType === 'LEAK_SENSOR');
              break;
          }
          
          if (!sensor) {
            console.error(`Не найден датчик типа ${type}`);
            return;
          }
          
          deviceId = sensor.id;
        }
        
        // Активируем соответствующий датчик
        switch (type) {
          case 'motion':
            await deviceStore.updateMotionSensor(deviceId, true);
            setTimeout(async () => {
              await deviceStore.updateMotionSensor(deviceId, false);
            }, 10000);
            break;
          case 'contact':
            await deviceStore.updateContactSensor(deviceId, true);
            setTimeout(async () => {
              await deviceStore.updateContactSensor(deviceId, false);
            }, 10000);
            break;
          case 'smoke':
            await deviceStore.updateSmokeSensor(deviceId, true);
            setTimeout(async () => {
              await deviceStore.updateSmokeSensor(deviceId, false);
            }, 10000);
            break;
          case 'leak':
            await deviceStore.updateLeakSensor(deviceId, true);
            setTimeout(async () => {
              await deviceStore.updateLeakSensor(deviceId, false);
            }, 10000);
            break;
        }
      } catch (err) {
        console.error(`Ошибка при активации датчика ${type}:`, err);
      }
    }
    
    // Отключение тревоги
    const acknowledgeAlarm = () => {
      if (!activeAlarm.value) return
      
      // Находим событие в истории и отмечаем его как подтвержденное
      const event = alarmEvents.value.find(event => 
        event.timestamp.getTime() === activeAlarm.value.timestamp.getTime() && 
        event.type === activeAlarm.value.type
      )
      
      if (event) {
        event.acknowledged = true
      }
      
      activeAlarm.value = null
      console.log('Тревога отключена и подтверждена')
    }
    
    // Подтверждение события
    const acknowledgeEvent = (eventId) => {
      const event = alarmEvents.value.find(event => event.id === eventId)
      if (event) {
        event.acknowledged = true
      }
    }
    
    // Подтверждение всех событий
    const acknowledgeAllEvents = () => {
      alarmEvents.value.forEach(event => {
        event.acknowledged = true
      })
    }
    
    // Получение стиля события в зависимости от приоритета
    const getEventClass = (priority) => {
      switch (priority) {
        case 'critical': return 'bg-red-50 text-red-800'
        case 'high': return 'bg-orange-50 text-orange-800'
        case 'medium': return 'bg-yellow-50 text-yellow-800'
        case 'low': return 'bg-blue-50 text-blue-800'
        default: return 'bg-gray-50 text-gray-800'
      }
    }
    
    // Загрузка данных при монтировании компонента
    onMounted(async () => {
      loading.value = true
      
      try {
        // Загрузка датчиков
        await deviceStore.fetchDevices()
        
        // В реальном приложении здесь должна быть загрузка настроек сигнализации
        // и истории событий с сервера
        
        // Имитация загрузки данных
        setTimeout(() => {
          loading.value = false
        }, 1000)
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err)
        error.value = 'Не удалось загрузить данные. Пожалуйста, попробуйте позже.'
        loading.value = false
      }
    })
    
    return {
      alarmSystemActive,
      alarmSystemMode,
      alarmSystemStatus,
      activeZonesText,
      activeAlarm,
      settings,
      zones,
      alarmEvents,
      availableSensors,
      hasUnacknowledgedEvents,
      loading,
      error,
      getModeName,
      formatDate,
      toggleAlarmSystem,
      setAlarmMode,
      saveSettings,
      simulateAlarm,
      acknowledgeAlarm,
      acknowledgeEvent,
      acknowledgeAllEvents,
      getEventClass
    }
  }
}
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}

.status-disarmed {
  background-color: #9ca3af; /* gray-400 */
}

.status-armed {
  background-color: #10b981; /* green-500 */
}

.status-alarm {
  background-color: #ef4444; /* red-500 */
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.alarm-button {
  transition: all 0.3s;
}

.alarm-button-disarmed {
  @apply bg-red-500 hover:bg-red-600 text-white;
}

.alarm-button-armed {
  @apply bg-green-500 hover:bg-green-600 text-white;
}

.alarm-button-alarm {
  @apply bg-red-600 hover:bg-red-700 text-white;
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(0); }
  75% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}
</style> 