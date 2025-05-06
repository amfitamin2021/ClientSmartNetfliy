<template>
  <div 
    class="device-card h-full bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 flex flex-col"
    :class="{ 
      'border-blue-500 shadow-md': isActive,
      'opacity-80': !device?.online
    }"
  >
    <div class="p-3 border-b border-gray-100 flex items-center">
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2">
        <i :class="['fas', getDeviceIcon]"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-gray-900 truncate">{{ device?.name || 'Устройство' }}</h3>
        <p class="text-xs text-gray-500 truncate" v-if="device?.room">{{ device.room }}</p>
      </div>
      <div class="flex items-center">
        <span 
          class="inline-block w-2 h-2 rounded-full mr-1"
          :class="{ 
            'bg-green-500': device?.online && device?.active,
            'bg-blue-500': device?.online && !device?.active,
            'bg-red-500': !device?.online
          }"
        ></span>
        <span class="text-xs text-gray-500">{{ device?.online ? 'Онлайн' : 'Не в сети' }}</span>
      </div>
    </div>
    
    <div class="p-3 flex-1 flex flex-col justify-center" @click="toggleActive">
      <!-- Ошибка загрузки -->
      <div v-if="error" class="p-4 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-2">
          <i class="fas fa-exclamation-circle text-lg"></i>
        </div>
        <p class="text-sm font-medium text-gray-900">Ошибка загрузки</p>
        <p class="text-xs text-gray-500 mb-3">{{ error }}</p>
        <button @click.stop="loadDevice" class="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Повторить
        </button>
      </div>
      
      <!-- Загрузка -->
      <div v-else-if="loading" class="flex items-center justify-center p-8">
        <div class="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
      
      <!-- Контент виджета в зависимости от типа устройства -->
      <div v-else-if="device" class="space-y-3 flex-1 flex flex-col justify-center">
        <!-- Освещение - Умная лампочка -->
        <template v-if="device.type === 'smart_bulb' || (device.category === 'LIGHTING' && device.subType === 'SMART_BULB')">
          <div class="flex flex-col items-center justify-center">
            <div class="relative w-32 h-32 mb-4 flex items-center justify-center">
              <!-- Фоновый круг -->
              <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <!-- Светящаяся лампочка с цветом -->
                <div class="w-20 h-20 rounded-full flex items-center justify-center"
                  :style="{ 
                    backgroundColor: device.active ? (device.rawProperties?.tb_color || '#FFD700') : 'transparent',
                    boxShadow: device.active ? `0 0 15px 5px ${device.rawProperties?.tb_color || '#FFD700'}` : 'none',
                    opacity: device.active ? (device.rawProperties?.tb_brightness || 100) / 100 : 0.2
                  }">
                  <i class="fas fa-lightbulb text-4xl" 
                    :class="device.active ? 'text-yellow-400' : 'text-gray-400'"></i>
                </div>
            </div>
          </div>
          
            <div class="flex items-center justify-between w-full mt-2">
              <div class="text-sm font-medium">Состояние</div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  class="sr-only peer" 
                  :checked="device.active" 
                  @change="toggleDevice"
                  :disabled="!device.online"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
          </div>
          
            <div v-if="device.active" class="w-full mt-3">
              <div class="flex justify-between text-sm">
                <span>Яркость:</span>
                <span>{{ device.rawProperties?.tb_brightness || 100 }}%</span>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Световая лента -->
        <template v-else-if="device.type === 'light_strip' || device.subType === 'LIGHT_STRIP'">
          <div class="flex flex-col items-center justify-center">
            <div class="relative w-32 h-32 mb-4 flex items-center justify-center">
              <!-- Фоновый прямоугольник для ленты -->
              <div class="w-28 h-8 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                <!-- Светящаяся лента с цветом -->
                <div class="w-full h-full flex items-center justify-center"
                  :style="{ 
                    backgroundColor: device.active ? (device.rawProperties?.tb_color || '#FFD700') : 'transparent',
                    boxShadow: device.active ? `0 0 10px 2px ${device.rawProperties?.tb_color || '#FFD700'}` : 'none',
                    opacity: device.active ? (device.rawProperties?.tb_brightness || 100) / 100 : 0.2
                  }">
                  <i class="fas fa-stream text-xl" 
                    :class="device.active ? 'text-white' : 'text-gray-400'"></i>
          </div>
          </div>
          </div>
            
            <div class="flex items-center justify-between w-full mt-2">
              <div class="text-sm font-medium">Состояние</div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  class="sr-only peer" 
                  :checked="device.active" 
                  @change="toggleDevice"
                  :disabled="!device.online"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
          </div>
          
            <div v-if="device.active" class="w-full mt-3">
              <div class="flex justify-between text-sm">
                <span>Яркость:</span>
                <span>{{ device.rawProperties?.tb_brightness || 100 }}%</span>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Датчик температуры -->
        <template v-else-if="device.type === 'temperature_sensor' || (device.category === 'CLIMATE' && device.subType === 'TEMPERATURE_SENSOR')">
          <div class="flex flex-col items-center">
            <div class="circular-indicator">
              <svg viewBox="0 0 100 100">
                <circle class="background-circle" cx="50" cy="50" r="45" fill="none" stroke-width="10" />
                <circle class="active-circle" cx="50" cy="50" r="45" fill="none" stroke-width="10"
                  :style="{ 
                    'stroke-dasharray': '283', 
                    'stroke-dashoffset': getTemperatureDashOffset,
                    'stroke': getTemperatureColor
                  }" 
                />
              </svg>
              <div class="value" :style="{ color: getTemperatureColor }">
                {{ device.rawProperties?.tb_temperature || '0' }}°C
            </div>
          </div>
          
            <p class="text-sm font-medium text-center mt-4" :style="{ color: getTemperatureColor }">
              {{ getTemperatureLevelText }}
            </p>
            
            <div class="text-xs text-gray-500 text-center mt-1">
              Идеальная температура: 20-24°C
          </div>
          
            <div class="battery-indicator mt-3" :class="getBatteryColorClass">
              <i class="fas" :class="getBatteryIcon"></i>
              <span>{{ getBatteryLevel }}%</span>
            </div>
          </div>
        </template>
        
        <!-- Датчик влажности -->
        <template v-else-if="device.type === 'humidity_sensor' || (device.category === 'CLIMATE' && device.subType === 'HUMIDITY_SENSOR')">
          <div class="flex flex-col items-center">
            <div class="circular-indicator">
              <svg viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="humidity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color: #ef4444" />
                    <stop offset="50%" style="stop-color: #22c55e" />
                    <stop offset="100%" style="stop-color: #3b82f6" />
                  </linearGradient>
                </defs>
                <circle class="background-circle" cx="50" cy="50" r="45" fill="none" stroke-width="10" />
                <circle class="active-circle" cx="50" cy="50" r="45" fill="none" stroke-width="10"
                  stroke="url(#humidity-gradient)"
                  :style="{ 
                    'stroke-dasharray': '283', 
                    'stroke-dashoffset': getHumidityDashOffset
                  }" 
                />
              </svg>
              <div class="value">
                {{ device.rawProperties?.tb_humidity || '0' }}%
            </div>
          </div>
          
            <p class="text-sm font-medium text-center mt-4" :class="getHumidityColorClass">
              {{ getHumidityLevelText }}
            </p>
            
            <div class="text-xs text-gray-500 text-center mt-1">
              Оптимальная влажность: 40-60%
          </div>
          
            <div class="battery-indicator mt-3" :class="getBatteryColorClass">
              <i class="fas" :class="getBatteryIcon"></i>
              <span>{{ getBatteryLevel }}%</span>
            </div>
          </div>
        </template>
        
        <!-- TV -->
        <template v-else-if="device.type === 'tv' || (device.category === 'APPLIANCES' && device.subType === 'TV')">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 flex items-center justify-center">
                  <i class="fas fa-tv text-xl" :class="device.active ? 'text-blue-500' : 'text-gray-300'"></i>
            </div>
                <div>
                  <div class="text-sm">Состояние</div>
                  <div class="text-xs font-medium">{{ device.active ? 'Включен' : 'Выключен' }}</div>
          </div>
          </div>
          
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  class="sr-only peer" 
                  :checked="device.active" 
                  @change="toggleDevice"
                  :disabled="!device.online"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
          </div>
            
            <div v-if="device.active" class="grid grid-cols-2 gap-2 mt-2">
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Канал</div>
                <div class="text-sm font-medium">{{ device.rawProperties?.tb_channel || '1' }}</div>
            </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Источник</div>
                <div class="text-sm font-medium">{{ getSourceLabel }}</div>
          </div>
            </div>
          </div>
        </template>
        
        <!-- Стандартный виджет для других типов устройств -->
        <template v-else>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-10 h-10 flex items-center justify-center">
                <i class="fas text-xl" :class="[getDeviceIcon, device.active ? 'text-blue-500' : 'text-gray-300']"></i>
            </div>
              <div>
                <div class="text-sm">Состояние</div>
                <div class="text-xs font-medium">{{ device.active ? 'Включено' : 'Выключено' }}</div>
              </div>
            </div>
            
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer" 
                :checked="device.active" 
                @change="toggleDevice"
                :disabled="!device.online"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </template>
      </div>
    </div>
    
    <div class="border-t border-gray-100 p-2 flex justify-end gap-2">
      <button @click.stop="refreshDevice" class="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="Обновить данные">
        <i class="fas fa-sync-alt text-sm" :class="{ 'animate-spin': refreshing }"></i>
      </button>
      <button @click.stop="removeWidget" class="p-1 text-gray-500 hover:text-red-600 transition-colors" title="Удалить виджет">
        <i class="fas fa-times text-sm"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDeviceStore } from '../../store/deviceStore';
