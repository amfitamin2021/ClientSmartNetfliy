<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div>
        <p class="text-sm text-gray-500">ПКУ</p>
        <div class="flex items-center gap-2">
          <i class="text-blue-600 fas fa-tint"></i>
          <h3 class="text-lg font-semibold">Датчик влажности</h3>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <p class="text-gray-500">Состояние</p>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="isEnabled" class="sr-only peer" @change="toggleState">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>

    <div class="flex items-start gap-3">
      <div class="relative w-24 h-24">
        <svg class="w-full h-full" viewBox="0 0 120 120">
          <circle
            class="text-gray-100"
            stroke-width="12"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
          />
          <circle
            class="text-red-600"
            stroke-width="12"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="humidityOffset"
            stroke-linecap="round"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
            transform="rotate(-90, 60, 60)"
          />
          <circle cx="60" cy="60" r="40" fill="white" />
          <text x="60" y="52" dominant-baseline="middle" text-anchor="middle" style="font-size: 24px">💧</text>
          <text x="60" y="75" dominant-baseline="middle" text-anchor="middle" :fill="humidityColor" style="font-size: 16px; font-weight: bold">
            {{ humidityValue }}%
          </text>
        </svg>
      </div>

      <div class="flex-grow">
        <p class="font-medium text-base mb-1">{{ humidityStatus.label }}</p>
        <p class="text-sm text-gray-500 mb-3">
          {{ humidityStatus.recommendation || 'Влажность в пределах нормы' }}
        </p>

        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-gray-500">Оптимальный уровень:</p>
          <p class="text-sm font-medium">40-60%</p>
        </div>

        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-gray-500">Обновлено:</p>
          <p class="flex items-center gap-1 text-sm">
            {{ lastUpdated }}
            <i class="fas fa-sync-alt cursor-pointer hover:text-blue-600" @click="refreshData"></i>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useDeviceStore } from '../../store/deviceStore';

const props = defineProps({
  device: {
    type: Object,
    default: null
  },
  deviceId: {
    type: String,
    required: true
  }
});

const deviceStore = useDeviceStore();
const isEnabled = ref(false);
let updateInterval = null;

// Получаем устройство из хранилища (если не передано через props)
const deviceData = computed(() => {
  if (props.device) return props.device;
  const deviceData = deviceStore.getDeviceById(props.deviceId);
  console.log(`HumidityWidget: получение устройства ${props.deviceId}:`, deviceData);
  return deviceData;
});

// Обновляем состояние включения при изменении device
watch(() => deviceData.value, (newDevice) => {
  if (newDevice) {
    isEnabled.value = newDevice.active || false;
    console.log(`HumidityWidget: обновлено состояние для ${props.deviceId}, активно:`, isEnabled.value);
  }
}, { immediate: true });

// Константы для круговой диаграммы
const circumference = 2 * Math.PI * 54;

// Получаем значение влажности из свойств устройства
const humidityValue = computed(() => {
  const value = deviceData.value?.rawProperties?.tb_humidity;
  return value ? parseInt(value) : '--';
});

// Вычисляем цвет в зависимости от уровня влажности
const humidityColor = computed(() => {
  const humidity = humidityValue.value;
  if (humidity === '--') return '#9ca3af'; // gray-400
  
  if (humidity < 30) return '#ef4444'; // red-500
  if (humidity < 40) return '#f59e0b'; // amber-500
  if (humidity <= 60) return '#10b981'; // emerald-500
  if (humidity <= 70) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
});

// Расчет смещения для кругового индикатора
const humidityOffset = computed(() => {
  if (humidityValue.value === '--') return circumference;
  
  const percent = Math.min(humidityValue.value / 100, 1);
  return circumference - (percent * circumference);
});

// Статус в зависимости от влажности
const humidityStatus = computed(() => {
  const humidity = humidityValue.value;
  if (humidity === '--') {
    return {
      label: 'Нет данных',
      color: 'gray',
      recommendation: 'Проверьте подключение датчика'
    };
  }
  
  if (humidity < 30) {
    return {
      label: 'Очень сухо',
      color: 'red',
      recommendation: 'Рекомендуется включить увлажнитель воздуха'
    };
  }
  
  if (humidity < 40) {
    return {
      label: 'Суховато',
      color: 'amber',
      recommendation: 'Желательно увлажнить воздух'
    };
  }
  
  if (humidity <= 60) {
    return {
      label: 'Нормальная влажность',
      color: 'emerald',
      recommendation: null
    };
  }
  
  if (humidity <= 70) {
    return {
      label: 'Повышенная влажность',
      color: 'amber',
      recommendation: 'Рекомендуется проветрить помещение'
    };
  }
  
  return {
    label: 'Слишком влажно',
    color: 'red',
    recommendation: 'Рекомендуется включить осушитель воздуха'
  };
});

// Форматирование времени последнего обновления
const lastUpdated = computed(() => {
  const lastUpdateTime = deviceData.value?.rawProperties?.tb_last_updated;
  if (!lastUpdateTime) return 'Неизвестно';
  
  try {
    const date = new Date(lastUpdateTime);
    return format(date, 'HH:mm, dd MMM', { locale: ru });
  } catch (e) {
    return 'Некорректная дата';
  }
});

// Функция обновления данных
const refreshData = async () => {
  console.log(`HumidityWidget: обновление данных для устройства ${props.deviceId}`);
  try {
    await deviceStore.fetchDevices();
    console.log(`HumidityWidget: данные успешно обновлены для ${props.deviceId}`);
  } catch (err) {
    console.error('Ошибка при обновлении данных:', err);
  }
};

// Функция переключения состояния устройства
const toggleState = async () => {
  console.log(`HumidityWidget: переключение состояния для ${props.deviceId} на ${isEnabled.value}`);
  try {
    await deviceStore.toggleDevice(props.deviceId, isEnabled.value);
    console.log(`HumidityWidget: состояние успешно изменено для ${props.deviceId}`);
  } catch (error) {
    console.error('Ошибка при обновлении состояния:', error);
    // В случае ошибки восстанавливаем предыдущее состояние
    isEnabled.value = !isEnabled.value;
  }
};

// Настройка автоматического обновления при монтировании компонента
onMounted(() => {
  console.log(`HumidityWidget: инициализация для устройства ${props.deviceId}`);
  
  // Обновляем данные сразу при загрузке
  refreshData();
  
  // Настраиваем периодическое обновление
  updateInterval = setInterval(refreshData, 15000); // Каждые 15 секунд
  
  // Если устройство загружено, синхронизируем состояние
  if (deviceData.value) {
    isEnabled.value = deviceData.value.active || false;
  }
});

// Очищаем интервал при размонтировании компонента
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});
</script>

<style scoped>
/* Дополнительные стили, если необходимо */
</style> 