<template>
  <div class="security-widget h-full flex flex-col">
    <!-- Статус системы безопасности -->
    <div class="security-status p-4 border-b flex items-center justify-between">
      <div class="flex items-center">
        <div class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="securityStatus.system === 'armed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'">
          <i class="fas fa-shield-alt text-lg"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">Система безопасности</h3>
          <p class="text-xs" :class="securityStatus.system === 'armed' ? 'text-green-600' : 'text-gray-500'">
            {{ securityStatus.system === 'armed' ? 'Активна' : 'Отключена' }}
          </p>
        </div>
      </div>
      <router-link to="/security" class="px-3 py-1 rounded-lg text-sm bg-blue-100 text-blue-600 hover:bg-blue-200">
        Управление
      </router-link>
    </div>
    
    <!-- Статистика и плитки -->
    <div class="security-stats grid grid-cols-2 gap-3 p-4">
      <!-- Камеры -->
      <router-link to="/security/cameras" class="security-stat-card p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
        <div class="flex items-center mb-2">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
            <i class="fas fa-video"></i>
          </div>
          <h4 class="font-medium ml-2 text-blue-700">Камеры</h4>
        </div>
        <div class="text-sm text-blue-800">
          <p>{{ camerasStatus.activeCameras }} из {{ camerasStatus.totalCameras }} активны</p>
        </div>
      </router-link>
      
      <!-- Замки -->
      <router-link to="/security/locks" class="security-stat-card p-3 bg-violet-50 rounded-lg border border-violet-100 hover:bg-violet-100 transition-colors">
        <div class="flex items-center mb-2">
          <div class="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-500">
            <i class="fas fa-lock"></i>
          </div>
          <h4 class="font-medium ml-2 text-violet-700">Замки</h4>
        </div>
        <div class="text-sm text-violet-800">
          <p>{{ locksStatus.lockedCount }} из {{ locksStatus.totalLocks }} заблокированы</p>
        </div>
      </router-link>
    </div>
    
    <!-- Последние события -->
    <div class="security-events flex-grow overflow-auto px-4 pb-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium text-gray-700">Последние события</h3>
        <router-link to="/security/locks" class="text-xs text-blue-600 hover:text-blue-800">
          Все события
        </router-link>
      </div>
      
      <!-- Индикатор загрузки -->
      <div v-if="loadingHistory" class="flex justify-center my-4">
        <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Сообщение об ошибке истории -->
      <div v-else-if="historyError" class="bg-red-50 text-red-600 p-2 rounded-lg mb-3 text-xs">
        <i class="fas fa-exclamation-circle mr-1"></i>{{ historyError }}
      </div>
      
      <!-- Сообщение, если нет истории -->
      <div v-else-if="lockHistory.length === 0" class="bg-gray-50 p-4 rounded-lg text-center">
        <i class="fas fa-history text-gray-300 text-2xl mb-2"></i>
        <p class="text-sm text-gray-500">История событий пуста</p>
      </div>
      
      <!-- События из истории замков -->
      <div v-else v-for="event in lockHistory.slice(0, 4)" :key="event.id" 
        class="security-event-item bg-white p-2 rounded-lg shadow-sm mb-2 border-l-2"
        :class="getEventBorderClass(event.action)">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-gray-500">{{ formatDate(event.timestamp) }}</span>
          <span :class="getEventStatusClass(event.action)">{{ getEventStatus(event.action) }}</span>
        </div>
        <p class="text-sm">{{ event.deviceName }}: {{ event.action }}</p>
      </div>
      
      <router-link to="/security" class="view-all-link text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2">
        <span>Просмотреть все</span>
        <i class="fas fa-chevron-right ml-1 text-xs"></i>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDeviceStore } from '../../store/deviceStore';
import api from '../../services/api';

const router = useRouter();
const deviceStore = useDeviceStore();

// Состояние системы безопасности
const securityStatus = ref({
  system: 'armed', // armed или disarmed
});

// Получаем список камер из хранилища устройств
const cameras = computed(() => {
  return deviceStore.devices.filter(device => 
    device.type === 'camera' || 
    (device.category === 'SECURITY' && device.subType === 'CAMERA')
  );
});