import { useDashboardStore } from '../../store/dashboardStore';

const deviceStore = useDeviceStore();
const dashboardStore = useDashboardStore();

// Пропсы
const props = defineProps({
  widgetId: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  }
});

// Состояние
const loading = ref(true);
const error = ref(null);
const device = ref(null);
const isActive = ref(false);
const refreshing = ref(false);

// Проверим deviceId
if (!props.deviceId) {
  error.value = 'ID устройства не указан';
  loading.value = false;
}

// Иконки для разных типов устройств
const getDeviceIcon = computed(() => {
  if (!device.value) return 'fa-question';
  
  const category = device.value.category;
  const subType = device.value.subType;
  
  if (category === 'CLIMATE' && subType === 'TEMPERATURE_SENSOR') {
        return 'fa-thermometer-half';
  } else if (category === 'CLIMATE' && subType === 'HUMIDITY_SENSOR') {
    return 'fa-tint';
  } else if (category === 'LIGHTING') {
    return 'fa-lightbulb';
  } else if (subType === 'LIGHT_STRIP') {
    return 'fa-stream';
  } else if (category === 'APPLIANCES' && subType === 'TV') {
        return 'fa-tv';
  } else if (subType === 'DOOR_LOCK') {
    return 'fa-lock';
  }
  
  return 'fa-microchip';
});

