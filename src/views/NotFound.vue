<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6">
    <div class="text-9xl font-bold text-gray-200">404</div>
    <h1 class="text-2xl font-bold mb-4">Страница не найдена</h1>
    <p class="text-gray-600 mb-8">Извините, запрашиваемая страница не существует.</p>
    <router-link to="/" class="px-6 py-3 bg-blue-600 text-white rounded-lg">
      Вернуться на главную
    </router-link>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'NotFound'
})
</script> 