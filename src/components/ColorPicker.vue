<template>
  <div class="color-picker">
    <div class="color-preview" :style="{ backgroundColor: value }" @click="showPicker = !showPicker"></div>
    
    <div v-if="showPicker" class="color-picker-popup">
      <div class="picker-header">
        <span>Выберите цвет</span>
        <button @click="showPicker = false" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="color-grid">
        <div 
          v-for="(color, index) in predefinedColors" 
          :key="index" 
          class="color-item"
          :style="{ backgroundColor: color }"
          @click="selectColor(color)"
        ></div>
      </div>
      
      <div class="custom-color-input">
        <input 
          type="text" 
          v-model="customColor" 
          placeholder="#RRGGBB"
          @change="validateAndSelectColor"
        />
        <button @click="validateAndSelectColor" class="apply-button">
          <i class="fas fa-check"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, defineComponent, watch } from 'vue'

export default defineComponent({
  name: 'ColorPicker',
  
  props: {
    value: {
      type: String,
      default: '#FFFFFF'
    }
  },
  
  emits: ['input'],
  
  setup(props, { emit }) {
    const showPicker = ref(false)
    const customColor = ref(props.value)
    
    // Предопределенные цвета для быстрого выбора
    const predefinedColors = [
      '#FFFFFF', // Белый
      '#F8F8FF', // Холодный белый
      '#FFF8DC', // Теплый белый
      '#FF0000', // Красный
      '#00FF00', // Зеленый
      '#0000FF', // Синий
      '#FFFF00', // Желтый
      '#FF00FF', // Пурпурный
      '#00FFFF', // Голубой
      '#FFA500', // Оранжевый
      '#800080', // Фиолетовый
      '#008000', // Темно-зеленый
      '#000080', // Темно-синий
      '#FF4500', // Оранжево-красный
      '#4B0082', // Индиго
      '#EE82EE', // Фиолетовый
      '#FF69B4', // Розовый
      '#7CFC00', // Ярко-зеленый
      '#1E90FF', // Ярко-синий
      '#FFD700'  // Золотой
    ]
    
    // Выбор цвета
    const selectColor = (color) => {
      emit('input', color)
      customColor.value = color
      showPicker.value = false
    }
    
    // Проверка и применение пользовательского цвета
    const validateAndSelectColor = () => {
      // Проверяем формат HEX
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      
      if (hexRegex.test(customColor.value)) {
        selectColor(customColor.value)
      } else {
        // Если формат неверный, добавляем # или преобразуем в правильный формат
        if (!customColor.value.startsWith('#')) {
          customColor.value = '#' + customColor.value
        }
        
        // Повторная проверка
        if (hexRegex.test(customColor.value)) {
          selectColor(customColor.value)
        } else {
          alert('Пожалуйста, введите цвет в формате #RRGGBB')
          customColor.value = props.value
        }
      }
    }
    
    // Следим за изменением значения извне
    watch(() => props.value, (newValue) => {
      customColor.value = newValue
    })
    
    return {
      showPicker,
      customColor,
      predefinedColors,
      selectColor,
      validateAndSelectColor
    }
  }
})
</script>

<style scoped>
.color-picker {
  position: relative;
  display: inline-block;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-picker-popup {
  position: absolute;
  top: 45px;
  left: 0;
  z-index: 100;
  width: 250px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 10px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.close-button:hover {
  color: #333;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.color-item {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  transition: transform 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.custom-color-input {
  display: flex;
  gap: 5px;
}

.custom-color-input input {
  flex-grow: 1;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.apply-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0 10px;
  cursor: pointer;
}

.apply-button:hover {
  background-color: #45a049;
}
</style> 