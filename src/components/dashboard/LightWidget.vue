<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <i class="text-yellow-500 fas fa-lightbulb"></i>
        <h3 class="text-lg font-semibold">{{ device?.name || 'Освещение' }}</h3>
      </div>
    </div>

    <div class="flex flex-col items-center mb-4">
      <div class="light-visualization mb-5">
        <div class="light-state" :class="{ 'light-on': isEnabled }">
          <div class="light-bulb">
            <div class="light-effect" :style="lightEffectStyle"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between items-center">
      <p class="text-gray-600">Состояние</p>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="isEnabled" class="sr-only peer" @change="toggleState">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>

    <div class="flex flex-col mt-4 pt-3 border-t border-gray-100">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500">
          <i class="fas fa-circle-info mr-1 text-blue-500"></i>
          Яркость
        </span>
        <span class="badge" :class="{'bg-blue-100 text-blue-600': isEnabled, 'bg-gray-100 text-gray-500': !isEnabled}">
          {{ getBrightnessValue }}%
        </span>
      </div>
      
      <div class="flex justify-between items-center mt-2 text-sm">
        <span class="text-gray-500">
          <i class="fas fa-palette mr-1 text-blue-500"></i>
          Цвет
        </span>
        <div class="color-indicator" :style="{ backgroundColor: color, opacity: isEnabled ? 1 : 0.4 }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDeviceStore } from '../../store/deviceStore';

const props = defineProps({
  deviceId: {
    type: String,
    required: true
  }
});

const deviceStore = useDeviceStore();
const device = computed(() => deviceStore.getDeviceById(props.deviceId));
const isEnabled = ref(false);
const brightness = ref(100);
const color = ref('#FFFFFF');
const updateInterval = ref(null);

// Яркость в диапазоне 0-1 для стилей
const normalizedBrightness = computed(() => {
  return isEnabled.value ? Math.max(0.1, brightness.value / 100) : 0;
});

// Отображаемое значение яркости
const getBrightnessValue = computed(() => {
  return Math.round(brightness.value);
});

// Стиль эффекта свечения
const lightEffectStyle = computed(() => {
  if (!isEnabled.value) return { backgroundColor: 'transparent' };
  
  const colorWithAlpha = hexToRgba(color.value, normalizedBrightness.value * 0.5);
  return {
    backgroundColor: color.value,
    boxShadow: `0 0 ${normalizedBrightness.value * 30}px ${normalizedBrightness.value * 15}px ${colorWithAlpha}`
  };
});

// Преобразуем HEX в RGBA
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Переключение состояния лампы
const toggleState = async () => {
  try {
    await deviceStore.toggleDevice(props.deviceId, isEnabled.value);
  } catch (error) {
    console.error('Ошибка при переключении устройства:', error);
    isEnabled.value = !isEnabled.value;
  }
};

// Автоматическое обновление данных
const startAutoUpdate = () => {
  stopAutoUpdate();
  updateInterval.value = setInterval(() => {
    deviceStore.fetchDevices();
  }, 10000);
};

const stopAutoUpdate = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
    updateInterval.value = null;
  }
};

// Следим за изменениями в устройстве
watch(() => device.value, (newDevice) => {
  if (newDevice) {
    isEnabled.value = newDevice.active || newDevice.properties?.tb_power === 'on';
    
    // Получаем яркость
    const deviceBrightness = newDevice.brightness || 
                           newDevice.properties?.tb_brightness || 
                           newDevice.properties?.brightness || 
                           newDevice.rawProperties?.tb_brightness;
    
    if (deviceBrightness) {
      brightness.value = parseInt(deviceBrightness);
    }
    
    // Получаем цвет
    let deviceColor = newDevice.color || 
                    newDevice.properties?.tb_color || 
                    newDevice.properties?.color || 
                    newDevice.rawProperties?.tb_color;
    
    if (deviceColor) {
      // Если цвет не начинается с #, добавляем его
      if (!deviceColor.startsWith('#')) {
        deviceColor = '#' + deviceColor;
      }
      color.value = deviceColor;
    }
  }
}, { immediate: true });

// Инициализация при монтировании
onMounted(() => {
  startAutoUpdate();
});

// Очистка при размонтировании
onUnmounted(() => {
  stopAutoUpdate();
});
</script>

<style scoped>
.light-visualization {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.light-state {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.light-on {
  background-color: #fef9c3;
}

.light-bulb {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.light-effect {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 1;
}

.badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
</style> 