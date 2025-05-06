<template>
  <div class="light-visualization">
    <div class="bulb-container">
      <!-- Основа лампы -->
      <div class="bulb-base"></div>
      
      <!-- Колба лампы -->
      <div 
        class="bulb" 
        :class="{ 'active': active }"
        :style="getBulbStyle()"
      >
        <!-- Внутреннее свечение -->
        <div 
          class="bulb-glow"
          :style="getGlowStyle()"
        ></div>
        
        <!-- Отражения -->
        <div class="bulb-reflection"></div>
      </div>
      
      <!-- Эффект свечения вокруг -->
      <div 
        class="light-effect"
        :style="getLightEffectStyle()"
      ></div>
    </div>
    
    <!-- Информация о лампе -->
    <div class="light-info">
      <div class="brightness-value">
        {{ brightness }}%
      </div>
      <div 
        class="color-indicator"
        :style="{ backgroundColor: color }"
      ></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'LightVisualization',
  
  props: {
    // Активна ли лампа
    active: {
      type: Boolean,
      default: false
    },
    // Яркость лампы (0-100)
    brightness: {
      type: Number,
      default: 100
    },
    // Цвет лампы в HEX формате
    color: {
      type: String,
      default: '#FFFFFF'
    },
    // Размер лампы (small, medium, large)
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
  },
  
  setup(props) {
    // Преобразование строки цвета в rgba
    const hexToRgba = (hex, alpha = 1) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    
    // Яркость в диапазоне 0-1 для стилей
    const normalizedBrightness = computed(() => {
      return props.active ? Math.max(0.1, props.brightness / 100) : 0
    })
    
    // Стиль колбы лампы
    const getBulbStyle = () => {
      if (!props.active) return {}
      
      return {
        backgroundColor: hexToRgba(props.color, normalizedBrightness.value * 0.4),
        boxShadow: `0 0 ${normalizedBrightness.value * 20}px ${normalizedBrightness.value * 10}px ${hexToRgba(props.color, normalizedBrightness.value * 0.3)}`
      }
    }
    
    // Стиль внутреннего свечения
    const getGlowStyle = () => {
      if (!props.active) return { opacity: 0 }
      
      return {
        backgroundColor: props.color,
        opacity: normalizedBrightness.value
      }
    }
    
    // Стиль эффекта свечения вокруг
    const getLightEffectStyle = () => {
      if (!props.active) return { opacity: 0 }
      
      return {
        boxShadow: `0 0 ${normalizedBrightness.value * 60}px ${normalizedBrightness.value * 40}px ${hexToRgba(props.color, normalizedBrightness.value * 0.5)}`,
        opacity: normalizedBrightness.value
      }
    }
    
    return {
      normalizedBrightness,
      getBulbStyle,
      getGlowStyle,
      getLightEffectStyle
    }
  }
}
</script>

<style scoped>
.light-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.bulb-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.bulb-base {
  width: 20px;
  height: 10px;
  background-color: #757575;
  border-radius: 0 0 10px 10px;
  z-index: 2;
}

.bulb {
  position: relative;
  width: 60px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50% 50% 12px 12px;
  margin-top: -5px;
  overflow: hidden;
  transition: all 0.3s ease;
  z-index: 1;
}

.bulb.active {
  background-color: rgba(255, 255, 255, 0.9);
}

.bulb-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background-color: #FFF;
  filter: blur(8px);
  opacity: 0;
  transition: all 0.3s ease;
}

.bulb-reflection {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 15px;
  height: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  z-index: 3;
}

.light-effect {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 1px;
  border-radius: 50%;
  background-color: transparent;
  z-index: 0;
  transition: all 0.3s ease;
  opacity: 0;
}

.light-info {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.brightness-value {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  margin-right: 8px;
}

.color-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}
</style> 