<template>
  <div class="dynamic-widget" :class="{ 'widget-loading': loading }">
    <div class="widget-header">
      <h3>{{ widget.settings?.title || getDefaultTitle }}</h3>
      
      <div class="widget-actions">
        <button class="widget-action-btn refresh-btn" @click="refreshData" title="Обновить">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="widget-action-btn remove-btn" @click="removeWidget" title="Удалить">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    
    <div class="widget-content">
      <!-- Загрузка -->
      <div v-if="loading" class="widget-loader">
        <div class="loader-spinner"></div>
        <p>Загрузка...</p>
      </div>
      
      <!-- Ошибка -->
      <div v-else-if="error" class="widget-error">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button @click="refreshData" class="retry-btn">Повторить</button>
      </div>
      
      <!-- Нет устройства -->
      <div v-else-if="!device && widget.deviceId" class="widget-error">
        <i class="fas fa-question-circle"></i>
        <p>Устройство не найдено</p>
      </div>
      
      <!-- Компонент виджета -->
      <component 
        v-else
        :is="resolveComponent"
        :device="device"
        :deviceId="widget.deviceId"
        :settings="widget.settings"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, markRaw } from 'vue';
import { useDashboardStore } from '../../store/dashboardStore';
import { useDeviceStore } from '../../store/deviceStore';
import TVWidget from './TVWidget.vue';
import HumidityWidget from './HumidityWidget.vue';
import TemperatureWidget from './TemperatureWidget.vue';
import LightWidget from './LightWidget.vue';
import SecurityWidget from './SecurityWidget.vue';
import GenericClimateWidget from './GenericClimateWidget.vue';
import GenericApplianceWidget from './GenericApplianceWidget.vue';
import GenericWidget from './GenericWidget.vue';

// Зарегистрируем все компоненты виджетов
const components = {
  TVWidget: markRaw(TVWidget),
  HumidityWidget: markRaw(HumidityWidget),
  TemperatureWidget: markRaw(TemperatureWidget),
  LightWidget: markRaw(LightWidget),
  SecurityWidget: markRaw(SecurityWidget),
  GenericClimateWidget: markRaw(GenericClimateWidget),
  GenericApplianceWidget: markRaw(GenericApplianceWidget),
  GenericWidget: markRaw(GenericWidget)
};

const props = defineProps({
  widget: {
    type: Object,
    required: true
  }
});

const dashboardStore = useDashboardStore();
const deviceStore = useDeviceStore();

const loading = ref(false);
const error = ref(null);
let refreshInterval = null;

// Получаем информацию об устройстве
const device = computed(() => {
  if (!props.widget.deviceId) return null;
  const deviceData = deviceStore.getDeviceById(props.widget.deviceId);
  console.log(`Виджет ${props.widget.id} получает устройство:`, props.widget.deviceId, deviceData);
  return deviceData;
});

// Определяем заголовок виджета
const getDefaultTitle = computed(() => {
  if (device.value) {
    return device.value.name;
  }
  
  switch (props.widget.type) {
    case 'appliances':
      return 'Бытовая техника';
    case 'climate':
      return 'Датчики климата';
    case 'lighting':
      return 'Освещение';
    case 'security':
      return 'Безопасность';
    case 'notifications':
      return 'Уведомления';
    default:
      return 'Виджет';
  }
});

// Определяем компонент для отображения
const resolveComponent = computed(() => {
  return components[props.widget.component] || null;
});

// Обновление данных
const refreshData = async () => {
  if (loading.value) return;
  
  console.log(`Обновление данных для виджета ${props.widget.id}, устройство: ${props.widget.deviceId}`);
  loading.value = true;
  error.value = null;
  
  try {
    // Обновляем все устройства, так как целевого метода для одного устройства нет
    await deviceStore.fetchDevices();
    console.log("Данные устройств успешно обновлены");
    
    // Проверяем доступность устройства после обновления
    if (props.widget.deviceId && !device.value) {
      console.warn(`Устройство ${props.widget.deviceId} не найдено после обновления данных`);
      error.value = 'Устройство не найдено';
    }
  } catch (err) {
    error.value = 'Не удалось обновить данные';
    console.error('Ошибка при обновлении данных виджета:', err);
  } finally {
    loading.value = false;
  }
};

// Удаление виджета
const removeWidget = () => {
  if (confirm('Вы уверены, что хотите удалить этот виджет?')) {
    dashboardStore.removeWidget(props.widget.id);
  }
};

// Настройка автоматического обновления
onMounted(() => {
  console.log(`Инициализация виджета ${props.widget.id}, устройство: ${props.widget.deviceId}`);
  refreshData();
  
  // Запускаем периодическое обновление в соответствии с настройками
  const interval = parseInt(props.widget.settings?.refreshInterval || 10000);
  console.log(`Установка интервала обновления: ${interval}мс`);
  refreshInterval = setInterval(refreshData, interval);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.dynamic-widget {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-loading {
  opacity: 0.8;
}

.widget-header {
  background-color: #4a4e69;
  color: white;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-actions {
  display: flex;
  gap: 5px;
}

.widget-action-btn {
  background: none;
  border: none;
  color: white;
  opacity: 0.7;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.widget-action-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.2);
}

.remove-btn:hover {
  background-color: rgba(255, 0, 0, 0.2);
}

.widget-content {
  padding: 15px;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.widget-loader, .widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
}

.widget-error {
  color: #d32f2f;
  text-align: center;
}

.widget-error i {
  font-size: 2rem;
}

.loader-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #4a4e69;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background-color: #4a4e69;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #3d405b;
}
</style> 