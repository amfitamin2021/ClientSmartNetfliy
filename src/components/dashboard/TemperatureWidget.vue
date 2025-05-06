<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div>
        <p class="text-sm text-gray-500">ПКУ</p>
        <div class="flex items-center gap-2">
          <i class="text-blue-600 fas fa-microchip"></i>
          <h3 class="text-lg font-semibold">Датчик температуры</h3>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <p class="text-gray-500">Состояние</p>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" v-model="isEnabled" class="sr-only peer" @change="toggleState">
        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>

    <div class="flex items-start gap-3">
      <div class="relative w-24 h-24">
        <svg class="w-full h-full" viewBox="0 0 120 120">
          <circle
            class="text-gray-100"
            stroke-width="12"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
          />
          <circle
            class="text-blue-600"
            stroke-width="12"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            stroke="currentColor"
            fill="transparent"
            r="54"
            cx="60"
            cy="60"
            transform="rotate(-90, 60, 60)"
          />
          <circle cx="60" cy="60" r="40" fill="white" />
          <text x="60" y="52" dominant-baseline="middle" text-anchor="middle" style="font-size: 24px">🌡️</text>
          <text x="60" y="75" dominant-baseline="middle" text-anchor="middle" :fill="temperatureStatus.color.replace('text-', '')" style="font-size: 16px; font-weight: bold">
            {{ device?.rawProperties?.tb_temperature || '--' }}°C
          </text>
        </svg>
      </div>

      <div class="flex-grow">
        <p class="font-medium text-base mb-1">{{ temperatureStatus.text }}</p>
        <p class="text-sm text-gray-500 mb-3">
          {{ temperatureStatus.recommendation }}
        </p>

        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-gray-500">Заряд:</p>
          <p class="flex items-center gap-1 text-green-500 text-sm bg-green-50 px-2 py-0.5 rounded-full">
            <i class="fas fa-battery-three-quarters text-xs"></i>
            {{ device?.rawProperties?.tb_battery || '--' }}%
          </p>
        </div>

        <div class="flex items-center justify-between mt-2">
          <p class="text-sm text-gray-500">Обновлено:</p>
          <p class="flex items-center gap-1 text-sm">
            {{ formatLastUpdated(device?.rawProperties?.tb_last_updated) }}
            <i class="fas fa-sync-alt cursor-pointer hover:text-blue-600" @click="refreshData"></i>
          </p>
        </div>
      </div>
    </div>

    <button 
      class="w-full py-2 text-blue-600 text-sm flex items-center justify-center gap-1 mt-4"
      @click="showDetails = !showDetails"
    >
      {{ showDetails ? 'Скрыть детали' : 'Показать детали' }}
      <i class="fas" :class="showDetails ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
    </button>

    <div v-if="showDetails">
      <div class="border-t pt-4 mt-2">
        <h4 class="text-gray-700 font-medium mb-2">История температуры</h4>
        <div class="flex gap-2 mb-3">
          <button 
            v-for="period in ['24ч', '7д', '30д']" 
            :key="period"
            @click="setChartPeriod(period)"
            :class="[
              'px-2 py-1 text-sm rounded',
              selectedPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ period }}
          </button>
        </div>
        
        <TemperatureChart 
          :deviceId="deviceId"
          color="#3B82F6"
          :updateInterval="5000"
        />
      </div>

      <div class="mt-4 border-t pt-4">
        <h4 class="text-gray-700 font-medium mb-3">Информация о температуре</h4>
        <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-3">
          <i class="fas fa-check-circle text-blue-500 mt-1"></i>
          <div>
            <p class="text-blue-700 font-medium">{{ temperatureStatus.title }}</p>
            <p class="text-sm text-blue-600">{{ temperatureStatus.detailedMessage }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">
              <i class="fas fa-bullseye text-blue-500 mr-1"></i>
              Оптимальный уровень
            </p>
            <p class="font-medium">20-24°C</p>
            <p class="text-xs text-gray-500">Комфортный для человека</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              <i class="fas fa-exchange-alt text-blue-500 mr-1"></i>
              Изменение
            </p>
            <p class="font-medium" :class="temperatureDelta >= 0 ? 'text-red-500' : 'text-blue-500'">
              {{ temperatureDelta >= 0 ? '+' : '' }}{{ temperatureDelta }}°C
            </p>
            <p class="text-xs text-gray-500">За последние 24 часа</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p class="text-sm text-gray-500">
              <i class="fas fa-snowflake text-blue-500 mr-1"></i>
              Влияние на комфорт
            </p>
            <p class="font-medium">Нормально</p>
            <p class="text-xs text-gray-500">Температура в норме</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              <i class="fas fa-calculator text-blue-500 mr-1"></i>
              Средняя температура
            </p>
            <p class="font-medium">22.5°C</p>
            <p class="text-xs text-gray-500">За неделю</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useDeviceStore } from '@/store/deviceStore'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import TemperatureChart from '@/components/devices/TemperatureChart.vue'

