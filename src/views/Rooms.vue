<template>
  <div class="rooms-page">
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-semibold">Управление комнатами и локациями</h1>
        <div class="space-x-2">
          <button @click="showAddLocationModal = true" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-plus-circle mr-2"></i>Добавить локацию
          </button>
          <button @click="showAddRoomModal = true" :disabled="!locationStore.locations.length" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            <i class="fas fa-plus-circle mr-2"></i>Добавить комнату
          </button>
        </div>
      </div>
      
      <div v-if="locationStore.loading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="locationStore.error" class="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md my-6">
        {{ locationStore.error }}
      </div>
      
      <div v-else-if="!locationStore.locations.length" class="text-center py-12 bg-gray-50 rounded-lg">
        <i class="fas fa-home text-gray-300 text-5xl mb-4"></i>
        <p class="text-gray-500">Нет доступных локаций</p>
        <p class="text-gray-400 text-sm mt-2">Добавьте новую локацию, чтобы начать работу</p>
      </div>
      
      <div v-else>
        <!-- Вкладки локаций -->
        <div class="flex border-b mb-6">
          <button
            v-for="location in locationStore.locations"
            :key="location.id"
            @click="selectLocation(location.id)"
            class="py-2 px-4 font-medium text-sm focus:outline-none"
            :class="{ 
              'border-b-2 border-blue-500 text-blue-600': selectedLocationId === location.id,
              'text-gray-500 hover:text-gray-700': selectedLocationId !== location.id
            }"
          >
            {{ location.name }}
          </button>
        </div>
        
        <!-- Выбранная локация и ее комнаты -->
        <div v-if="selectedLocation" class="mb-8">
          <div class="mb-4 p-4 bg-blue-50 rounded-lg">
            <h2 class="text-lg font-medium text-blue-800">{{ selectedLocation.name }}</h2>
            <p v-if="selectedLocation.description" class="text-sm text-blue-600 mt-1">{{ selectedLocation.description }}</p>
          </div>
          
          <!-- Список комнат -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div v-if="!roomsInSelectedLocation.length" class="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <i class="fas fa-door-open text-gray-300 text-4xl mb-3"></i>
              <p class="text-gray-500">В этой локации нет комнат</p>
              <button @click="showAddRoomModal = true" class="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                Добавить комнату
              </button>
            </div>
            
            <div
              v-for="room in roomsInSelectedLocation"
              :key="room.id"
              class="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start">
                <h3 class="text-lg font-medium mb-1">{{ room.name }}</h3>
                <button @click="openRoomPlan(room)" class="text-blue-500 hover:text-blue-700">
                  <i class="fas fa-map"></i>
                </button>
              </div>
              <p v-if="room.description" class="text-sm text-gray-500 mb-3">{{ room.description }}</p>
              
              <!-- Устройства в комнате -->
              <h4 class="text-sm font-medium text-gray-600 mt-4 mb-2">Устройства в комнате:</h4>
              <div v-if="getDevicesByRoom(room.id).length" class="space-y-2">
                <div
                  v-for="device in getDevicesByRoom(room.id)"
                  :key="device.id"
                  class="flex items-center py-1 px-2 bg-gray-50 rounded text-sm"
                >
                  <i :class="getDeviceIcon(device)" class="mr-2"></i>
                  <span>{{ device.name }}</span>
                  <span 
                    class="ml-auto rounded-full w-2 h-2"
                    :class="device.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'"
                  ></span>
                </div>
              </div>
              <div v-else class="text-sm text-gray-400 italic">
                Нет устройств
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно добавления локации -->
    <div v-if="showAddLocationModal" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div class="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-medium">Добавление локации</h3>
          <button @click="showAddLocationModal = false" class="text-gray-400 hover:text-gray-500">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="addLocation">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Название локации</label>
            <input
              type="text"
              v-model="newLocation.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
            <textarea
              v-model="newLocation.description"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="showAddLocationModal = false"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin mr-2"></i> Создание...
              </span>
              <span v-else>Создать локацию</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Модальное окно добавления комнаты -->
    <div v-if="showAddRoomModal" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div class="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-medium">Добавление комнаты</h3>
          <button @click="showAddRoomModal = false" class="text-gray-400 hover:text-gray-500">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="addRoom">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Выберите локацию</label>
            <select
              v-model="newRoom.locationId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option disabled value="">Выберите локацию</option>
              <option v-for="location in locationStore.locations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Название комнаты</label>
            <input
              type="text"
              v-model="newRoom.name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
            <textarea
              v-model="newRoom.description"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="showAddRoomModal = false"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin mr-2"></i> Создание...
              </span>
              <span v-else>Создать комнату</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- План комнаты (будет отображаться при клике на иконку карты) -->
    <div v-if="selectedRoom" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div class="bg-white w-full max-w-6xl rounded-lg shadow-lg">
        <div class="flex justify-between items-center border-b p-4">
          <h3 class="text-xl font-medium">План комнаты: {{ selectedRoom.name }}</h3>
          <button @click="selectedRoom = null" class="text-gray-400 hover:text-gray-500">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-4">
          <!-- 3D-визуализация комнаты -->
          <Room3DVisualization 
            :room-id="selectedRoom.id" 
            :devices="getDevicesByRoom(selectedRoom.id)"
            :room-data="selectedRoom"
            @device-selected="onDeviceSelected"
            @device-updated="onDeviceUpdated"
          />
        </div>
        
        <div class="flex justify-end p-4 border-t">
          <button
            @click="selectedRoom = null"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, defineComponent, onMounted, watch } from 'vue'
