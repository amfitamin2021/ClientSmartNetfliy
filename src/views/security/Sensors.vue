<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Датчики безопасности</h2>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" @click="refreshSensors">
          <i class="fas fa-sync-alt mr-2"></i>Обновить
        </button>
        <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
          <i class="fas fa-plus mr-2"></i>Добавить датчик
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

    <!-- Сообщение, если нет датчиков -->
    <div v-else-if="sensors.length === 0" class="bg-gray-50 p-8 rounded-lg text-center">
      <i class="fas fa-bullseye text-gray-300 text-5xl mb-4"></i>
      <h3 class="text-xl font-medium mb-2">Датчики не найдены</h3>
      <p class="text-gray-600 mb-4">В вашей системе пока нет датчиков безопасности. Добавьте новые устройства на странице устройств.</p>
      <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center">
        <i class="fas fa-plus mr-2"></i>Добавить устройства
      </router-link>
    </div>

    <!-- Сетка датчиков -->
    <div v-else>
      <!-- Датчики движения -->
      <div v-if="motionSensors.length > 0" class="mb-8">
        <h3 class="text-lg font-medium mb-4">Датчики движения</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="sensor in motionSensors" :key="sensor.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-semibold">{{ sensor.name }}</h3>
                  <p class="text-sm text-gray-600">{{ sensor.room }}</p>
                </div>
                <div class="flex items-center">
                  <span class="inline-block h-2 w-2 rounded-full mr-1" :class="sensor.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                  <span class="text-xs text-gray-600">{{ sensor.online ? 'Онлайн' : 'Офлайн' }}</span>
                </div>
              </div>

              <div class="mb-4 flex justify-center">
                <div class="text-center">
                  <div class="h-24 w-24 rounded-full flex items-center justify-center mb-2" 
                    :class="isMotionDetected(sensor) ? 'bg-red-100' : 'bg-gray-100'">
                    <i class="fas fa-running text-4xl" :class="isMotionDetected(sensor) ? 'text-red-500' : 'text-gray-500'"></i>
                  </div>
                  <p class="font-medium" :class="isMotionDetected(sensor) ? 'text-red-500' : 'text-gray-500'">
                    {{ isMotionDetected(sensor) ? 'Движение обнаружено' : 'Движения нет' }}
                  </p>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm">
                <div class="flex items-center text-gray-700">
                  <i class="fas fa-battery-three-quarters mr-1"></i>
                  <span>{{ getBatteryLevel(sensor) }}%</span>
                </div>
                
                <button 
                  @click="toggleSensor(sensor)" 
                  :class="sensor.active ? 'text-blue-600' : 'text-gray-400'" 
                  class="flex items-center"
                  :disabled="!sensor.online && !sensor.isVirtual"
                >
                  <i :class="sensor.active ? 'fas fa-toggle-on text-lg' : 'fas fa-toggle-off text-lg'"></i>
                  <span class="ml-1">{{ sensor.active ? 'Активен' : 'Отключен' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Датчики открытия -->
      <div v-if="contactSensors.length > 0" class="mb-8">
        <h3 class="text-lg font-medium mb-4">Датчики открытия дверей/окон</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="sensor in contactSensors" :key="sensor.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-semibold">{{ sensor.name }}</h3>
                  <p class="text-sm text-gray-600">{{ sensor.room }}</p>
                </div>
                <div class="flex items-center">
                  <span class="inline-block h-2 w-2 rounded-full mr-1" :class="sensor.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                  <span class="text-xs text-gray-600">{{ sensor.online ? 'Онлайн' : 'Офлайн' }}</span>
                </div>
              </div>

              <div class="mb-4 flex justify-center">
                <div class="text-center">
                  <div class="h-24 w-24 rounded-full flex items-center justify-center mb-2" 
                    :class="isContactOpen(sensor) ? 'bg-red-100' : 'bg-green-100'">
                    <i class="fas text-4xl" 
                      :class="[isContactOpen(sensor) ? 'fa-door-open text-red-500' : 'fa-door-closed text-green-500']"></i>
                  </div>
                  <p class="font-medium" :class="isContactOpen(sensor) ? 'text-red-500' : 'text-green-500'">
                    {{ isContactOpen(sensor) ? 'Открыто' : 'Закрыто' }}
                  </p>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm">
                <div class="flex items-center text-gray-700">
                  <i class="fas fa-battery-three-quarters mr-1"></i>
                  <span>{{ getBatteryLevel(sensor) }}%</span>
                </div>
                
                <button 
                  @click="toggleSensor(sensor)" 
                  :class="sensor.active ? 'text-blue-600' : 'text-gray-400'" 
                  class="flex items-center"
                  :disabled="!sensor.online && !sensor.isVirtual"
                >
                  <i :class="sensor.active ? 'fas fa-toggle-on text-lg' : 'fas fa-toggle-off text-lg'"></i>
                  <span class="ml-1">{{ sensor.active ? 'Активен' : 'Отключен' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Датчики дыма -->
      <div v-if="smokeSensors.length > 0" class="mb-8">
        <h3 class="text-lg font-medium mb-4">Датчики дыма</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="sensor in smokeSensors" :key="sensor.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-semibold">{{ sensor.name }}</h3>
                  <p class="text-sm text-gray-600">{{ sensor.room }}</p>
                </div>
                <div class="flex items-center">
                  <span class="inline-block h-2 w-2 rounded-full mr-1" :class="sensor.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                  <span class="text-xs text-gray-600">{{ sensor.online ? 'Онлайн' : 'Офлайн' }}</span>
                </div>
              </div>

              <div class="mb-4 flex justify-center">
                <div class="text-center">
                  <div class="h-24 w-24 rounded-full flex items-center justify-center mb-2" 
                    :class="isSmokeDetected(sensor) ? 'bg-red-100' : 'bg-gray-100'">
                    <i class="fas fa-smog text-4xl" :class="isSmokeDetected(sensor) ? 'text-red-500' : 'text-gray-500'"></i>
                  </div>
                  <p class="font-medium" :class="isSmokeDetected(sensor) ? 'text-red-500' : 'text-gray-500'">
                    {{ isSmokeDetected(sensor) ? 'Дым обнаружен!' : 'Нет дыма' }}
                  </p>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm">
                <div class="flex items-center text-gray-700">
                  <i class="fas fa-battery-three-quarters mr-1"></i>
                  <span>{{ getBatteryLevel(sensor) }}%</span>
                </div>
                
                <button 
                  @click="toggleSensor(sensor)" 
                  :class="sensor.active ? 'text-blue-600' : 'text-gray-400'" 
                  class="flex items-center"
                  :disabled="!sensor.online && !sensor.isVirtual"
                >
                  <i :class="sensor.active ? 'fas fa-toggle-on text-lg' : 'fas fa-toggle-off text-lg'"></i>
                  <span class="ml-1">{{ sensor.active ? 'Активен' : 'Отключен' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Датчики протечки -->
      <div v-if="leakSensors.length > 0" class="mb-8">
        <h3 class="text-lg font-medium mb-4">Датчики протечки</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="sensor in leakSensors" :key="sensor.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
            <div class="p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-semibold">{{ sensor.name }}</h3>
                  <p class="text-sm text-gray-600">{{ sensor.room }}</p>
                </div>
                <div class="flex items-center">
                  <span class="inline-block h-2 w-2 rounded-full mr-1" :class="sensor.online ? 'bg-green-500' : 'bg-gray-400'"></span>
                  <span class="text-xs text-gray-600">{{ sensor.online ? 'Онлайн' : 'Офлайн' }}</span>
                </div>
              </div>

              <div class="mb-4 flex justify-center">
                <div class="text-center">
                  <div class="h-24 w-24 rounded-full flex items-center justify-center mb-2" 
                    :class="isLeakDetected(sensor) ? 'bg-blue-100' : 'bg-gray-100'">
                    <i class="fas fa-tint text-4xl" :class="isLeakDetected(sensor) ? 'text-blue-500' : 'text-gray-500'"></i>
                  </div>
                  <p class="font-medium" :class="isLeakDetected(sensor) ? 'text-blue-500' : 'text-gray-500'">
                    {{ isLeakDetected(sensor) ? 'Протечка обнаружена!' : 'Нет протечки' }}
                  </p>
                </div>
              </div>

              <div class="flex justify-between items-center text-sm">
                <div class="flex items-center text-gray-700">
                  <i class="fas fa-battery-three-quarters mr-1"></i>
                  <span>{{ getBatteryLevel(sensor) }}%</span>
                </div>
                
                <button 
                  @click="toggleSensor(sensor)" 
                  :class="sensor.active ? 'text-blue-600' : 'text-gray-400'" 
                  class="flex items-center"
                  :disabled="!sensor.online && !sensor.isVirtual"
                >
                  <i :class="sensor.active ? 'fas fa-toggle-on text-lg' : 'fas fa-toggle-off text-lg'"></i>
                  <span class="ml-1">{{ sensor.active ? 'Активен' : 'Отключен' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- История срабатывания датчиков -->
    <SensorHistory />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '../../store/deviceStore'
import SensorHistory from '../../components/security/SensorHistory.vue'

export default defineComponent({
  name: 'SensorsView',
  
  components: {
    SensorHistory
  },
  
  setup() {
    const deviceStore = useDeviceStore()
    
    // Флаги загрузки и ошибок
    const loading = ref(true)
    const error = ref(null)
    
    // Получение списка всех датчиков безопасности
    const sensors = computed(() => {
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
    
    // Фильтрация датчиков по типам
    const motionSensors = computed(() => {
      return sensors.value.filter(sensor => 
        sensor.subType === 'MOTION_SENSOR' || 
        sensor.rawProperties?.tb_sensorType === 'motion'
      )
    })
    
    const contactSensors = computed(() => {
      return sensors.value.filter(sensor => 
        sensor.subType === 'CONTACT_SENSOR' || 
        sensor.rawProperties?.tb_sensorType === 'contact'
      )
    })
    
    const smokeSensors = computed(() => {
      return sensors.value.filter(sensor => 
        sensor.subType === 'SMOKE_SENSOR' || 
        sensor.rawProperties?.tb_sensorType === 'smoke'
      )
    })
    
    const leakSensors = computed(() => {
      return sensors.value.filter(sensor => 
        sensor.subType === 'LEAK_SENSOR' || 
        sensor.rawProperties?.tb_sensorType === 'leak'
      )
    })
    
    // Проверка состояния датчиков
    const isMotionDetected = (sensor) => {
      return sensor.active && (
        sensor.rawProperties?.tb_motion === 'true' ||
        sensor.rawProperties?.motion === 'true'
      )
    }
    
    const isContactOpen = (sensor) => {
      return sensor.active && (
        sensor.rawProperties?.tb_contact === 'open' ||
        sensor.rawProperties?.contact === 'open'
      )
    }
    
    const isSmokeDetected = (sensor) => {
      return sensor.active && (
        sensor.rawProperties?.tb_smoke === 'true' ||
        sensor.rawProperties?.smoke === 'true'
      )
    }
    
    const isLeakDetected = (sensor) => {
      return sensor.active && (
        sensor.rawProperties?.tb_leak === 'true' ||
        sensor.rawProperties?.leak === 'true'
      )
    }
    
    // Получение уровня заряда батареи
    const getBatteryLevel = (sensor) => {
      const battery = parseInt(sensor.rawProperties?.tb_battery || sensor.rawProperties?.battery || '70')
      return battery
    }
    
    // Переключение активного состояния датчика
    const toggleSensor = async (sensor) => {
      try {
        await deviceStore.toggleDevice(sensor.id, !sensor.active)
      } catch (err) {
        console.error('Ошибка при переключении датчика:', err)
        error.value = 'Не удалось изменить состояние датчика'
        setTimeout(() => {
          error.value = null
        }, 3000)
      }
    }
    
    // Обновление списка датчиков
    const refreshSensors = async () => {
      loading.value = true
      error.value = null
      
      try {
        await deviceStore.fetchDevices()
      } catch (err) {
        console.error('Ошибка при загрузке устройств:', err)
        error.value = 'Не удалось загрузить данные о датчиках. Пожалуйста, попробуйте позже.'
      } finally {
        loading.value = false
      }
    }
    
    // При монтировании компонента загружаем данные
    onMounted(() => {
      refreshSensors()
    })
    
    return {
      sensors,
      motionSensors,
      contactSensors,
      smokeSensors,
      leakSensors,
      loading,
      error,
      isMotionDetected,
      isContactOpen,
      isSmokeDetected,
      isLeakDetected,
      getBatteryLevel,
      toggleSensor,
      refreshSensors
    }
  }
})
</script> 