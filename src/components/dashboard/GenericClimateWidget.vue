<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center gap-2">
        <i class="text-blue-600 fas fa-cloud"></i>
        <h3 class="text-lg font-semibold">{{ device?.name || 'Климатическое устройство' }}</h3>
      </div>
    </div>

    <div class="flex justify-center items-center p-8">
      <div class="text-center">
        <i class="fas fa-thermometer-half text-4xl text-blue-500 mb-3"></i>
        <p class="text-gray-500">Информация об устройстве недоступна</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  deviceId: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
/* Дополнительные стили, если необходимо */
</style> 