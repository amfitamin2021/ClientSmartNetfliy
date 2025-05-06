<template>
  <div class="humidity-info">
    <!-- Заголовок -->
    <div class="info-header">
      <div class="info-title">Информация о влажности</div>
    </div>
    
    <!-- Основная информация -->
    <div class="info-content">
      <!-- Рекомендации -->
      <div class="recommendation">
        <div class="recommendation-icon" :class="recommendationClass">
          <i :class="recommendationIcon"></i>
        </div>
        <div class="recommendation-content">
          <div class="recommendation-title">{{ recommendationTitle }}</div>
          <div class="recommendation-text">{{ recommendationText }}</div>
        </div>
      </div>
      
      <!-- Дополнительная информация -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-title">
            <i class="fas fa-bullseye text-blue-500"></i>
            <span>Оптимальный уровень</span>
          </div>
          <div class="info-card-value">40-60%</div>
          <div class="info-card-desc">Комфортный для человека</div>
        </div>
        
        <div class="info-card">
          <div class="info-card-title">
            <i class="fas fa-tachometer-alt text-blue-500"></i>
            <span>Изменение</span>
          </div>
          <div class="info-card-value">
            <span :class="trendClass">{{ trendValue }}</span>
          </div>
          <div class="info-card-desc">За последние 24 часа</div>
        </div>
        
        <div class="info-card">
          <div class="info-card-title">
            <i class="fas fa-thermometer-half text-blue-500"></i>
            <span>Влияние температуры</span>
          </div>
          <div class="info-card-value">{{ tempEffect }}</div>
          <div class="info-card-desc">{{ tempAdvice }}</div>
        </div>
        
        <div class="info-card">
          <div class="info-card-title">
            <i class="fas fa-calendar-day text-blue-500"></i>
            <span>Средняя влажность</span>
          </div>
          <div class="info-card-value">{{ averageValue }}%</div>
          <div class="info-card-desc">За неделю</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'HumidityInfo',
  props: {
    humidity: {
      type: [Number, String],
      default: 0
    },
    temperature: {
      type: [Number, String],
      default: 22
    },
    trend: {
      type: [Number, String],
      default: 0
    }
  },
  setup(props) {
    const humidityValue = computed(() => {
      return typeof props.humidity === 'string' ? parseFloat(props.humidity) || 0 : props.humidity
    })
    
    const temperatureValue = computed(() => {
      return typeof props.temperature === 'string' ? parseFloat(props.temperature) || 22 : props.temperature
    })
    
    const trendValue = computed(() => {
      const trend = typeof props.trend === 'string' ? parseFloat(props.trend) || 0 : props.trend
      if (trend > 0) return `+${trend}%`
      if (trend < 0) return `${trend}%`
      return 'Стабильно'
    })
    
    const trendClass = computed(() => {
      const trend = typeof props.trend === 'string' ? parseFloat(props.trend) || 0 : props.trend
      if (trend > 5) return 'text-red-500'
      if (trend > 0) return 'text-orange-500'
      if (trend < -5) return 'text-blue-500'
      if (trend < 0) return 'text-blue-400'
      return 'text-green-500'
    })
    
    // Рекомендации на основе влажности
    const recommendationInfo = computed(() => {
      const humidity = humidityValue.value
      
      if (humidity < 30) {
        return {
          title: 'Очень сухой воздух',
          text: 'Рекомендуется увлажнение воздуха для предотвращения сухости кожи и раздражения дыхательных путей.',
          icon: 'fas fa-exclamation-triangle',
          class: 'bg-red-100 text-red-500'
        }
      } else if (humidity < 40) {
        return {
          title: 'Пониженная влажность',
          text: 'Для комфорта рекомендуется увлажнение воздуха. Это особенно важно в отопительный сезон.',
          icon: 'fas fa-info-circle',
          class: 'bg-orange-100 text-orange-500'
        }
      } else if (humidity <= 60) {
        return {
          title: 'Оптимальная влажность',
          text: 'Текущий уровень влажности оптимален для здоровья и комфорта человека.',
          icon: 'fas fa-check-circle',
          class: 'bg-green-100 text-green-500'
        }
      } else if (humidity <= 70) {
        return {
          title: 'Повышенная влажность',
          text: 'Рекомендуется периодическое проветривание помещения для снижения уровня влажности.',
          icon: 'fas fa-info-circle',
          class: 'bg-orange-100 text-orange-500'
        }
      } else {
        return {
          title: 'Высокая влажность',
          text: 'Рекомендуется использование осушителя воздуха для предотвращения появления плесени и грибка.',
          icon: 'fas fa-exclamation-triangle',
          class: 'bg-red-100 text-red-500'
        }
      }
    })
    
    const recommendationTitle = computed(() => recommendationInfo.value.title)
    const recommendationText = computed(() => recommendationInfo.value.text)
    const recommendationIcon = computed(() => recommendationInfo.value.icon)
    const recommendationClass = computed(() => recommendationInfo.value.class)
    
    // Влияние температуры на влажность
    const tempEffect = computed(() => {
      const temp = temperatureValue.value
      const humidity = humidityValue.value
      
      if (temp < 18) return 'Холодно'
      if (temp > 25) return 'Тепло'
      return 'Нормально'
    })
    
    const tempAdvice = computed(() => {
      const temp = temperatureValue.value
      const humidity = humidityValue.value
      
      if (temp < 18 && humidity > 60) return 'Повышайте температуру для снижения влажности'
      if (temp > 25 && humidity < 40) return 'Понижайте температуру для повышения влажности'
      return 'Температура в комфортном диапазоне'
    })
    
    // Средняя влажность (симуляция данных)
    const averageValue = computed(() => {
      // В реальном приложении здесь был бы расчет на основе исторических данных
      return Math.round(humidityValue.value * 0.9 + 5)
    })
    
    return {
      humidityValue,
      recommendationTitle,
      recommendationText,
      recommendationIcon,
      recommendationClass,
      trendValue,
      trendClass,
      tempEffect,
      tempAdvice,
      averageValue
    }
  }
})
</script>

<style scoped>
.humidity-info {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 8px;
}

.info-header {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  background-color: #f8fafc;
}

.info-title {
  font-weight: 600;
  color: #334155;
  font-size: 12px;
}

.info-content {
  padding: 8px 12px;
}

.recommendation {
  display: flex;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.recommendation-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.recommendation-icon i {
  font-size: 14px;
}

.recommendation-content {
  flex-grow: 1;
}

.recommendation-title {
  font-weight: 600;
  margin-bottom: 2px;
  color: #334155;
  font-size: 12px;
}

.recommendation-text {
  color: #64748b;
  font-size: 11px;
  line-height: 1.3;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.info-card {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 8px;
}

.info-card-title {
  display: flex;
  align-items: center;
  color: #64748b;
  font-size: 11px;
  margin-bottom: 4px;
}

.info-card-title i {
  margin-right: 4px;
  font-size: 10px;
}

.info-card-value {
  font-weight: 600;
  font-size: 14px;
  color: #334155;
  margin-bottom: 2px;
}

.info-card-desc {
  font-size: 10px;
  color: #94a3b8;
}
</style> 