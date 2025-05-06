<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Регистрация в Smart Home
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Уже есть аккаунт?
          <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            Войти
          </router-link>
        </p>
      </div>
      
      <div v-if="error" class="rounded-md bg-red-50 p-4 mb-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Ошибка регистрации</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="success" class="rounded-md bg-green-50 p-4 mb-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">Регистрация успешна</h3>
            <div class="mt-2 text-sm text-green-700">
              <p>{{ success }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="register">
        <div class="space-y-3">
          <div>
            <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Имя пользователя</label>
            <div class="mt-1">
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                v-model="form.username"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Имя пользователя"
              />
            </div>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium leading-6 text-gray-900">Email</label>
            <div class="mt-1">
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                v-model="form.email"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Email"
              />
            </div>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Пароль</label>
            <div class="mt-1">
              <input 
                id="password" 
                name="password" 
                type="password" 
                required
                v-model="form.password"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Пароль"
              />
            </div>
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium leading-6 text-gray-900">Подтверждение пароля</label>
            <div class="mt-1">
              <input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required
                v-model="form.confirmPassword"
                class="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Подтверждение пароля"
              />
            </div>
          </div>
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading"
            class="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <span v-if="loading">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Регистрация...
            </span>
            <span v-else>
              Зарегистрироваться
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    const form = ref({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    
    async function register() {
      try {
        // Валидация паролей
        if (form.value.password !== form.value.confirmPassword) {
          error.value = 'Пароли не совпадают'
          return
        }
        
        loading.value = true
        error.value = ''
        success.value = ''
        
        // Подготовка данных для регистрации
        const userData = {
          username: form.value.username,
          email: form.value.email,
          password: form.value.password,
          roles: ['user'] // По умолчанию регистрируем как обычного пользователя
        }
        
        // Вызов API регистрации
        const response = await userStore.register(userData)
        
        // Успешная регистрация
        success.value = response.message || 'Регистрация успешна! Теперь вы можете войти.'
        
        // Сброс формы
        form.value = {
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
        
        // Перенаправление на страницу входа через 2 секунды
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        
      } catch (err) {
        error.value = err.response?.data?.message || 'Ошибка при регистрации. Попробуйте еще раз.'
        console.error('Ошибка регистрации:', err)
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      loading,
      error,
      success,
      register
    }
  }
}
</script>