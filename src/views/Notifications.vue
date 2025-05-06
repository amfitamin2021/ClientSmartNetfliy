<template>
  <div class="p-6">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Уведомления</h1>
        <p class="text-gray-500">{{ totalUnread }} непрочитанных уведомлений</p>
      </div>
      <div class="flex gap-3">
        <button 
          class="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg"
          @click="markAllAsRead"
          :disabled="unreadNotifications.length === 0"
        >
          Отметить все как прочитанные
        </button>
        <button 
          class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg"
          @click="clearAll"
          :disabled="notifications.length === 0"
        >
          Очистить все
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else-if="notifications.length === 0" class="text-center py-16">
      <div class="mb-4 text-5xl text-gray-300">
        <i class="fas fa-bell-slash"></i>
      </div>
      <h2 class="text-xl font-bold text-gray-500">Нет уведомлений</h2>
      <p class="text-gray-500 mt-2">Здесь будут показаны уведомления о событиях системы</p>
    </div>

    <div v-else>
      <!-- Фильтры -->
      <div class="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button 
          class="px-4 py-2 rounded-lg whitespace-nowrap"
          :class="currentFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'"
          @click="changeFilter('all')"
        >
          Все
        </button>
        <button 
          class="px-4 py-2 rounded-lg whitespace-nowrap"
          :class="currentFilter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100'"
          @click="changeFilter('unread')"
        >
          Непрочитанные
        </button>
        <button 
          class="px-4 py-2 rounded-lg whitespace-nowrap"
          :class="currentFilter === 'warning' ? 'bg-blue-600 text-white' : 'bg-gray-100'"
          @click="changeFilter('warning')"
        >
          Предупреждения
        </button>
        <button 
          class="px-4 py-2 rounded-lg whitespace-nowrap"
          :class="currentFilter === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100'"
          @click="changeFilter('info')"
        >
          Информационные
        </button>
      </div>

      <!-- Список уведомлений -->
      <div class="space-y-4">
        <div 
          v-for="notification in filteredNotifications" 
          :key="notification.id"
          class="bg-white p-4 rounded-xl shadow-sm relative"
          :class="{ 'border-l-4 border-blue-500': !notification.read }"
        >
          <div class="flex">
            <div class="mr-4">
              <div 
                class="h-10 w-10 rounded-full flex items-center justify-center"
                :class="getNotificationIconClass(notification.type)"
              >
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium" :class="{ 'font-bold': !notification.read }">
                    {{ notification.title }}
                  </h3>
                  <p class="text-gray-600 mt-1">{{ notification.message }}</p>
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(notification.timestamp) }}
                </div>
              </div>
              <div class="mt-3 flex justify-between items-center">
                <div v-if="notification.deviceId" class="text-sm text-gray-500">
                  <i class="fas fa-microchip mr-1"></i> {{ getDeviceName(notification.deviceId) }}
                </div>
                <div class="flex gap-2">
                  <button 
                    v-if="!notification.read"
                    class="text-sm text-blue-600"
                    @click="markAsRead(notification.id)"
                  >
                    Отметить как прочитанное
                  </button>
                  <button 
                    class="text-sm text-red-600"
                    @click="deleteNotification(notification.id)"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useNotificationsStore, useDevicesStore } from '@/store'

