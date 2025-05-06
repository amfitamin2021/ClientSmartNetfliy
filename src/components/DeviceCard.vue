<template>
  <div 
    class="device-card" 
    :class="{ 
      'device-card--active': device.active,
      'device-card--offline': !device.online
    }"
  >
    <div class="device-card__header">
      <div class="device-card__icon">
        <component :is="deviceIcon" />
      </div>
      <div class="device-card__info">
        <h3 class="device-card__name">{{ device.name }}</h3>
        <p class="device-card__room">{{ device.room }}</p>
      </div>
      <div class="device-card__status">
        <span 
          class="device-card__status-indicator" 
          :class="{ 
            'device-card__status-indicator--active': device.active,
            'device-card__status-indicator--offline': !device.online
          }"
        ></span>
        <span class="device-card__status-text">{{ statusText }}</span>
      </div>
    </div>
    
    <div class="device-card__content">
      <!-- Для лампочек показываем яркость -->
      <template v-if="device.type === 'light'">
        <div class="device-card__brightness">
          <span class="device-card__property-label">Яркость:</span>
          <div class="device-card__brightness-control">
            <input 
              type="range" 
              min="0" 
              max="100" 
              :value="device.brightness || 0" 
              @input="updateBrightness"
              :disabled="!device.active || !device.online"
            >
            <span class="device-card__brightness-value">{{ device.brightness || 0 }}%</span>
          </div>
        </div>
        <!-- Если есть поддержка цвета -->
        <div v-if="device.hasColor" class="device-card__color">
          <span class="device-card__property-label">Цвет:</span>
          <div class="device-card__color-picker">
            <input 
              type="color" 
              :value="device.color || '#FFFFFF'" 
              @input="updateColor"
              :disabled="!device.active || !device.online"
            >
          </div>
        </div>
      </template>
      
      <!-- Для термостатов показываем температуру -->
      <template v-else-if="device.type === 'thermostat'">
        <div class="device-card__temperature">
          <span class="device-card__property-label">Текущая:</span>
          <span class="device-card__temperature-value">{{ device.currentTemperature || 0 }}°C</span>
        </div>
        <div class="device-card__temperature-target">
          <span class="device-card__property-label">Целевая:</span>
          <div class="device-card__temperature-control">
            <button 
              class="device-card__temperature-btn" 
              @click="decreaseTemperature"
              :disabled="!device.active || !device.online"
            >-</button>
            <span class="device-card__temperature-value">{{ device.targetTemperature || 20 }}°C</span>
            <button 
              class="device-card__temperature-btn" 
              @click="increaseTemperature"
              :disabled="!device.active || !device.online"
            >+</button>
          </div>
        </div>
      </template>
      
      <!-- Для сенсоров показываем их значения -->
      <template v-else-if="device.type === 'sensor'">
        <div class="device-card__sensor-value">
          <span class="device-card__property-label">{{ sensorTypeLabel }}:</span>
          <span class="device-card__sensor-value-text">{{ sensorValue }}</span>
        </div>
      </template>
      
      <!-- Для умных розеток показываем энергопотребление -->
      <template v-else-if="device.type === 'outlet'">
        <div class="device-card__power">
          <span class="device-card__property-label">Мощность:</span>
          <span class="device-card__power-value">{{ device.power || 0 }} Вт</span>
        </div>
        <div class="device-card__energy">
          <span class="device-card__property-label">Потребление:</span>
          <span class="device-card__energy-value">{{ device.energyToday || 0 }} кВт⋅ч</span>
        </div>
      </template>
      
      <!-- Для остальных устройств показываем базовую информацию -->
      <template v-else>
        <div class="device-card__details">
          <span class="device-card__property-label">Тип:</span>
          <span class="device-card__property-value">{{ deviceTypeName }}</span>
        </div>
      </template>
    </div>
    
    <div class="device-card__footer">
      <button 
        class="device-card__toggle-btn"
        @click="toggleDevice"
        :disabled="!device.online"
      >
        {{ device.active ? 'Выключить' : 'Включить' }}
      </button>
      <button 
        class="device-card__details-btn"
        @click="goToDetails"
      >
        Подробнее
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDevicesStore } from '@/store'
import LightbulbIcon from '@/components/icons/LightbulbIcon.vue'
import ThermostatIcon from '@/components/icons/ThermostatIcon.vue'
import SensorIcon from '@/components/icons/SensorIcon.vue'
import OutletIcon from '@/components/icons/OutletIcon.vue'
import DefaultDeviceIcon from '@/components/icons/DefaultDeviceIcon.vue'
import { useNotify } from '@/composables/useNotify'

