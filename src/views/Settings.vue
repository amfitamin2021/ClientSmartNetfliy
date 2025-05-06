<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Настройки</h1>
      <p class="text-gray-500">Управление настройками системы и пользователя</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Меню настроек -->
      <div class="md:col-span-1">
        <div class="bg-white rounded-xl shadow-sm p-4">
          <ul>
            <li 
              v-for="(section, index) in sections" 
              :key="index"
              @click="activeSection = section.id"
              class="py-2 px-3 my-1 rounded-lg cursor-pointer"
              :class="activeSection === section.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'"
            >
              <div class="flex items-center">
                <i class="mr-3" :class="section.icon"></i>
                {{ section.title }}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Содержимое настроек -->
      <div class="md:col-span-3">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <!-- Системные настройки -->
          <div v-if="activeSection === 'system'">
            <h2 class="text-xl font-semibold mb-6">Системные настройки</h2>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <div>
                  <h3 class="font-medium">Темная тема</h3>
                  <p class="text-sm text-gray-500">Переключить интерфейс на тёмный режим</p>
                </div>
                <div class="relative inline-block w-12 align-middle select-none">
                  <input 
                    type="checkbox" 
                    v-model="darkMode" 
                    class="sr-only"
                    @change="toggleDarkMode"
                  />
                  <div class="block bg-gray-300 w-12 h-7 rounded-full"></div>
                  <div 
                    class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform"
                    :class="darkMode ? 'translate-x-5' : 'translate-x-0'"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <div>
                  <h3 class="font-medium">Автоматические обновления</h3>
                  <p class="text-sm text-gray-500">Автоматически проверять и устанавливать обновления</p>
                </div>
                <div class="relative inline-block w-12 align-middle select-none">
                  <input 
                    type="checkbox" 
                    v-model="autoUpdate" 
                    class="sr-only"
                  />
                  <div class="block bg-gray-300 w-12 h-7 rounded-full"></div>
                  <div 
                    class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform"
                    :class="autoUpdate ? 'translate-x-5' : 'translate-x-0'"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Часовой пояс</h3>
              <select class="w-full px-3 py-2 border rounded-lg bg-white">
                <option value="Europe/Moscow">Москва (GMT+3)</option>
                <option value="Europe/Kaliningrad">Калининград (GMT+2)</option>
                <option value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</option>
                <option value="Asia/Novosibirsk">Новосибирск (GMT+7)</option>
                <option value="Asia/Vladivostok">Владивосток (GMT+10)</option>
              </select>
            </div>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Язык</h3>
              <select class="w-full px-3 py-2 border rounded-lg bg-white">
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          
          <!-- Настройки уведомлений -->
          <div v-if="activeSection === 'notifications'">
            <h2 class="text-xl font-semibold mb-6">Уведомления</h2>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <div>
                  <h3 class="font-medium">Push-уведомления</h3>
                  <p class="text-sm text-gray-500">Получать уведомления в браузере</p>
                </div>
                <div class="relative inline-block w-12 align-middle select-none">
                  <input 
                    type="checkbox" 
                    v-model="pushNotifications" 
                    class="sr-only"
                  />
                  <div class="block bg-gray-300 w-12 h-7 rounded-full"></div>
                  <div 
                    class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform"
                    :class="pushNotifications ? 'translate-x-5' : 'translate-x-0'"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <div>
                  <h3 class="font-medium">Email-уведомления</h3>
                  <p class="text-sm text-gray-500">Получать уведомления на email</p>
                </div>
                <div class="relative inline-block w-12 align-middle select-none">
                  <input 
                    type="checkbox" 
                    v-model="emailNotifications" 
                    class="sr-only"
                  />
                  <div class="block bg-gray-300 w-12 h-7 rounded-full"></div>
                  <div 
                    class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform"
                    :class="emailNotifications ? 'translate-x-5' : 'translate-x-0'"
                  ></div>
                </div>
              </div>
            </div>
            
            <h3 class="font-medium mb-4 mt-6">Получать уведомления о:</h3>
            
            <div class="space-y-3">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="notify-devices" 
                  v-model="notifyDevices" 
                  class="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label for="notify-devices" class="ml-2">Активности устройств</label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="notify-warnings" 
                  v-model="notifyWarnings" 
                  class="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label for="notify-warnings" class="ml-2">Предупреждениях и сбоях</label>
              </div>
              
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="notify-system" 
                  v-model="notifySystem" 
                  class="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label for="notify-system" class="ml-2">Системных событиях</label>
              </div>
            </div>
          </div>
          
          <!-- Настройки безопасности -->
          <div v-if="activeSection === 'security'">
            <h2 class="text-xl font-semibold mb-6">Безопасность</h2>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Изменить пароль</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Текущий пароль</label>
                  <input 
                    type="password" 
                    v-model="currentPassword" 
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Новый пароль</label>
                  <input 
                    type="password" 
                    v-model="newPassword" 
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Подтвердите новый пароль</label>
                  <input 
                    type="password" 
                    v-model="confirmPassword" 
                    class="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Сохранить новый пароль
                </button>
              </div>
            </div>
            
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <div>
                  <h3 class="font-medium">Двухфакторная аутентификация</h3>
                  <p class="text-sm text-gray-500">Повысьте безопасность вашего аккаунта</p>
                </div>
                <div class="relative inline-block w-12 align-middle select-none">
                  <input 
                    type="checkbox" 
                    v-model="twoFactorAuth" 
                    class="sr-only"
                  />
                  <div class="block bg-gray-300 w-12 h-7 rounded-full"></div>
                  <div 
                    class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform"
                    :class="twoFactorAuth ? 'translate-x-5' : 'translate-x-0'"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Информация о системе -->
          <div v-if="activeSection === 'about'">
            <h2 class="text-xl font-semibold mb-6">О системе</h2>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Версия системы</h3>
              <p class="text-gray-600">SmartHome v1.0.0</p>
            </div>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Разработчик</h3>
              <p class="text-gray-600">USFX IoT Solutions</p>
            </div>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Лицензия</h3>
              <p class="text-gray-600">MIT License</p>
            </div>
            
            <div class="mb-6">
              <h3 class="font-medium mb-2">Проверить обновления</h3>
              <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Проверить сейчас
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useAppStore } from '@/store'