export default defineComponent({
  name: 'NotificationsView',
  
  setup() {
    const notificationsStore = useNotificationsStore()
    const devicesStore = useDevicesStore()
    
    const loading = ref(true)
    const error = ref(null)
    const currentFilter = ref('all')
    
    // Получение временных уведомлений для демонстрации
    const notifications = ref([
      {
        id: 1,
        title: 'Обнаружено движение',
        message: 'Датчик движения в гараже обнаружил активность',
        type: 'warning',
        read: false,
        timestamp: new Date(),
        deviceId: 4
      },
      {
        id: 2,
        title: 'Низкий заряд батареи',
        message: 'Датчик в спальне имеет низкий заряд батареи (15%)',
        type: 'warning',
        read: false,
        timestamp: new Date(Date.now() - 3600000),
        deviceId: 3
      },
      {
        id: 3,
        title: 'Температура изменена',
        message: 'Термостат в гостиной установлен на 23°C',
        type: 'info',
        read: false,
        timestamp: new Date(Date.now() - 7200000),
        deviceId: 1
      },
      {
        id: 4,
        title: 'Свет включен',
        message: 'Освещение в кухне включено',
        type: 'info',
        read: true,
        timestamp: new Date(Date.now() - 86400000),
        deviceId: 2
      },
      {
        id: 5,
        title: 'Обновление системы',
        message: 'Успешно установлено обновление системы до версии 1.2.0',
        type: 'info',
        read: true,
        timestamp: new Date(Date.now() - 172800000)
      }
    ])
    
    // Фильтрация уведомлений
    const filteredNotifications = computed(() => {
      switch (currentFilter.value) {
        case 'unread':
          return notifications.value.filter(n => !n.read)
        case 'warning':
          return notifications.value.filter(n => n.type === 'warning')
        case 'info':
          return notifications.value.filter(n => n.type === 'info')
        default:
          return notifications.value
      }
    })
    
    // Подсчет непрочитанных уведомлений
    const unreadNotifications = computed(() => 
      notifications.value.filter(n => !n.read)
    )
    
    const totalUnread = computed(() => 
      unreadNotifications.value.length
    )
    
    // Изменение фильтра
    const changeFilter = (filter) => {
      currentFilter.value = filter
    }
    
    // Форматирование даты
    const formatDate = (date) => {
      const now = new Date()
      const notificationDate = new Date(date)
      
      const diffMs = now - notificationDate
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffMins < 60) {
        return `${diffMins} мин назад`
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`
      } else if (diffDays < 7) {
        return `${diffDays} д назад`
      } else {
        return notificationDate.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    
    // Получение имени устройства по ID
    const getDeviceName = (deviceId) => {
      const device = devicesStore.devices.find(d => d.id === deviceId)
      return device ? device.name : 'Неизвестное устройство'
    }
    
    // Получение иконки для типа уведомления
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'warning':
          return 'fas fa-exclamation-triangle'
        case 'info':
          return 'fas fa-info'
        default:
          return 'fas fa-bell'
      }
    }
    
    // Получение класса для фона иконки уведомления
    const getNotificationIconClass = (type) => {
      switch (type) {
        case 'warning':
          return 'bg-yellow-50 text-yellow-500'
        case 'info':
          return 'bg-blue-50 text-blue-500'
        default:
          return 'bg-gray-50 text-gray-500'
      }
    }
    
    // Действия с уведомлениями
    const markAsRead = (id) => {
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
      // В реальном приложении: notificationsStore.markAsRead(id)
    }
    
    const markAllAsRead = () => {
      notifications.value.forEach(n => {
        n.read = true
      })
      // В реальном приложении: notificationsStore.markAllAsRead()
    }
    
    const deleteNotification = (id) => {
      notifications.value = notifications.value.filter(n => n.id !== id)
      // В реальном приложении: notificationsStore.deleteNotification(id)
    }
    
    const clearAll = () => {
      notifications.value = []
      // В реальном приложении: notificationsStore.clearAll()
    }
    
    onMounted(() => {
      // Имитация загрузки данных
      setTimeout(() => {
        loading.value = false
      }, 1000)
      
      // В реальном приложении: загрузка данных
      // notificationsStore.fetchNotifications()
      // devicesStore.fetchDevices()
    })
    
    return {
      loading,
      error,
      notifications,
      currentFilter,
      filteredNotifications,
      unreadNotifications,
      totalUnread,
      changeFilter,
      formatDate,
      getDeviceName,
      getNotificationIcon,
      getNotificationIconClass,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll
    }
  }
})
</script> 