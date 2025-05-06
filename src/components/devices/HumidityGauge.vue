<template>
  <div class="humidity-gauge" :class="{ 'animate-pulse': loading }">
    <div class="gauge-container">
      <svg :width="size" :height="size" viewBox="0 0 120 120">
        <!-- Фоновый круг -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#e2e8f0" 
          :stroke-width="strokeWidth"
          class="gauge-bg"
        />
        
        <!-- Цветовые зоны -->
        <!-- Сухая зона (0-30%) - красная -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#ef4444" 
          :stroke-width="strokeWidth"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getOffsetForZone(0, 30)"
          stroke-linecap="round"
          class="gauge-zone"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Пониженная влажность (30-40%) - оранжевая -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#f59e0b" 
          :stroke-width="strokeWidth"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getOffsetForZone(30, 40)"
          stroke-linecap="round"
          class="gauge-zone"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Оптимальная влажность (40-60%) - зеленая -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#10b981" 
          :stroke-width="strokeWidth"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getOffsetForZone(40, 60)"
          stroke-linecap="round"
          class="gauge-zone"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Повышенная влажность (60-70%) - оранжевая -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#f59e0b" 
          :stroke-width="strokeWidth"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getOffsetForZone(60, 70)"
          stroke-linecap="round"
          class="gauge-zone"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Высокая влажность (70-100%) - красная -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none" 
          stroke="#ef4444" 
          :stroke-width="strokeWidth"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getOffsetForZone(70, 100)"
          stroke-linecap="round"
          class="gauge-zone"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Индикатор текущего значения -->
        <circle 
          cx="60" 
          cy="60" 
          :r="radius" 
          fill="none"
          :stroke="getValueColor(actualValue)" 
          :stroke-width="strokeWidth + 2"
          :stroke-dasharray="getCircumference()"
          :stroke-dashoffset="getDashOffset(actualValue)"
          stroke-linecap="round"
          class="gauge-indicator"
          transform="rotate(-90, 60, 60)"
        />
        
        <!-- Маркеры значений -->
        <g class="gauge-markers">
          <line 
            v-for="marker in [0, 25, 50, 75, 100]" 
            :key="marker"
            :x1="getMarkerX1(marker)"
            :y1="getMarkerY1(marker)"
            :x2="getMarkerX2(marker)"
            :y2="getMarkerY2(marker)"
            :stroke="marker >= 40 && marker <= 60 ? '#10b981' : '#94a3b8'"
            stroke-width="2"
            transform="rotate(-90, 60, 60)"
          />
        </g>
        
        <!-- Центральный круг и значение -->
        <circle cx="60" cy="60" :r="centerRadius" fill="white" class="center-circle" />
        
        <!-- Иконка влажности -->
        <text x="60" y="52" dominant-baseline="middle" text-anchor="middle" class="icon-text" :style="{ fontSize: iconFontSize + 'px' }">💧</text>
        
        <!-- Значение -->
        <text 
          x="60" 
          y="75" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          :fill="getValueColor(actualValue)"
          class="value-text"
          :style="{ fontSize: valueFontSize + 'px' }"
        >
          {{ formatValue(actualValue) }}%
        </text>
      </svg>
    </div>
    
    <div class="gauge-status">
      <div class="gauge-label" :style="{ fontSize: (size / 10) + 'px' }">{{ label }}</div>
      <div class="gauge-description" :style="{ color: getValueColor(actualValue), fontSize: (size / 8.5) + 'px' }">
        {{ getStatusText(actualValue) }}
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch } from 'vue'
import { useTransition } from '@vueuse/core'

export default defineComponent({
  name: 'HumidityGauge',
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    size: {
      type: Number,
      default: 120
    },
    label: {
      type: String,
      default: 'Влажность'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const initialValue = typeof props.value === 'string' ? parseFloat(props.value) || 0 : props.value
    
    // Используем анимацию для плавного изменения значения
    const targetValue = ref(initialValue)
    const actualValue = useTransition(targetValue, {
      duration: 1000,
      transition: [0.25, 0.1, 0.25, 1.0] // cubic-bezier
    })
    
    // Следим за изменениями значения
    watch(() => props.value, (newValue) => {
      targetValue.value = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue
    }, { immediate: true })
    
    // Параметры шкалы
    const radius = computed(() => props.size / 2.4)
    const strokeWidth = computed(() => props.size / 12)
    
    // Размеры центрального круга
    const centerRadius = computed(() => props.size / 3)
    
    // Размеры текста
    const iconFontSize = computed(() => Math.max(16, props.size / 5))
    const valueFontSize = computed(() => Math.max(12, props.size / 7.5))
    
    // Получить длину окружности
    const getCircumference = () => {
      return 2 * Math.PI * radius.value
    }
    
    // Получить смещение для определенного значения (0-100%)
    const getDashOffset = (value) => {
      const circumference = getCircumference()
      const percentValue = Math.max(0, Math.min(value, 100))
      return circumference - (circumference * percentValue / 100)
    }
    
    // Получить смещение для цветовой зоны
    const getOffsetForZone = (start, end) => {
      const circumference = getCircumference()
      const zoneLength = (end - start) / 100 * circumference
      const startOffset = getDashOffset(start)
      return startOffset - zoneLength
    }
    
    // Цвет для текущего значения
    const getValueColor = (value) => {
      if (value < 30) return '#ef4444' // красный
      if (value < 40) return '#f59e0b' // оранжевый
      if (value <= 60) return '#10b981' // зеленый
      if (value <= 70) return '#f59e0b' // оранжевый
      return '#ef4444' // красный
    }
    
    // Текстовое описание статуса
    const getStatusText = (value) => {
      if (value < 30) return 'Слишком сухо'
      if (value < 40) return 'Сухо'
      if (value <= 60) return 'Оптимально'
      if (value <= 70) return 'Повышенная'
      return 'Высокая'
    }
    
    // Форматирование значения
    const formatValue = (value) => {
      return Math.round(value)
    }
    
    // Координаты для маркеров
    const getMarkerX1 = (percent) => {
      return 60 + (radius.value - 15) * Math.cos(2 * Math.PI * percent / 100)
    }
    
    const getMarkerY1 = (percent) => {
      return 60 + (radius.value - 15) * Math.sin(2 * Math.PI * percent / 100)
    }
    
    const getMarkerX2 = (percent) => {
      return 60 + (radius.value + 5) * Math.cos(2 * Math.PI * percent / 100)
    }
    
    const getMarkerY2 = (percent) => {
      return 60 + (radius.value + 5) * Math.sin(2 * Math.PI * percent / 100)
    }
    
    return {
      actualValue,
      radius,
      strokeWidth,
      centerRadius,
      iconFontSize,
      valueFontSize,
      getCircumference,
      getDashOffset,
      getOffsetForZone,
      getValueColor,
      getStatusText,
      formatValue,
      getMarkerX1,
      getMarkerY1,
      getMarkerX2,
      getMarkerY2
    }
  }
})
</script>

<style scoped>
.humidity-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-container {
  position: relative;
  margin-bottom: 8px;
}

.center-circle {
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1));
}

.gauge-bg {
  opacity: 0.3;
}

.gauge-zone {
  opacity: 0.5;
}

.gauge-indicator {
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.2));
}

.icon-text {
  font-size: 24px;
}

.value-text {
  font-size: 16px;
  font-weight: 600;
}

.gauge-status {
  text-align: center;
}

.gauge-label {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 2px;
}

.gauge-description {
  font-weight: 600;
  font-size: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .gauge-indicator {
    transition: none;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style> 