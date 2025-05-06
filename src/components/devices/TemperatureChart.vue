<template>
  <div class="temperature-chart">
    <div class="chart-header">
      <div class="chart-title">История температуры</div>
      <div class="chart-controls">
        <button 
          v-for="period in periods" 
          :key="period.value"
          @click="setInterval(period.value)"
          :class="{ active: currentInterval === period.value }"
          class="interval-btn"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    <div class="chart-container" :class="{ 'is-loading': loading }">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      <Line
        v-if="!loading && chartData.datasets[0].data.length > 0"
        :data="chartData"
        :options="chartOptions"
        :height="80"
      />
      <div v-else-if="!loading" class="no-data">
        Нет данных за выбранный период
      </div>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, computed, onMounted, watch, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { useDeviceStore } from '@/store/deviceStore'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default defineComponent({
  name: 'TemperatureChart',
  components: { Line },
  props: {
    deviceId: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#EF4444' // Красный цвет для температуры
    },
    updateInterval: {
      type: Number,
      default: 5000
    }
  },
  setup(props) {
    const deviceStore = useDeviceStore()
    const loading = ref(false)
    const temperatureData = ref([])
    const currentInterval = ref('day')
    let updateTimer = null

    const periods = [
      { label: '24ч', value: 'day' },
      { label: '7д', value: 'week' },
      { label: '30д', value: 'month' }
    ]

    const fetchData = async () => {
      try {
        loading.value = true
        const data = await deviceStore.getTemperatureHistory(props.deviceId, currentInterval.value)
        temperatureData.value = data.reverse()
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
        temperatureData.value = []
      } finally {
        loading.value = false
      }
    }

    const startAutoUpdate = () => {
      stopAutoUpdate()
      
      updateTimer = setInterval(async () => {
        if (!loading.value) {
          await fetchData()
        }
      }, props.updateInterval)
    }

    const stopAutoUpdate = () => {
      if (updateTimer) {
        clearInterval(updateTimer)
        updateTimer = null
      }
    }

    const setInterval = (interval) => {
      currentInterval.value = interval
    }

    watch(currentInterval, () => {
      fetchData()
    })

    watch(() => props.deviceId, () => {
      fetchData()
      startAutoUpdate()
    })

    watch(() => props.updateInterval, () => {
      startAutoUpdate()
    })

    onMounted(() => {
      fetchData()
      startAutoUpdate()
    })

    onUnmounted(() => {
      stopAutoUpdate()
    })

    const chartData = computed(() => ({
      labels: temperatureData.value.map(item => item.time),
      datasets: [
        {
          label: 'Температура (°C)',
          data: temperatureData.value.map(item => item.value),
          borderColor: props.color,
          backgroundColor: `${props.color}20`,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: props.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          fill: true,
          borderWidth: 2,
          spanGaps: true,
          decimation: {
            enabled: true,
            algorithm: 'min-max'
          }
        }
      ]
    }))

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: 15,
          suggestedMax: 35,
          grid: {
            display: true,
            color: '#f1f5f9',
            drawBorder: false
          },
          ticks: {
            stepSize: 5,
            font: {
              size: 10
            },
            padding: 8,
            callback: function(value) {
              return value + '°C'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            padding: 8
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        decimation: {
          enabled: true,
          algorithm: 'min-max'
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#334155',
          bodyColor: '#334155',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          usePointStyle: true,
          boxPadding: 6,
          boxWidth: 8,
          boxHeight: 8,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `Температура: ${context.raw}°C`
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }

    return {
      chartData,
      chartOptions,
      loading,
      periods,
      currentInterval,
      setInterval
    }
  }
})
</script>

<style scoped>
.temperature-chart {
  width: 100%;
  margin-top: 8px;
  margin-bottom: 4px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-title {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.chart-controls {
  display: flex;
  gap: 4px;
}

.interval-btn {
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.interval-btn:hover {
  background: #e2e8f0;
}

.interval-btn.active {
  background: #ef4444;
  color: white;
}

.chart-container {
  position: relative;
  height: 80px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #ef4444;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 