// Данные температуры
const getTemperatureDashOffset = computed(() => {
  if (!device.value || (device.value.type !== 'temperature_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'TEMPERATURE_SENSOR'))) return 0;
  const temp = parseFloat(device.value.rawProperties?.tb_temperature || 0);
  const percentage = Math.min(Math.max((temp / 40) * 100, 0), 100);
  return ((100 - percentage) / 100) * 283;
});

const getTemperatureColor = computed(() => {
  if (!device.value || !device.value.rawProperties?.tb_temperature) return '#22c55e'; // normal - green (default)
  const temp = parseFloat(device.value.rawProperties.tb_temperature);
  if (temp < 16) return '#3b82f6'; // cold - blue
  if (temp < 20) return '#60a5fa'; // cool - light blue
  if (temp < 24) return '#22c55e'; // normal - green
  if (temp < 28) return '#eab308'; // warm - yellow
  return '#ef4444'; // hot - red
});

const getTemperatureColorClass = computed(() => {
  if (!device.value || (device.value.type !== 'temperature_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'TEMPERATURE_SENSOR'))) return 'temp-normal';
  const temp = parseFloat(device.value.rawProperties?.tb_temperature || 0);
  if (temp < 16) return 'temp-cold';
  if (temp < 20) return 'temp-cool';
  if (temp < 24) return 'temp-normal';
  if (temp < 28) return 'temp-warm';
  return 'temp-hot';
});

const getTemperatureLevelText = computed(() => {
  if (!device.value || (device.value.type !== 'temperature_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'TEMPERATURE_SENSOR'))) return 'Нет данных';
  const temp = parseFloat(device.value.rawProperties?.tb_temperature || 0);
  if (temp < 16) return 'Холодно';
  if (temp < 20) return 'Прохладно';
  if (temp < 24) return 'Нормально';
  if (temp < 28) return 'Тепло';
  return 'Жарко';
});

// Данные влажности
const getHumidityDashOffset = computed(() => {
  if (!device.value || (device.value.type !== 'humidity_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'HUMIDITY_SENSOR'))) return 0;
  const humidity = parseFloat(device.value.rawProperties?.tb_humidity || 0);
  const percentage = Math.min(Math.max(humidity, 0), 100);
  return ((100 - percentage) / 100) * 283;
});

const getHumidityColorClass = computed(() => {
  if (!device.value || (device.value.type !== 'humidity_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'HUMIDITY_SENSOR'))) return 'humidity-normal';
  const humidity = parseFloat(device.value.rawProperties?.tb_humidity || 0);
  if (humidity < 30) return 'humidity-dry';
  if (humidity < 40) return 'humidity-low';
  if (humidity < 60) return 'humidity-normal';
  if (humidity < 70) return 'humidity-high';
  return 'humidity-very-high';
});

const getHumidityLevelText = computed(() => {
  if (!device.value || (device.value.type !== 'humidity_sensor' && !(device.value.category === 'CLIMATE' && device.value.subType === 'HUMIDITY_SENSOR'))) return 'Нет данных';
  const humidity = parseFloat(device.value.rawProperties?.tb_humidity || 0);
  if (humidity < 30) return 'Очень сухо';
  if (humidity < 40) return 'Низкая';
  if (humidity < 60) return 'Нормально';
  if (humidity < 70) return 'Повышенная';
  return 'Высокая';
});

// Данные телевизора
const getSourceLabel = computed(() => {
  if (!device.value?.rawProperties?.tb_input_source) return 'ТВ';
  const source = device.value.rawProperties.tb_input_source;
  
  switch(source) {
    case 'tv': return 'ТВ';
    case 'hdmi1': return 'HDMI 1';
    case 'hdmi2': return 'HDMI 2';
    case 'av': return 'AV';
    case 'usb': return 'USB';
    case 'smarttv': return 'Smart TV';
    default: return source;
  }
});

// Индикатор батареи
const getBatteryLevel = computed(() => {
  if (!device.value?.rawProperties?.tb_battery) return 100;
  const battery = parseFloat(device.value.rawProperties.tb_battery);
  return Math.min(Math.max(battery, 0), 100);
});

const getBatteryColorClass = computed(() => {
  const battery = getBatteryLevel.value;
  if (battery < 20) return 'battery-low';
  if (battery < 50) return 'battery-medium';
  return 'battery-high';
});

const getLastUpdated = computed(() => {
  const timestamp = device.value?.rawProperties?.tb_lastUpdated;
  if (!timestamp) return 'Нет данных';
  return new Date(timestamp).toLocaleString('ru-RU');
});

const getBatteryIcon = computed(() => {
  const level = getBatteryLevel.value;
  if (level <= 20) return 'fa-battery-empty';
  if (level <= 40) return 'fa-battery-quarter';
  if (level <= 60) return 'fa-battery-half';
  if (level <= 80) return 'fa-battery-three-quarters';
  return 'fa-battery-full';
});

// Методы
function formatDate(dateString) {
  if (!dateString) return 'Недавно';
  
  try {
    const date = new Date(dateString);
    // Проверяем валидность даты
    if (isNaN(date.getTime())) return 'Недавно';
    
    // Проверяем, была ли дата в течение последних 24 часов
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    
    if (diff < oneDay) {
      // Если менее 24 часов, показываем время
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Иначе показываем дату и время
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {
    console.error('Ошибка при форматировании даты:', e);
    return 'Недавно';
  }
}

async function loadDevice() {
  loading.value = true;
  error.value = null;
  
  try {
    // Проверяем наличие deviceId
    if (!props.deviceId) {
      throw new Error('ID устройства не указан');
    }
    
    // Получаем устройство напрямую из хранилища
    const deviceData = deviceStore.getDeviceById(props.deviceId);
    
    if (!deviceData) {
      console.error(`Устройство с ID ${props.deviceId} не найдено в хранилище`);
      throw new Error('Устройство не найдено');
    }
    
    device.value = deviceData;
  } catch (err) {
    console.error('Ошибка при загрузке устройства:', err);
    error.value = err.message || 'Ошибка при загрузке устройства';
  } finally {
    loading.value = false;
  }
}

function toggleActive() {
  isActive.value = !isActive.value;
}

async function toggleDevice() {
  if (!device.value || !device.value.online) return;
  
  try {
    // Используем метод из deviceStore для переключения устройства
    await deviceStore.toggleDevice(device.value.id, !device.value.active);
    
    // Переключение успешно, синхронизируем локальный статус
    const updatedDevice = deviceStore.getDeviceById(props.deviceId);
    if (updatedDevice) {
      device.value = updatedDevice;
    }
  } catch (error) {
    console.error('Ошибка при переключении устройства:', error);
  }
}

async function refreshDevice() {
  if (refreshing.value) return;
  
  refreshing.value = true;
  
  try {
    await deviceStore.fetchDevices();
    
    // Обновляем локальные данные
    const updatedDevice = deviceStore.getDeviceById(props.deviceId);
    if (updatedDevice) {
      device.value = updatedDevice;
    }
  } catch (error) {
    console.error('Ошибка при обновлении устройства:', error);
  } finally {
    setTimeout(() => {
      refreshing.value = false;
    }, 500);
  }
}

function removeWidget() {
  dashboardStore.removeWidget(props.widgetId);
}

// Жизненный цикл компонента
let updateInterval = null;

onMounted(async () => {
  // Проверка наличия deviceId
  if (!props.deviceId) {
    error.value = 'ID устройства не указан';
    loading.value = false;
    return;
  }
  
  // Загрузка устройства
  await loadDevice();
  
  // При монтировании выполняем дополнительную проверку данных устройства
  if (device.value) {
    const rawProps = device.value.rawProperties || {};
    
    // Проверяем тип устройства и наличие необходимых данных
    if (device.value.category === 'CLIMATE') {
      if ((device.value.subType === 'HUMIDITY_SENSOR' || rawProps.tb_humidity !== undefined) && 
          !rawProps.tb_humidity) {
        console.log('Инициализация датчика влажности с пустыми данными');
        // Принудительно обновляем датчик влажности, если данных нет
        refreshDevice();
      }
      
      if ((device.value.subType === 'TEMPERATURE_SENSOR' || rawProps.tb_temperature !== undefined) && 
          !rawProps.tb_temperature) {
        console.log('Инициализация датчика температуры с пустыми данными');
        // Принудительно обновляем датчик температуры, если данных нет
        refreshDevice();
      }
    }
  }
  
  // Устанавливаем интервал обновления данных каждые 30 секунд
  updateInterval = setInterval(async () => {
    if (props.deviceId && device.value && device.value.online) {
      // При обновлении, получаем свежие данные из хранилища
      const updatedDevice = deviceStore.getDeviceById(props.deviceId);
      if (updatedDevice) {
        device.value = updatedDevice;
      }
    }
  }, 30000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});

// Следим за изменениями deviceId
watch(() => props.deviceId, async (newId) => {
  if (newId && (!device.value || newId !== device.value.id)) {
    await loadDevice();
  }
});
</script>

<style scoped>
.device-card {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Убрали overflow: auto и добавили flexbox для центрирования и вписывания контента */
.device-card > div:nth-child(2) {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.device-widget {
  @apply bg-white rounded-lg shadow-md p-4 relative;
  min-height: 200px;
}

.circular-indicator {
  @apply relative w-32 h-32 mx-auto;
}

.background-circle {
  @apply stroke-current text-gray-200;
}

.active-circle {
  @apply transition-all duration-500 ease-in-out transform origin-center;
  stroke-linecap: round;
}

/* Температурные стили */
.temp-cold { @apply text-blue-600; }
.temp-cool { @apply text-blue-400; }
.temp-normal { @apply text-green-500; }
.temp-warm { @apply text-yellow-500; }
.temp-hot { @apply text-red-500; }

/* Стили влажности */
.humidity-dry { @apply text-red-600; }
.humidity-low { @apply text-yellow-500; }
.humidity-normal { @apply text-green-500; }
.humidity-high { @apply text-blue-400; }
.humidity-very-high { @apply text-blue-600; }

.value {
  @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2;
  @apply text-2xl font-bold transition-all duration-500;
}

.battery-indicator {
  @apply flex items-center gap-2 mt-4 text-sm;
}

.battery-low { @apply text-red-500; }
.battery-medium { @apply text-yellow-500; }
.battery-high { @apply text-green-500; }

.last-updated {
  @apply text-xs text-gray-500 mt-2;
}

.refresh-button {
  @apply ml-2 text-blue-500 hover:text-blue-600 cursor-pointer;
}
</style> 