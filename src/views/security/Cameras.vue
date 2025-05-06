<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Камеры видеонаблюдения</h2>
      <div class="flex gap-3">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg" @click="refreshCameras">
          <i class="fas fa-sync-alt mr-2"></i>Обновить
        </button>
        <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">
          <i class="fas fa-plus mr-2"></i>Добавить камеру
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

    <!-- Сообщение, если нет камер -->
    <div v-else-if="cameras.length === 0" class="bg-gray-50 p-8 rounded-lg text-center">
      <i class="fas fa-video text-gray-300 text-5xl mb-4"></i>
      <h3 class="text-xl font-medium mb-2">Камеры не найдены</h3>
      <p class="text-gray-600 mb-4">В вашей системе пока нет камер видеонаблюдения. Добавьте новые устройства на странице устройств.</p>
      <router-link to="/devices" class="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center">
        <i class="fas fa-plus mr-2"></i>Добавить устройства
      </router-link>
    </div>

    <!-- Сетка камер -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      <div v-for="camera in cameras" :key="camera.id" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="relative">
          <!-- Заглушка для видеопотока камеры -->
          <div class="w-full h-48 bg-gray-800 flex items-center justify-center relative">
            <div v-if="!camera.online" class="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <div class="text-center text-white">
                <i class="fas fa-video-slash text-3xl mb-2"></i>
                <p>Камера не доступна</p>
              </div>
            </div>
            <div v-else-if="!camera.active" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div class="text-center text-white">
                <i class="fas fa-power-off text-3xl mb-2"></i>
                <p>Камера отключена</p>
              </div>
            </div>
            <i v-else class="fas fa-camera text-gray-600 text-5xl"></i>
            
            <!-- Информация о камере -->
            <div class="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
              {{ camera.name }} | {{ formatDate(new Date()) }}
            </div>
          </div>
          
          <!-- Статус записи -->
          <div v-if="camera.active && camera.online" class="absolute top-4 left-4 bg-red-500 text-white rounded-full px-2 py-1 text-xs flex items-center">
            <span class="animate-pulse h-2 w-2 rounded-full bg-white mr-1"></span>
            REC
          </div>
          
          <!-- Кнопки управления камерой -->
          <div class="absolute bottom-4 right-4 flex gap-2">
            <button 
              class="h-8 w-8 rounded-full bg-gray-800 bg-opacity-70 text-white flex items-center justify-center hover:bg-opacity-100"
              :disabled="!camera.online"
              :class="{'opacity-50 cursor-not-allowed': !camera.online}"
              title="Настройки"
            >
              <i class="fas fa-cog"></i>
            </button>
            <button 
              class="h-8 w-8 rounded-full bg-gray-800 bg-opacity-70 text-white flex items-center justify-center hover:bg-opacity-100"
              :disabled="!camera.online"
              :class="{'opacity-50 cursor-not-allowed': !camera.online}"
              title="Снимок"
            >
              <i class="fas fa-camera"></i>
            </button>
          </div>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">{{ camera.name }}</h3>
            <span :class="camera.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-1 rounded-full text-xs">
              {{ camera.online ? 'Онлайн' : 'Офлайн' }}
            </span>
          </div>
          
          <p class="text-sm text-gray-600 mb-3">{{ camera.room || 'Не назначено' }}</p>
          
          <div class="flex justify-between items-center text-sm">
            <div class="flex items-center text-gray-700">
              <i class="fas fa-signal mr-1"></i>
              <span>{{ getMockQuality(camera) }}</span>
            </div>
            
            <button 
              @click="toggleCamera(camera)" 
              :class="camera.active ? 'text-blue-600' : 'text-gray-400'" 
              class="flex items-center"
              :disabled="!camera.online && !camera.isVirtual"
            >
              <i :class="camera.active ? 'fas fa-toggle-on text-lg' : 'fas fa-toggle-off text-lg'"></i>
              <span class="ml-1">{{ camera.active ? 'Активна' : 'Отключена' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useDeviceStore } from '../../store/deviceStore'

export default defineComponent({
  name: 'CamerasView',
  
  setup() {
    const deviceStore = useDeviceStore()
    
    // Флаги загрузки и ошибок
    const loading = ref(true)
    const error = ref(null)
    
    // Получение списка камер из хранилища устройств
    const cameras = computed(() => {
      return deviceStore.devices.filter(device => 
        device.type === 'camera' || 
        (device.category === 'SECURITY' && device.subType === 'CAMERA')
      )
    })
    
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
    
    // Переключение активного состояния камеры
    const toggleCamera = async (camera) => {
      try {
        await deviceStore.toggleDevice(camera.id, !camera.active)
      } catch (err) {
        console.error('Ошибка при переключении камеры:', err)
        error.value = 'Не удалось изменить состояние камеры'
        setTimeout(() => {
          error.value = null
        }, 3000)
      }
    }
    
    // Обновление списка камер
    const refreshCameras = async () => {
      loading.value = true
      error.value = null
      
      try {
        await deviceStore.fetchDevices()
      } catch (err) {
        console.error('Ошибка при загрузке устройств:', err)
        error.value = 'Не удалось загрузить данные о камерах. Пожалуйста, попробуйте позже.'
      } finally {
        loading.value = false
      }
    }
    
    // Получение мок-качества сигнала
    const getMockQuality = (camera) => {
      if (!camera.online) return 'Нет сигнала'
      
      // Используем id устройства для рандомизации, но стабильного результата
      const hash = parseInt(camera.id.replace(/[^0-9]/g, '').substr(0, 4))
      const quality = hash % 3
      
      switch (quality) {
        case 0: return 'Хорошее качество'
        case 1: return 'Высокое качество'
        case 2: return 'Среднее качество'
        default: return 'Стандартное качество'
      }
    }
    
    // При монтировании компонента загружаем данные
    onMounted(() => {
      refreshCameras()
    })
    
    return {
      cameras,
      loading,
      error,
      formatDate,
      toggleCamera,
      refreshCameras,
      getMockQuality
    }
  }
})
</script> 