<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold">Освещение</h3>
      <i class="text-yellow-500 fas fa-lightbulb"></i>
    </div>
    <div class="space-y-4">
      <div 
        v-for="light in lights" 
        :key="light.id" 
        class="flex items-center justify-between"
      >
        <span>{{ light.name }}</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            class="sr-only peer" 
            v-model="light.isOn"
            @change="updateLightState(light)"
          >
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div v-if="activeLightsCount > 0" class="pt-2 mt-2 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <span>Яркость</span>
          <span class="text-sm text-gray-500">{{ brightness }}%</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="100" 
          step="10" 
          v-model="brightness"
          @change="updateBrightness" 
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LightingWidget',
  data() {
    return {
      lights: [
        { id: 1, name: 'Гостиная', isOn: true },
        { id: 2, name: 'Кухня', isOn: false },
        { id: 3, name: 'Спальня', isOn: false }
      ],
      brightness: 80
    }
  },
  computed: {
    activeLightsCount() {
      return this.lights.filter(light => light.isOn).length
    }
  },
  methods: {
    updateLightState(light) {
      // В реальном приложении здесь будет вызов API
      console.log(`${light.name}: ${light.isOn ? 'включено' : 'выключено'}`)
    },
    updateBrightness() {
      // В реальном приложении здесь будет вызов API для обновления яркости
      console.log(`Установка яркости: ${this.brightness}%`)
    },
    fetchLightingData() {
      // Здесь будет вызов API для получения состояния освещения
      console.log('Загрузка данных об освещении')
    }
  },
  mounted() {
    this.fetchLightingData()
  }
}
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style> 