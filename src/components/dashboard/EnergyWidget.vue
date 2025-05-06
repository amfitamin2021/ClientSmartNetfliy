<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold">Энергопотребление</h3>
      <div class="flex gap-2">
        <button 
          v-for="period in periods" 
          :key="period.value"
          class="px-3 py-1 rounded-lg text-sm"
          :class="selectedPeriod === period.value 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-gray-600'"
          @click="changePeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    <div id="energy-chart" class="h-64 rounded-lg">
      <!-- Здесь будет график энергопотребления -->
      <canvas ref="energyChart"></canvas>
    </div>
    <div class="mt-4 flex justify-between text-sm text-gray-500">
      <div>
        <div>Сегодня: <span class="font-bold">{{ todayUsage }} кВт·ч</span></div>
        <div>За {{ periodLabels[selectedPeriod] }}: <span class="font-bold">{{ periodUsage }} кВт·ч</span></div>
      </div>
      <div class="text-right">
        <div>Стоимость сегодня: <span class="font-bold">{{ todayCost }} ₽</span></div>
        <div>Прогноз на месяц: <span class="font-bold">{{ monthlyCost }} ₽</span></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EnergyWidget',
  data() {
    return {
      selectedPeriod: 'day',
      periods: [
        { value: 'day', label: 'День' },
        { value: 'week', label: 'Неделя' },
        { value: 'month', label: 'Месяц' }
      ],
      periodLabels: {
        day: 'день',
        week: 'неделю',
        month: 'месяц'
      },
      todayUsage: '3.2',
      periodUsage: '3.2',
      todayCost: '25.60',
      monthlyCost: '780',
      chart: null
    }
  },
  methods: {
    changePeriod(period) {
      this.selectedPeriod = period
      this.updateChart()
      
      // Обновляем значения в зависимости от выбранного периода
      if (period === 'day') {
        this.periodUsage = '3.2'
      } else if (period === 'week') {
        this.periodUsage = '22.5'
      } else if (period === 'month') {
        this.periodUsage = '96.3'
      }
    },
    updateChart() {
      // В реальном приложении здесь будет загрузка данных для графика
      // и обновление графика
      console.log(`Обновление графика для периода: ${this.selectedPeriod}`)
    },
    initChart() {
      // В реальном приложении здесь будет инициализация графика
      // с использованием библиотеки Chart.js или ApexCharts
      console.log('Инициализация графика энергопотребления')
      
      // Здесь будет код для создания графика, например:
      // this.chart = new Chart(this.$refs.energyChart, {
      //   type: 'line',
      //   data: { ... },
      //   options: { ... }
      // })
    },
    fetchEnergyData() {
      // Здесь будет вызов API для получения данных об энергопотреблении
      console.log('Загрузка данных об энергопотреблении')
    }
  },
  mounted() {
    this.fetchEnergyData()
    this.initChart()
  },
  beforeUnmount() {
    // Уничтожаем график перед удалением компонента
    if (this.chart) {
      this.chart.destroy()
    }
  }
}
</script> 