export default defineComponent({
  name: 'SettingsView',
  
  setup() {
    const appStore = useAppStore()
    
    // Активный раздел настроек
    const activeSection = ref('system')
    
    // Разделы настроек
    const sections = [
      { id: 'system', title: 'Системные', icon: 'fas fa-cog' },
      { id: 'notifications', title: 'Уведомления', icon: 'fas fa-bell' },
      { id: 'security', title: 'Безопасность', icon: 'fas fa-shield-alt' },
      { id: 'about', title: 'О системе', icon: 'fas fa-info-circle' }
    ]
    
    // Настройки системы
    const darkMode = ref(appStore.isDarkMode)
    const autoUpdate = ref(true)
    
    // Настройки уведомлений
    const pushNotifications = ref(true)
    const emailNotifications = ref(false)
    const notifyDevices = ref(true)
    const notifyWarnings = ref(true)
    const notifySystem = ref(false)
    
    // Настройки безопасности
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const twoFactorAuth = ref(false)
    
    const toggleDarkMode = () => {
      appStore.toggleDarkMode()
    }
    
    return {
      activeSection,
      sections,
      darkMode,
      autoUpdate,
      pushNotifications,
      emailNotifications,
      notifyDevices,
      notifyWarnings,
      notifySystem,
      currentPassword,
      newPassword,
      confirmPassword,
      twoFactorAuth,
      toggleDarkMode
    }
  }
})
</script> 