export default defineComponent({
  name: 'DeviceCard',
  
  components: {
    LightbulbIcon,
    ThermostatIcon,
    SensorIcon,
    OutletIcon,
    DefaultDeviceIcon
  },
  
  props: {
    device: {
      type: Object,
      required: true
    }
  },
  
  setup(props) {
    const router = useRouter()
    const devicesStore = useDevicesStore()
    const notify = useNotify()
    
    // Определяем иконку в зависимости от типа устройства
    const deviceIcon = computed(() => {
      switch(props.device.type) {
        case 'light': return 'lightbulb-icon'
        case 'thermostat': return 'thermostat-icon'
        case 'sensor': return 'sensor-icon'
        case 'outlet': return 'outlet-icon'
        default: return 'default-device-icon'
      }
    })
    
    // Определяем текст статуса
    const statusText = computed(() => {
      if (!props.device.online) return 'Не в сети'
      return props.device.active ? 'Включено' : 'Выключено'
    })
    
    // Человекочитаемое имя типа устройства
    const deviceTypeName = computed(() => {
      const typeMap = {
        'light': 'Освещение',
        'thermostat': 'Термостат',
        'sensor': 'Датчик',
        'outlet': 'Розетка',
        'switch': 'Выключатель',
        'camera': 'Камера',
        'lock': 'Замок',
        'speaker': 'Колонка'
      }
      return typeMap[props.device.type] || 'Устройство'
    })
    
    // Для сенсоров определяем тип и отображаемое значение
    const sensorTypeLabel = computed(() => {
      const sensorTypeMap = {
        'temperature': 'Температура',
        'humidity': 'Влажность',
        'motion': 'Движение',
        'door': 'Дверь',
        'window': 'Окно',
        'smoke': 'Дым',
        'water': 'Вода',
        'light': 'Освещенность'
      }
      return sensorTypeMap[props.device.sensorType] || 'Значение'
    })
    
    const sensorValue = computed(() => {
      if (!props.device.value) return 'Нет данных'
      
      switch(props.device.sensorType) {
        case 'temperature':
          return `${props.device.value}°C`
        case 'humidity':
          return `${props.device.value}%`
        case 'light':
          return `${props.device.value} лк`
        case 'motion':
          return props.device.value ? 'Обнаружено' : 'Не обнаружено'
        case 'door':
        case 'window':
          return props.device.value ? 'Открыто' : 'Закрыто'
        case 'smoke':
        case 'water':
          return props.device.value ? 'Тревога!' : 'Норма'
        default:
          return props.device.value
      }
    })
    
    // Методы управления устройством
    
    // Включить/выключить устройство
    const toggleDevice = () => {
      devicesStore.toggleDevice(props.device.id, !props.device.active)
        .then(() => {
          notify.success(`Устройство ${props.device.active ? 'выключено' : 'включено'}`);
        })
        .catch((error) => {
          console.error('Ошибка при управлении устройством:', error);
          notify.error('Не удалось изменить состояние устройства');
        });
    }
    
    // Обновить яркость
    const updateBrightness = (event) => {
      const brightness = parseInt(event.target.value);
      devicesStore.updateLightBrightness(props.device.id, brightness)
        .then(() => {
          // Можно добавить нотификацию, но для ползунка это может быть избыточно
        })
        .catch((error) => {
          console.error('Ошибка при изменении яркости:', error);
          notify.error('Не удалось изменить яркость');
        });
    }
    
    // Обновить цвет
    const updateColor = (event) => {
      const color = event.target.value;
      devicesStore.updateLightColor(props.device.id, color)
        .then(() => {
          notify.success('Цвет изменен');
        })
        .catch((error) => {
          console.error('Ошибка при изменении цвета:', error);
          notify.error('Не удалось изменить цвет');
        });
    }
    
    // Увеличить целевую температуру
    const increaseTemperature = () => {
      const currentTemp = props.device.targetTemperature || 20
      devicesStore.updateDeviceProperty(props.device.id, 'targetTemperature', currentTemp + 1)
    }
    
    // Уменьшить целевую температуру
    const decreaseTemperature = () => {
      const currentTemp = props.device.targetTemperature || 20
      devicesStore.updateDeviceProperty(props.device.id, 'targetTemperature', currentTemp - 1)
    }
    
    // Перейти на страницу деталей устройства
    const goToDetails = () => {
      router.push(`/devices/${props.device.id}`)
    }
    
    return {
      deviceIcon,
      statusText,
      deviceTypeName,
      sensorTypeLabel,
      sensorValue,
      toggleDevice,
      updateBrightness,
      updateColor,
      increaseTemperature,
      decreaseTemperature,
      goToDetails
    }
  }
})
</script>

<style scoped>
.device-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.device-card--active {
  box-shadow: 0 4px 15px rgba(0, 120, 255, 0.15);
  border-left: 3px solid var(--primary-color);
}

.device-card--offline {
  opacity: 0.7;
}

.device-card__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.device-card__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--secondary-bg);
  border-radius: 50%;
  margin-right: 12px;
}

.device-card__info {
  flex: 1;
}

.device-card__name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.device-card__room {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0 0 0;
}

.device-card__status {
  display: flex;
  align-items: center;
}

.device-card__status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--gray-400);
  margin-right: 6px;
}

.device-card__status-indicator--active {
  background-color: var(--success-color);
}

.device-card__status-indicator--offline {
  background-color: var(--gray-400);
}

.device-card__status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.device-card__content {
  flex: 1;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.device-card__property-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 8px;
}

.device-card__brightness,
.device-card__color,
.device-card__temperature,
.device-card__temperature-target,
.device-card__sensor-value,
.device-card__power,
.device-card__energy,
.device-card__details {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.device-card__brightness-control,
.device-card__temperature-control {
  flex: 1;
  display: flex;
  align-items: center;
}

input[type="range"] {
  flex: 1;
  height: 4px;
  appearance: none;
  background-color: var(--border-color);
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary-color);
  cursor: pointer;
}

.device-card__brightness-value,
.device-card__temperature-value,
.device-card__sensor-value-text,
.device-card__power-value,
.device-card__energy-value,
.device-card__property-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-left: 8px;
}

.device-card__temperature-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background-color: var(--secondary-bg);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.device-card__temperature-btn:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
}

.device-card__footer {
  display: flex;
  gap: 10px;
}

.device-card__toggle-btn,
.device-card__details-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.device-card__toggle-btn {
  background-color: var(--primary-color);
  color: white;
}

.device-card__toggle-btn:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.device-card__details-btn {
  background-color: var(--secondary-bg);
  color: var(--text-primary);
}

.device-card__details-btn:hover {
  background-color: var(--border-color);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.device-card__color-picker input[type="color"] {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
}
</style> 