<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
    <div class="bg-white w-full max-w-2xl rounded-lg shadow-lg">
      <!-- Заголовок -->
      <div class="flex justify-between items-center border-b p-4">
        <h3 class="text-xl font-medium">Добавление устройства</h3>
        <button @click="close" class="text-gray-400 hover:text-gray-500">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- Выбор метода добавления устройства -->
      <div class="p-4 border-b">
        <div class="flex flex-col gap-2">
          <div class="font-medium">Выберите устройство из ThingsBoard</div>
          <div class="text-sm text-gray-600 mb-2">
            Вы можете добавить только устройства, которые уже существуют в ThingsBoard.
          </div>
          
          <!-- Индикатор загрузки доступных устройств -->
          <div v-if="loadingAvailableDevices" class="p-2 text-center">
            <i class="fas fa-spinner fa-spin mr-2"></i> Загрузка доступных устройств...
          </div>
          
          <!-- Выбор доступного устройства -->
          <div v-if="!loadingAvailableDevices" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Доступные устройства из ThingsBoard</label>
            <select
              v-model="selectedAvailableDevice"
              @change="handleDeviceSelect"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Выберите устройство</option>
              <option v-for="device in availableDevices" :key="device.id" :value="device.id">
                {{ device.name }} ({{ device.type }})
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Конфигурация устройства -->
      <div class="p-4">
        <h4 class="font-medium mb-2">Настройка устройства</h4>
        
        <!-- Показываем ошибку, если она есть -->
        <div v-if="formError" class="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {{ formError }}
        </div>
        
        <form @submit.prevent="submitForm">
          <div class="mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Название устройства</label>
                <input
                  type="text"
                  v-model="deviceData.name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Комната</label>
                <select
                  v-model="deviceData.roomId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Выберите комнату</option>
                  <option v-for="room in rooms" :key="room.id" :value="room.id">
                    {{ room.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Категория устройства</label>
                <select
                  v-model="deviceData.category"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  @change="updateSubTypes"
                >
                  <option value="">Выберите категорию</option>
                  <option v-for="category in deviceCategories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Тип устройства</label>
                <select
                  v-model="deviceData.subType"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  :disabled="!deviceData.category"
                >
                  <option value="">Выберите тип</option>
                  <option v-for="subType in availableSubTypes" :key="subType.id" :value="subType.id">
                    {{ subType.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Производитель (опционально)</label>
                <input
                  type="text"
                  v-model="deviceData.manufacturer"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Модель (опционально)</label>
                <input
                  type="text"
                  v-model="deviceData.model"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 border-t pt-4 mt-4">
            <button
              type="button"
              @click="close"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              :disabled="isSubmitting || !selectedAvailableDevice"
            >
              <span v-if="isSubmitting">
                <i class="fas fa-spinner fa-spin mr-2"></i> Добавление...
              </span>
              <span v-else>Добавить устройство</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, onMounted, watch, computed } from 'vue'
import { useDeviceStore } from '@/store/deviceStore'
import { useLocationStore } from '@/store/locationStore'
import api from '@/services/api'

export default defineComponent({
  name: 'DeviceAddModal',
  
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    rooms: {
      type: Array,
      required: true
    }
  },
  
  emits: ['close', 'device-added', 'error'],
  
  setup(props, { emit }) {
    const deviceStore = useDeviceStore()
    const locationStore = useLocationStore()
    const isSubmitting = ref(false)
    const availableSubTypes = ref([])
    const formError = ref(null)
    const availableDevices = ref([])
    const loadingAvailableDevices = ref(false)
    const selectedAvailableDevice = ref('')
    
    const deviceData = ref({
      name: '',
      roomId: '',
      manufacturer: '',
      model: '',
      type: '',
      category: '',
      subType: '',
      protocol: 'VIRTUAL',
      thingsboardToken: '' // Добавляем поле для хранения токена ThingsBoard
    })
    
    // Категории устройств
    const deviceCategories = [
      { id: 'LIGHTING', name: 'Освещение' },
      { id: 'SECURITY', name: 'Безопасность' },
      { id: 'CLIMATE', name: 'Климат-контроль' },
      { id: 'APPLIANCES', name: 'Бытовая техника' },
      { id: 'ENERGY', name: 'Энергопотребление' },
      { id: 'SENSORS', name: 'Датчики' }
    ]
    
    // Типы устройств по категориям
    const deviceTypes = {
      LIGHTING: [
        { id: 'SMART_BULB', name: 'Умная лампа' },
        { id: 'LED_STRIP', name: 'Светодиодная лента' },
        { id: 'CEILING_LIGHT', name: 'Потолочный светильник' }
      ],
      SECURITY: [
        { id: 'CAMERA', name: 'Камера видеонаблюдения' },
        { id: 'SMART_LOCK', name: 'Умный замок' },
        { id: 'MOTION_SENSOR', name: 'Датчик движения' },
        { id: 'CONTACT_SENSOR', name: 'Датчик открытия' }
      ],
      CLIMATE: [
        { id: 'THERMOSTAT', name: 'Термостат' },
        { id: 'AIR_CONDITIONER', name: 'Кондиционер' },
        { id: 'TEMPERATURE_SENSOR', name: 'Датчик температуры' },
        { id: 'HUMIDITY_SENSOR', name: 'Датчик влажности' }
      ],
      APPLIANCES: [
        { id: 'TV', name: 'Телевизор' },
        { id: 'REFRIGERATOR', name: 'Холодильник' },
        { id: 'WASHING_MACHINE', name: 'Стиральная машина' },
        { id: 'VACUUM', name: 'Робот-пылесос' }
      ],
      ENERGY: [
        { id: 'SMART_PLUG', name: 'Умная розетка' },
        { id: 'ENERGY_METER', name: 'Счетчик электроэнергии' }
      ],
      SENSORS: [
        { id: 'LEAK_SENSOR', name: 'Датчик протечки' },
        { id: 'AIR_QUALITY_SENSOR', name: 'Датчик качества воздуха' },
        { id: 'SMOKE_SENSOR', name: 'Датчик дыма' }
      ]
    }
    
    // Загрузка доступных устройств из ThingsBoard
    const loadAvailableDevices = async () => {
      try {
        loadingAvailableDevices.value = true
        
        // Получаем все доступные устройства из ThingsBoard
        const allAvailableDevices = await deviceStore.getAvailableDevices()
        
        // Получаем список всех устройств, уже добавленных в систему
        const existingDevices = deviceStore.devices
        
        // Отфильтровываем устройства, которые уже добавлены
        // по ThingsBoard ID или токену
        const availableDevicesFiltered = allAvailableDevices.filter(tbDevice => {
          // Проверяем, нет ли устройства с таким же thingsboardId или токеном
          return !existingDevices.some(existingDevice => 
            existingDevice.thingsboardId === tbDevice.id || 
            existingDevice.thingsboardToken === tbDevice.token
          )
        })
        
        availableDevices.value = availableDevicesFiltered
        console.log('Загружено доступных неиспользуемых устройств из ThingsBoard:', 
          availableDevices.value.length, 
          'из', 
          allAvailableDevices.length, 
          'общих'
        )
        
        // Если нет доступных устройств, показываем предупреждение
        if (availableDevices.value.length === 0 && allAvailableDevices.length > 0) {
          formError.value = 'Все устройства из ThingsBoard уже используются в системе'
        }
      } catch (error) {
        console.error('Ошибка при загрузке доступных устройств:', error)
        formError.value = 'Не удалось загрузить доступные устройства из ThingsBoard'
      } finally {
        loadingAvailableDevices.value = false
      }
    }
    
    // Обработка выбора устройства из списка доступных
    const handleDeviceSelect = () => {
      if (!selectedAvailableDevice.value) return
      
      const selectedDevice = availableDevices.value.find(device => device.id === selectedAvailableDevice.value)
      if (selectedDevice) {
        // Заполняем форму данными выбранного устройства
        deviceData.value.name = selectedDevice.name
        deviceData.value.type = selectedDevice.type
        deviceData.value.thingsboardToken = selectedDevice.token
        deviceData.value.manufacturer = selectedDevice.manufacturer || ''
        deviceData.value.model = selectedDevice.model || ''
        
        // Пытаемся определить категорию и тип по типу устройства из ThingsBoard
        determineDeviceCategory(selectedDevice.type)
      }
    }
    
    // Определяем категорию и подтип устройства по типу из ThingsBoard
    const determineDeviceCategory = (thingsBoardType) => {
      // Приводим тип к верхнему регистру для сравнения
      const typeUpper = thingsBoardType.toUpperCase()
      
      // Проверяем все категории и их типы
      for (const [category, types] of Object.entries(deviceTypes)) {
        const foundType = types.find(t => t.id.toUpperCase() === typeUpper || t.name.toUpperCase().includes(typeUpper))
        if (foundType) {
          deviceData.value.category = category
          updateSubTypes()
          deviceData.value.subType = foundType.id
          return
        }
      }
      
      // Если не нашли точное соответствие, пробуем найти частичное
      for (const [category, types] of Object.entries(deviceTypes)) {
        for (const type of types) {
          if (typeUpper.includes(type.id.toUpperCase()) || type.id.toUpperCase().includes(typeUpper)) {
            deviceData.value.category = category
            updateSubTypes()
            deviceData.value.subType = type.id
            return
          }
        }
      }
      
      // Если не нашли, оставляем пустым для выбора пользователем
      deviceData.value.category = ''
      deviceData.value.subType = ''
    }
    
    // Обновление доступных типов устройств в зависимости от выбранной категории
    const updateSubTypes = () => {
      const category = deviceData.value.category
      console.log("Выбрана категория:", category);
      if (category && deviceTypes[category]) {
        availableSubTypes.value = deviceTypes[category]
        console.log("Доступные типы:", availableSubTypes.value);
      } else {
        availableSubTypes.value = []
        console.log("Сброс типов устройств");
      }
      deviceData.value.subType = ''
    }
    
    // Получаем комнаты из хранилища
    const rooms = computed(() => locationStore.rooms)
    
    // Сброс формы
    const resetForm = () => {
      formError.value = null
      deviceData.value = {
        name: '',
        roomId: '',
        manufacturer: '',
        model: '',
        type: '',
        category: '',
        subType: '',
        protocol: 'VIRTUAL',
        thingsboardToken: ''
      }
      availableSubTypes.value = []
      selectedAvailableDevice.value = ''
    }
    
    // Закрытие модального окна
    const close = () => {
      resetForm()
      emit('close')
    }
    
    // Отправка формы
    const submitForm = async () => {
      if (isSubmitting.value) return
      
      try {
        isSubmitting.value = true
        
        // Проверяем, выбрано ли устройство из ThingsBoard
        if (!selectedAvailableDevice.value) {
          formError.value = 'Пожалуйста, выберите устройство из списка доступных в ThingsBoard'
          isSubmitting.value = false
          return
        }
        
        // Получаем выбранную комнату
        const selectedRoom = props.rooms.find(room => room.id === deviceData.value.roomId)
        
        // Проверяем, что все обязательные поля заполнены
        if (!deviceData.value.name || !deviceData.value.roomId || !deviceData.value.category || !deviceData.value.subType) {
          formError.value = 'Пожалуйста, заполните все обязательные поля'
          isSubmitting.value = false
          return
        }
        
        // Проверяем, есть ли уже такое устройство с таким же именем
        const existingDevice = deviceStore.devices.find(d => d.name === deviceData.value.name)
        if (existingDevice) {
          formError.value = `Устройство с именем "${deviceData.value.name}" уже существует`
          isSubmitting.value = false
          return
        }
        
        // Находим выбранное ThingsBoard устройство
        const selectedTBDevice = availableDevices.value.find(dev => dev.id === selectedAvailableDevice.value)
        
        // Создаем объект запроса
        const requestData = {
          name: deviceData.value.name,
          roomId: deviceData.value.roomId,
          type: deviceData.value.subType, // Для обратной совместимости
          category: deviceData.value.category,
          subType: deviceData.value.subType,
          protocol: deviceData.value.protocol,
          connectionParams: 'mqtt://localhost:1883',
          manufacturer: deviceData.value.manufacturer || '',
          model: deviceData.value.model || '',
          firmwareVersion: '1.0',
          // Добавляем информацию из ThingsBoard
          thingsboardId: selectedTBDevice.id,
          thingsboardToken: selectedTBDevice.token
        }
        
        // Если есть ID локации у комнаты, добавляем его
        if (selectedRoom && selectedRoom.locationId) {
          requestData.locationId = selectedRoom.locationId
        }
        
        console.log('Отправляем запрос на создание устройства:', requestData)
        
        // Отправляем запрос через store
        const device = await deviceStore.addDevice(requestData)
        
        // Сообщаем родительскому компоненту о добавлении устройства
        emit('device-added', device)
        
        // Закрываем модальное окно
        close()
        
      } catch (error) {
        console.error('Ошибка при добавлении устройства:', error)
        formError.value = error.message || 'Не удалось добавить устройство'
      } finally {
        isSubmitting.value = false
      }
    }
    
    // При монтировании компонента загружаем локации, комнаты и доступные устройства
    onMounted(async () => {
      try {
        // Сначала загружаем локации, что автоматически установит активную локацию
        await locationStore.fetchLocations()
        // Загружаем доступные устройства из ThingsBoard
        await loadAvailableDevices()
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
        formError.value = 'Ошибка при загрузке данных'
      }
    })
    
    return {
      deviceData,
      isSubmitting,
      formError,
      resetForm,
      close,
      submitForm,
      rooms,
      availableSubTypes,
      deviceCategories,
      deviceTypes,
      updateSubTypes,
      availableDevices,
      loadingAvailableDevices,
      selectedAvailableDevice,
      handleDeviceSelect
    }
  }
})
</script> 