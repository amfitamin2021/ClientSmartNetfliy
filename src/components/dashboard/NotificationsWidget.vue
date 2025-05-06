<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold">Уведомления</h3>
      <span v-if="unreadCount" class="px-2 py-1 rounded-full bg-red-50 text-red-600 text-sm">
        {{ unreadCount }} новых
      </span>
    </div>
    <div class="space-y-4">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="flex items-center gap-3 p-3 rounded-lg"
        :class="notification.class"
      >
        <i :class="notification.icon"></i>
        <span>{{ notification.message }}</span>
      </div>
      
      <div v-if="notifications.length === 0" class="text-center py-4 text-gray-500">
        <i class="text-3xl fas fa-bell-slash mb-2"></i>
        <p>Нет новых уведомлений</p>
      </div>
      
      <button 
        v-if="notifications.length > 0" 
        class="w-full py-2 text-blue-600 text-sm hover:underline"
        @click="viewAllNotifications"
      >
        Посмотреть все уведомления
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationsWidget',
  data() {
    return {
      notifications: [
        {
          id: 1,
          message: 'Обнаружено движение (Гараж)',
          icon: 'fas fa-circle-exclamation',
          class: 'bg-red-50 text-red-700',
          timestamp: new Date(),
          read: false
        },
        {
          id: 2,
          message: 'Низкий заряд батареи (Датчик)',
          icon: 'fas fa-triangle-exclamation',
          class: 'bg-yellow-50 text-yellow-700',
          timestamp: new Date(Date.now() - 3600000), // 1 час назад
          read: false
        },
        {
          id: 3,
          message: 'Завершено обновление ПО',
          icon: 'fas fa-circle-check',
          class: 'bg-green-50 text-green-700',
          timestamp: new Date(Date.now() - 86400000), // 1 день назад
          read: true
        }
      ]
    }
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !n.read).length
    },
    recentNotifications() {
      // Получаем последние 3 уведомления
      return this.notifications.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      ).slice(0, 3)
    }
  },
  methods: {
    viewAllNotifications() {
      // Переход на страницу всех уведомлений
      this.$router.push('/notifications')
    },
    markAllAsRead() {
      // Отметить все уведомления как прочитанные
      this.notifications.forEach(notification => {
        notification.read = true
      })
    },
    fetchNotifications() {
      // Здесь будет вызов API для получения уведомлений
      console.log('Загрузка уведомлений')
    }
  },
  mounted() {
    this.fetchNotifications()
  }
}
</script> 