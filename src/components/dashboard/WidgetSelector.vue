<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
      <!-- Заголовок -->
      <div class="border-b p-4 flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-800">
          {{ step === 'category' ? 'Выбор типа устройства' : 'Выбор устройства' }}
        </h3>
        <button 
          @click="$emit('close')" 
          class="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Шаг 1: Выбор категории -->
      <div v-if="step === 'category'" class="p-6">
        <p class="text-gray-600 mb-4">Выберите тип устройства, которое вы хотите добавить на дашборд</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div 
            v-for="category in availableCategories" 
            :key="category.id"
            class="border rounded-lg p-4 cursor-pointer transition-colors"
            :class="{ 'border-blue-500 bg-blue-50': selectedCategory === category.id, 
                     'hover:bg-gray-50': selectedCategory !== category.id }"
            @click="selectCategory(category.id)"
          >
            <div class="flex items-center">
              <div class="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full mr-4">
                <i :class="['fas', category.icon, 'text-blue-600 text-xl']"></i>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">{{ category.name }}</h4>
                <p class="text-sm text-gray-600">{{ category.description }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопки действий -->
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Отмена
          </button>
          <button 
            @click="step = 'device'" 
            class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedCategory"
          >
            Далее
          </button>
        </div>
      </div>
      
      <!-- Шаг 2: Выбор устройства -->
      <div v-else-if="step === 'device'" class="p-6">
        <p class="text-gray-600 mb-4">Выберите устройство, которое хотите добавить на дашборд</p>
        
        <!-- Специальный тип виджета - безопасность -->
        <div v-if="selectedCategory === 'security'" class="mb-6 bg-blue-50 p-4 rounded-lg">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full mr-3">
              <i class="fas fa-shield-alt text-blue-600"></i>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Виджет безопасности</h5>
              <p class="text-sm text-gray-600">Общая информация о системе безопасности, камерах и замках</p>
            </div>
          </div>
          
          <button 
            @click="addSecurityWidget" 
            class="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isAdding"
          >
            <i v-if="isAdding" class="fas fa-spinner fa-spin mr-2"></i>
            <span>{{ isAdding ? 'Добавление...' : 'Добавить виджет безопасности' }}</span>
          </button>
        </div>
        
        <!-- Загрузка -->
        <div v-else-if="isLoading" class="py-8 text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p class="mt-3 text-gray-600">Загрузка устройств...</p>
        </div>
        
        <!-- Нет устройств -->
        <div v-else-if="devicesByCategory.length === 0" class="py-8 text-center bg-gray-50 rounded-lg mb-6">
          <i class="fas fa-exclamation-circle text-gray-400 text-3xl mb-2"></i>
          <h4 class="text-lg font-medium text-gray-700 mb-1">Нет доступных устройств</h4>
          <p class="text-gray-600">В этой категории нет устройств или они уже добавлены на дашборд</p>
        </div>
        
        <!-- Список устройств -->
        <div v-else class="space-y-3 mb-6 max-h-96 overflow-y-auto">
          <div 
            v-for="device in devicesByCategory" 
            :key="device.id"
            class="border rounded-lg p-4 cursor-pointer transition-colors"
            :class="{ 'border-blue-500 bg-blue-50': selectedDevice === device.id, 
                     'hover:bg-gray-50': selectedDevice !== device.id }"
            @click="selectDevice(device.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                  <i :class="['fas', getDeviceIcon(device), 'text-gray-600']"></i>
                </div>
                <div>
                  <h5 class="font-medium text-gray-900">{{ device.name }}</h5>
                  <p class="text-sm text-gray-600">{{ device.room || 'Без комнаты' }}</p>
                </div>
              </div>
              <div class="px-3 py-1 rounded-full text-xs font-medium" 
                :class="device.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                {{ device.online ? 'Онлайн' : 'Офлайн' }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопки действий -->
        <div class="flex justify-between space-x-3 pt-4 border-t">
          <button 
            @click="step = 'category'" 
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Назад
          </button>
          
          <div class="flex space-x-3">
            <button 
              @click="$emit('close')" 
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Отмена
            </button>
            <button 
              @click="addDeviceWidget" 
              class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!selectedDevice || isAdding"
            >
              <i v-if="isAdding" class="fas fa-spinner fa-spin mr-2"></i>
              <span>{{ isAdding ? 'Добавление...' : 'Добавить' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useDashboardStore } from '../../store/dashboardStore';
import { useDeviceStore } from '../../store/deviceStore';

const dashboardStore = useDashboardStore();
const deviceStore = useDeviceStore();

// Эмиты
const emit = defineEmits(['close', 'widget-added']);

// Состояние
const step = ref('category');
const selectedCategory = ref('');
const selectedDevice = ref('');
const isLoading = ref(false);
const isAdding = ref(false);

// Доступные категории устройств
const availableCategories = computed(() => [
  {
    id: 'lighting',
    name: 'Освещение',
    icon: 'fa-lightbulb',
    category: 'LIGHTING',
    description: 'Лампы, светильники и другие устройства освещения'
  },
  {
    id: 'climate',
    name: 'Климат',
    icon: 'fa-temperature-high',
    category: 'CLIMATE',
    description: 'Датчики температуры, влажности и другие климатические устройства'
  },
  {
    id: 'appliances',
    name: 'Бытовая техника',
    icon: 'fa-tv',
    category: 'APPLIANCES',
    description: 'Телевизоры, аудиосистемы и другая умная бытовая техника'
  },
  {
    id: 'security',
    name: 'Безопасность',
    icon: 'fa-shield-alt',
    category: 'SECURITY',
    description: 'Камеры, датчики движения и другие устройства безопасности'
  }
]);

// Получение устройств для выбранной категории
const devicesByCategory = computed(() => {
  if (!selectedCategory.value) return [];
  
  // Находим категорию
  const category = availableCategories.value.find(c => c.id === selectedCategory.value);
  if (!category) return [];
  
  // Фильтруем устройства по категории, исключая уже добавленные
  return deviceStore.devices.filter(device => {
    return (
      device.category === category.category && 
      !dashboardStore.hasWidgetForDevice(device.id)
    );
  });
});

// Выбор категории
function selectCategory(categoryId) {
  selectedCategory.value = categoryId;
  selectedDevice.value = '';
}

// Выбор устройства
function selectDevice(deviceId) {
  selectedDevice.value = deviceId;
}

// Получение иконки для устройства
function getDeviceIcon(device) {
  switch (device.category) {
    case 'APPLIANCES':
      if (device.subType === 'TV') return 'fa-tv';
      if (device.subType === 'AUDIO') return 'fa-volume-up';
      return 'fa-plug';
    case 'CLIMATE':
      if (device.subType === 'HUMIDITY_SENSOR') return 'fa-tint';
      if (device.subType === 'TEMPERATURE_SENSOR') return 'fa-thermometer-half';
      if (device.subType === 'THERMOSTAT') return 'fa-temperature-high';
      return 'fa-fan';
    case 'LIGHTING':
      return 'fa-lightbulb';
    case 'SECURITY':
      if (device.subType === 'CAMERA') return 'fa-video';
      if (device.subType === 'MOTION_SENSOR') return 'fa-running';
      return 'fa-shield-alt';
    default:
      return 'fa-cog';
  }
}

// Добавление виджета устройства
async function addDeviceWidget() {
  if (!selectedDevice.value || isAdding.value) return;
  
  try {
    isAdding.value = true;
    
    // Находим выбранную категорию
    const category = availableCategories.value.find(c => c.id === selectedCategory.value);
    if (!category) {
      throw new Error('Категория не найдена');
    }
    
    // Получаем информацию об устройстве
    const device = deviceStore.getDeviceById(selectedDevice.value);
    if (!device) {
      throw new Error('Устройство не найдено');
    }
    
    // Добавляем виджет через хранилище
    await dashboardStore.addDeviceWidget(selectedDevice.value);
    
    emit('widget-added');
  } catch (error) {
    console.error('Ошибка при добавлении виджета:', error);
  } finally {
    isAdding.value = false;
  }
}

// Добавление виджета безопасности
async function addSecurityWidget() {
  if (isAdding.value) return;
  
  try {
    isAdding.value = true;
    
    // Добавляем виджет безопасности через хранилище
    await dashboardStore.addSecurityWidget();
    
    emit('widget-added');
  } catch (error) {
    console.error('Ошибка при добавлении виджета безопасности:', error);
  } finally {
    isAdding.value = false;
  }
}
</script>

<style scoped>
/* Плавная анимация при показе/скрытии */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 