export default {
  name: 'TemperatureWidget',
  components: {
    TemperatureChart
  },
  props: {
    deviceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isEnabled: true,
      showDetails: false,
      circumference: 2 * Math.PI * 54,
      selectedPeriod: '24ч',
      temperatureDelta: -0.5,
      updateInterval: null
    }
  },
  computed: {
    device() {
      return useDeviceStore().getDeviceById(this.deviceId)
    },
    dashOffset() {
      const temperature = this.device?.rawProperties?.tb_temperature || 0
      const percentage = Math.min((temperature / 40) * 100, 100)
      return this.circumference - (percentage / 100) * this.circumference
    },
    temperatureStatus() {
      const temp = this.device?.rawProperties?.tb_temperature
      if (!temp) return {
        text: 'Нет данных',
        color: 'text-gray-500',
        recommendation: 'Проверьте подключение датчика',
        title: 'Данные отсутствуют',
        detailedMessage: 'Устройство не передает данные о температуре'
      }
      
      if (temp > 28) {
        return {
          text: 'Слишком жарко',
          color: 'text-red-500',
          recommendation: 'Рекомендуется включить кондиционер',
          title: 'Высокая температура',
          detailedMessage: 'Текущий уровень температуры может вызвать дискомфорт. Рекомендуется включить кондиционер или открыть окно.'
        }
      }
      if (temp < 18) {
        return {
          text: 'Слишком холодно',
          color: 'text-blue-500',
          recommendation: 'Рекомендуется включить обогреватель',
          title: 'Низкая температура',
          detailedMessage: 'Текущий уровень температуры может вызвать дискомфорт. Рекомендуется включить обогреватель.'
        }
      }
      return {
        text: 'Оптимальная температура',
        color: 'text-green-500',
        recommendation: 'Температура в пределах нормы',
        title: 'Оптимальная температура',
        detailedMessage: 'Текущий уровень температуры оптимален для здоровья и комфорта человека.'
      }
    }
  },
  methods: {
    async toggleState() {
      try {
        await useDeviceStore().updateDeviceProperty(
          this.deviceId,
          'enabled',
          this.isEnabled
        )
      } catch (error) {
        console.error('Ошибка при обновлении состояния:', error)
      }
    },
    formatLastUpdated(timestamp) {
      if (!timestamp) return 'Нет данных'
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ru })
    },
    refreshData() {
      useDeviceStore().fetchDevice(this.deviceId)
    },
    setChartPeriod(period) {
      this.selectedPeriod = period
    },
    startAutoUpdate() {
      this.stopAutoUpdate()
      this.updateInterval = setInterval(() => {
        useDeviceStore().fetchDevice(this.deviceId)
      }, 5000)
    },
    stopAutoUpdate() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    }
  },
  mounted() {
    this.startAutoUpdate()
  },
  beforeUnmount() {
    this.stopAutoUpdate()
  }
}
</script> 