// Статус камер
const camerasStatus = computed(() => {
  const totalCameras = cameras.value.length;
  const activeCameras = cameras.value.filter(camera => 
    camera.online && camera.active
  ).length;
  
  return {
    totalCameras,
    activeCameras
  };
});

// Получаем список замков из хранилища устройств
const locks = computed(() => {
  return deviceStore.devices.filter(device => 
    device.type === 'lock' || 
    (device.category === 'SECURITY' && device.subType === 'SMART_LOCK')
  );
});

// Статус замков
const locksStatus = computed(() => {
  const totalLocks = locks.value.length;
  const lockedCount = locks.value.filter(lock => 
    lock.rawProperties?.tb_locked === 'true'
  ).length;
  
    return {
    totalLocks,
    lockedCount
  };
});

// Флаги загрузки и ошибок истории
const loadingHistory = ref(true);
const historyError = ref(null);

// История замков
const lockHistory = ref([]);

// Форматирование даты
function formatDate(date) {
  return new Date(date).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
}

// Получение статуса для действия
function getEventStatus(action) {
  switch (action) {
    case 'Заблокировано':
      return 'Нормально';
    case 'Разблокировано':
      return 'Внимание';
    case 'Ошибка доступа':
      return 'Тревога';
    default:
      return 'Информация';
  }
}

// Получение класса для статуса события
function getEventStatusClass(action) {
  switch (action) {
    case 'Заблокировано':
      return 'text-green-600';
    case 'Разблокировано':
      return 'text-yellow-600';
    case 'Ошибка доступа':
      return 'text-red-600';
    default:
      return 'text-blue-600';
  }
}

// Получение класса для границы события
function getEventBorderClass(action) {
  switch (action) {
    case 'Заблокировано':
      return 'border-green-500';
    case 'Разблокировано':
      return 'border-yellow-500';
    case 'Ошибка доступа':
      return 'border-red-500';
    default:
      return 'border-blue-500';
  }
}

// Получение истории замков
async function fetchLockHistory() {
  loadingHistory.value = true;
  historyError.value = null;
  
  try {
    // Получаем общую историю всех замков
    const historyData = await api.devices.getAllLockHistory();
    
    // Обновляем данные истории
    lockHistory.value = historyData || [];
  } catch (err) {
    console.error('Ошибка при загрузке истории замков:', err);
    historyError.value = 'Не удалось загрузить историю';
    
    // В режиме разработки можем использовать статические данные
    if (process.env.NODE_ENV === 'development') {
      lockHistory.value = getDemoHistoryData();
    }
  } finally {
    loadingHistory.value = false;
  }
}

// Получение демо-данных для истории (используется только в режиме разработки)
function getDemoHistoryData() {
  return [
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000),
      deviceName: 'Замок входной двери',
      action: 'Заблокировано',
      user: 'Иван Петров',
      method: 'Приложение'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000),
      deviceName: 'Замок гаража',
      action: 'Разблокировано',
      user: 'Система',
      method: 'Автоматически'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 10800000),
      deviceName: 'Замок входной двери',
      action: 'Разблокировано',
      user: 'Иван Петров',
      method: 'Ключ-карта'
    }
  ];
}

// Переключение состояния системы безопасности
function toggleSystem() {
  securityStatus.value.system = securityStatus.value.system === 'armed' 
    ? 'disarmed' 
    : 'armed';
}

// Отслеживаем изменения у замков для обновления истории
watch(locks, () => {
  // Если есть замки, обновляем историю
  if (locks.value.length > 0) {
    fetchLockHistory();
  }
}, { immediate: false });

// При монтировании компонента
onMounted(async () => {
  // Загружаем устройства, если они еще не загружены
  if (deviceStore.devices.length === 0) {
    await deviceStore.fetchDevices();
  }
  
  // Загружаем историю замков
  fetchLockHistory();
  
  // Устанавливаем интервал для обновления данных
  const updateInterval = setInterval(() => {
    fetchLockHistory();
  }, 30000); // Обновляем каждые 30 секунд
  
  // Очищаем интервал при размонтировании компонента
  return () => clearInterval(updateInterval);
});
</script> 

<style scoped>
.security-widget {
  background-color: #f9fafb;
}

.security-events {
  min-height: 100px;
}
</style> 