import { useLocationStore } from '@/store/locationStore'
import { useDeviceStore } from '@/store/deviceStore'
import { useRouter } from 'vue-router'
import Room3DVisualization from '@/components/Room3DVisualization.vue'

export default defineComponent({
  name: 'RoomsView',
  
  components: {
    Room3DVisualization
  },
  
  setup() {
    const locationStore = useLocationStore()
    const deviceStore = useDeviceStore()
    const router = useRouter()
    
    const selectedLocationId = ref(null)
    const showAddLocationModal = ref(false)
    const showAddRoomModal = ref(false)
    const selectedRoom = ref(null)
    const isSubmitting = ref(false)
    
    // Новая локация и новая комната
    const newLocation = ref({ name: '', description: '' })
    const newRoom = ref({ name: '', description: '', locationId: '' })
    
    // Выбранная локация
    const selectedLocation = computed(() => {
      if (!selectedLocationId.value) return null
      const location = locationStore.locations.find(loc => loc.id === selectedLocationId.value)
      console.log('Выбранная локация:', location)
      return location
    })
    
    // Комнаты в выбранной локации
    const roomsInSelectedLocation = computed(() => {
      if (!selectedLocationId.value) return []
      const rooms = locationStore.rooms.filter(room => room.locationId === selectedLocationId.value)
      console.log('Комнаты в выбранной локации:', selectedLocationId.value, rooms)
      return rooms
    })
    
    // Выбор локации
    const selectLocation = async (locationId) => {
      console.log('Выбор локации:', locationId)
      selectedLocationId.value = locationId
      
      // Устанавливаем активную локацию и загружаем ее комнаты
      await locationStore.setActiveLocation(locationId)
      
      // Установка значения по умолчанию для формы добавления комнаты
      newRoom.value.locationId = locationId
    }
    
    // Получение устройств в комнате
    const getDevicesByRoom = (roomId) => {
      if (!roomId) return []
      const devices = deviceStore.devices.filter(device => device.roomId === roomId)
      return devices
    }
    
    // Получение иконки для устройства по типу
    const getDeviceIcon = (device) => {
      if (!device || !device.type) return 'fas fa-microchip'
      
      switch (device.type.toUpperCase()) {
        case 'LIGHT': return 'fas fa-lightbulb'
        case 'THERMOSTAT': return 'fas fa-thermometer-half'
        case 'LOCK': return 'fas fa-lock'
        case 'CAMERA': return 'fas fa-video'
        case 'TV': return 'fas fa-tv'
        case 'VACUUM': return 'fas fa-broom'
        default: return 'fas fa-microchip'
      }
    }
    
    // Открытие плана комнаты
    const openRoomPlan = (room) => {
      console.log('Открытие плана комнаты:', room)
      selectedRoom.value = room
    }
    
    // Обработчик выбора устройства в 3D-визуализации
    const onDeviceSelected = (device) => {
      console.log('Выбрано устройство:', device)
      // Здесь можно добавить дополнительную логику при выборе устройства
    }
    
    // Обработчик обновления устройства в 3D-визуализации
    const onDeviceUpdated = (device) => {
      console.log('Обновлено устройство:', device)
      // Обновляем устройство в хранилище
      const deviceIndex = deviceStore.devices.findIndex(d => d.id === device.id)
      if (deviceIndex !== -1) {
        deviceStore.devices[deviceIndex] = { ...deviceStore.devices[deviceIndex], ...device }
      }
    }
    
    // Добавление новой локации
    const addLocation = async () => {
      if (isSubmitting.value) return
      
      try {
        isSubmitting.value = true
        
        // Проверяем наличие обязательных полей
        if (!newLocation.value.name.trim()) {
          throw new Error('Название локации обязательно')
        }
        
        const locationData = {
          name: newLocation.value.name.trim(),
          description: newLocation.value.description ? newLocation.value.description.trim() : null
        }
        
        console.log('Отправка данных для создания локации:', locationData)
        const result = await locationStore.addLocation(locationData)
        console.log('Результат создания локации:', result)
        
        if (!result || !result.id) {
          throw new Error('Не удалось создать локацию: неверный ответ от сервера')
        }
        
        // Очищаем форму и закрываем модальное окно
        newLocation.value = { name: '', description: '' }
        showAddLocationModal.value = false
        
        // Выбираем новую локацию
        await selectLocation(result.id)
        
        // Заново загружаем список локаций, чтобы получить актуальные данные
        await locationStore.fetchLocations()
        
        alert('Локация успешно создана!')
      } catch (error) {
        console.error('Ошибка при создании локации:', error)
        alert(`Ошибка: ${error.message || 'Не удалось создать локацию'}`)
      } finally {
        isSubmitting.value = false
      }
    }
    
    // Добавление новой комнаты
    const addRoom = async () => {
      if (isSubmitting.value) return
      
      try {
        isSubmitting.value = true
        
        // Проверяем наличие обязательных полей
        if (!newRoom.value.name.trim()) {
          throw new Error('Название комнаты обязательно')
        }
        
        if (!newRoom.value.locationId) {
          throw new Error('Необходимо выбрать локацию')
        }
        
        const roomData = {
          name: newRoom.value.name.trim(),
          description: newRoom.value.description ? newRoom.value.description.trim() : null
        }
        
        const locationId = newRoom.value.locationId
        console.log('Отправка данных для создания комнаты:', locationId, roomData)
        
        const result = await locationStore.addRoom(locationId, roomData)
        console.log('Результат создания комнаты:', result)
        
        if (!result) {
          throw new Error('Не удалось создать комнату: неверный ответ от сервера')
        }
        
        // Очищаем форму и закрываем модальное окно
        newRoom.value = { name: '', description: '', locationId: selectedLocationId.value }
        showAddRoomModal.value = false
        
        // Заново загружаем данные выбранной локации, чтобы обновить список комнат
        await locationStore.fetchRooms(locationId)
        
        alert('Комната успешно создана!')
      } catch (error) {
        console.error('Ошибка при создании комнаты:', error)
        alert(`Ошибка: ${error.message || 'Не удалось создать комнату'}`)
      } finally {
        isSubmitting.value = false
      }
    }
    
    // При монтировании компонента загружаем данные
    onMounted(async () => {
      try {
        console.log('Инициализация компонента Rooms')
        
        // Загружаем локации
        await locationStore.fetchLocations()
        console.log('Загруженные локации:', locationStore.locations)
        
        // Загружаем устройства
        await deviceStore.fetchDevices()
        console.log('Загруженные устройства:', deviceStore.devices)
        
        // Если есть локации, выбираем первую
        if (locationStore.locations.length > 0) {
          await selectLocation(locationStore.locations[0].id)
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
      }
    })
    
    // Установка locationId в форме добавления комнаты при открытии модального окна
    watch(() => showAddRoomModal.value, (isOpen) => {
      if (isOpen && selectedLocationId.value) {
        newRoom.value.locationId = selectedLocationId.value
      }
    })
    
    return {
      locationStore,
      deviceStore,
      selectedLocationId,
      selectedLocation,
      roomsInSelectedLocation,
      showAddLocationModal,
      showAddRoomModal,
      newLocation,
      newRoom,
      isSubmitting,
      selectedRoom,
      selectLocation,
      addLocation,
      addRoom,
      getDevicesByRoom,
      getDeviceIcon,
      openRoomPlan,
      onDeviceSelected,
      onDeviceUpdated
    }
  }
})
</script>

<style scoped>
.rooms-page {
  min-height: calc(100vh - 64px);
  background-color: #f9fafb;
}
</style> 