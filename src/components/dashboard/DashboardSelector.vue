<template>
  <div class="dashboard-selector">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div class="bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <!-- Заголовок -->
        <div class="flex justify-between items-center border-b p-4">
          <h3 class="text-xl font-medium">Добавление дашборда</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-500">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Выбор категории дашборда -->
        <div v-if="step === 1" class="p-4 border-b">
          <div class="mb-4">
            <h4 class="font-medium mb-2">Выберите категорию дашборда</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="category in availableCategories" 
                :key="category.id"
                class="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                :class="{'border-blue-500 bg-blue-50': selectedCategory === category.id}"
                @click="selectCategory(category.id)"
              >
                <div class="flex items-center">
                  <div class="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-3">
                    <i :class="['fas', category.icon, 'text-blue-500']"></i>
                  </div>
                  <div>
                    <h5 class="font-medium">{{ category.name }}</h5>
                    <p class="text-sm text-gray-600">{{ category.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4">
              <div class="form-group">
                <label class="block text-sm font-medium text-gray-700 mb-1">Название дашборда</label>
                <input 
                  type="text" 
                  v-model="dashboardName" 
                  placeholder="Введите название дашборда"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Выбор устройств для дашборда -->
        <div v-if="step === 2" class="p-4 border-b">
          <div class="mb-4">
            <h4 class="font-medium mb-2">Выберите устройства для дашборда</h4>
            
            <div v-if="loading" class="py-8 text-center">
              <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
              <p class="mt-2 text-gray-600">Загрузка устройств...</p>
            </div>
            
            <div v-else-if="devicesByCategory.length === 0" class="py-8 text-center bg-gray-50 rounded-lg">
              <i class="fas fa-exclamation-circle text-gray-400 text-2xl"></i>
              <p class="mt-2 text-gray-600">Нет доступных устройств в этой категории</p>
            </div>
            
            <div v-else class="space-y-2">
              <div 
                v-for="device in devicesByCategory" 
                :key="device.id"
                class="border rounded-lg p-3 flex items-center justify-between"
              >
                <div class="flex items-center">
                  <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                    <i :class="['fas', getDeviceIcon(device), 'text-gray-600']"></i>
                  </div>
                  <div>
                    <h5 class="font-medium">{{ device.name }}</h5>
                    <p class="text-sm text-gray-600">{{ device.room || 'Нет комнаты' }}</p>
                  </div>
                </div>
                <div>
                  <input 
                    type="checkbox" 
                    :id="'device_' + device.id" 
                    v-model="selectedDevices" 
                    :value="device.id"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопки управления -->
        <div class="flex justify-between p-4">
          <button 
            v-if="step > 1" 
            @click="step--" 
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Назад
          </button>
          
          <div class="flex justify-end space-x-2">
            <button 
              @click="close" 
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            
            <button 
              v-if="step === 1"
              @click="goToDeviceSelection" 
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              :disabled="!selectedCategory || !dashboardName"
            >
              Далее
            </button>
            
            <button 
              v-if="step === 2"
              @click="createDashboard" 
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin mr-2"></i> Создание...
              </span>
              <span v-else>
                Создать дашборд
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDashboardStore } from '../../store/dashboardStore';
import { useDeviceStore } from '../../store/deviceStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'dashboard-created']);

// Инициализация хранилищ
const dashboardStore = useDashboardStore();
const deviceStore = useDeviceStore();

// Состояние модального окна
const step = ref(1);
const selectedCategory = ref('');
const dashboardName = ref('');
const selectedDevices = ref([]);
const loading = ref(false);
const isSubmitting = ref(false);

// Получаем доступные категории из хранилища
const availableCategories = computed(() => {
  return dashboardStore.getAvailableWidgetTypes;
});

// Устройства, соответствующие выбранной категории
const devicesByCategory = computed(() => {
  if (!selectedCategory.value) return [];
  
  // Находим категорию
  const category = availableCategories.value.find(c => c.id === selectedCategory.value);
  if (!category || !category.category) return [];
  
  // Получаем устройства для этой категории
  return deviceStore.devices.filter(device => device.category === category.category);
});

// Выбор категории
function selectCategory(categoryId) {
  selectedCategory.value = categoryId;
}

// Переход к выбору устройств
function goToDeviceSelection() {
  if (!selectedCategory.value || !dashboardName.value) return;
  
  // Переходим к следующему шагу
  step.value = 2;
  
  // Убеждаемся, что устройства загружены
  loading.value = true;
  deviceStore.fetchDevices()
    .finally(() => {
      loading.value = false;
    });
}

// Получение иконки для устройства
function getDeviceIcon(device) {
  switch (device.category) {
    case 'APPLIANCES':
      if (device.subType === 'TV') {
        return 'fa-tv';
      }
      return 'fa-plug';
    case 'CLIMATE':
      if (device.subType === 'HUMIDITY_SENSOR') {
        return 'fa-tint';
      } else if (device.subType === 'TEMPERATURE_SENSOR') {
        return 'fa-thermometer-half';
      }
      return 'fa-cloud';
    case 'LIGHTING':
      return 'fa-lightbulb';
    default:
      return 'fa-cog';
  }
}

// Создание дашборда
async function createDashboard() {
  if (isSubmitting.value) return;
  
  try {
    isSubmitting.value = true;
    
    // Находим категорию для получения её кода
    const category = availableCategories.value.find(c => c.id === selectedCategory.value);
    
    // Создаем дашборд
    const dashboard = dashboardStore.createDashboard(dashboardName.value, category.category);
    
    // Добавляем выбранные устройства на дашборд
    for (const deviceId of selectedDevices.value) {
      await dashboardStore.addDeviceWidget(dashboard.id, deviceId);
    }
    
    // Выбираем созданный дашборд как текущий
    dashboardStore.selectDashboard(dashboard.id);
    
    // Уведомляем родительский компонент о создании дашборда
    emit('dashboard-created', dashboard);
    
    // Закрываем модальное окно
    close();
  } catch (error) {
    console.error('Ошибка при создании дашборда:', error);
  } finally {
    isSubmitting.value = false;
  }
}

// Закрытие модального окна
function close() {
  // Сбрасываем состояние
  step.value = 1;
  selectedCategory.value = '';
  dashboardName.value = '';
  selectedDevices.value = [];
  
  // Закрываем модальное окно
  emit('close');
}

// Если окно закрылось, сбрасываем состояние
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    step.value = 1;
    selectedCategory.value = '';
    dashboardName.value = '';
    selectedDevices.value = [];
  }
});
</script>

<style scoped>
/* Дополнительные стили можно добавить здесь */
</style> 