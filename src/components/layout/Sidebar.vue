<template>
  <aside class="w-56 h-screen bg-white shadow-sm fixed left-0 top-0">
    <div class="flex items-center p-3 border-b">
      <div class="bg-blue-500 rounded-lg p-2 mr-2">
        <i class="fas fa-home text-white"></i>
      </div>
      <div class="font-medium">Smart Home</div>
    </div>
    
    <nav class="p-3">
      <ul class="space-y-1">
        <li>
          <router-link to="/" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/') }">
            <i class="fas fa-tachometer-alt mr-2"></i>
            <span>Дашборд</span>
          </router-link>
        </li>
        <li>
          <router-link to="/devices" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/devices') }">
            <i class="fas fa-microchip mr-2"></i>
            <span>Устройства</span>
          </router-link>
        </li>
        <li>
          <router-link to="/rooms" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/rooms') }">
            <i class="fas fa-door-open mr-2"></i>
            <span>Комнаты</span>
          </router-link>
        </li>
        <li>
          <router-link to="/security" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/security') }">
            <i class="fas fa-shield-alt mr-2"></i>
            <span>Безопасность</span>
          </router-link>
        </li>
        <li>
          <router-link to="/scenarios" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/scenarios') }">
            <i class="fas fa-magic mr-2"></i>
            <span>Сценарии</span>
          </router-link>
        </li>
        <li>
          <router-link to="/history" class="flex items-center p-2 rounded-lg hover:bg-blue-50" :class="{ 'bg-blue-100 text-blue-600': isActive('/history') }">
            <i class="fas fa-history mr-2"></i>
            <span>История</span>
          </router-link>
        </li>
        <li>
          <SidebarItem 
            to="/settings" 
            icon="fa-cog"
            label="Настройки" 
          />
        </li>
        <li>
          <SidebarItem 
            to="/server-settings" 
            icon="fa-server"
            label="Настройки сервера" 
          />
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  methods: {
    isActive(route) {
      return this.$route.path === route
    }
  }
}
</script> 