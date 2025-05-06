<template>
  <div class="p-6">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold">Сценарии</h1>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">Создать сценарий</button>
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else>
      <!-- Активные сценарии -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Активные сценарии</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="scenario in activeScenarios" 
            :key="scenario.id"
            class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold">{{ scenario.name }}</h3>
              <div class="flex gap-2">
                <button class="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <i class="fas fa-pen-to-square"></i>
                </button>
                <button 
                  class="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                  @click="toggleScenario(scenario.id)"
                >
                  <i class="fas fa-toggle-on"></i>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              Условие: {{ getConditionText(scenario) }}
            </div>
            <div class="text-sm text-gray-600">
              Действие: {{ getActionText(scenario) }}
            </div>
          </div>
          
          <div v-if="activeScenarios.length === 0" class="col-span-full text-center py-4 text-gray-500">
            Нет активных сценариев
          </div>
        </div>
      </div>
      
      <!-- Неактивные сценарии -->
      <div>
        <h2 class="text-xl font-semibold mb-4">Отключенные сценарии</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="scenario in inactiveScenarios" 
            :key="scenario.id"
            class="bg-white p-6 rounded-xl shadow-sm opacity-70"
          >
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold">{{ scenario.name }}</h3>
              <div class="flex gap-2">
                <button class="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                  <i class="fas fa-pen-to-square"></i>
                </button>
                <button 
                  class="p-2 text-gray-600 hover:bg-gray-50 rounded-full"
                  @click="toggleScenario(scenario.id)"
                >
                  <i class="fas fa-toggle-off"></i>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              Условие: {{ getConditionText(scenario) }}
            </div>
            <div class="text-sm text-gray-600">
              Действие: {{ getActionText(scenario) }}
            </div>
          </div>
          
          <div v-if="inactiveScenarios.length === 0" class="col-span-full text-center py-4 text-gray-500">
            Нет отключенных сценариев
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useScenariosStore } from '@/store'

export default defineComponent({
  name: 'ScenariosView',
  
  setup() {
    const scenariosStore = useScenariosStore()
    
    const loading = computed(() => scenariosStore.loading)
    const error = computed(() => scenariosStore.error)
    
    const activeScenarios = computed(() => 
      scenariosStore.scenarios.filter(s => s.isActive)
    )
    
    const inactiveScenarios = computed(() => 
      scenariosStore.scenarios.filter(s => !s.isActive)
    )
    
    const toggleScenario = (id) => {
      scenariosStore.toggleScenario(id)
    }
    
    const getConditionText = (scenario) => {
      switch(scenario.trigger) {
        case 'time':
          return `В ${scenario.conditions[0]}`
        case 'weather':
          return `При ${scenario.conditions[0] === 'rain' ? 'дожде' : scenario.conditions[0]}`
        case 'location':
          return `Когда ${scenario.conditions[0] === 'away' ? 'никого нет дома' : 'все дома'}`
        default:
          return scenario.conditions.join(', ')
      }
    }
    
    const getActionText = (scenario) => {
      // В реальном приложении здесь нужно будет описать действия
      return 'Выполнить заданные действия'
    }
    
    onMounted(() => {
      scenariosStore.fetchScenarios()
    })
    
    return {
      loading,
      error,
      activeScenarios,
      inactiveScenarios,
      toggleScenario,
      getConditionText,
      getActionText
    }
  }
})
</script> 