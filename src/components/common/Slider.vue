<template>
  <div class="slider-container">
    <div class="slider-labels" v-if="showLabels">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
    <input 
      type="range" 
      class="slider" 
      :min="min" 
      :max="max" 
      :step="step" 
      :value="modelValue" 
      @input="updateValue"
      :disabled="disabled"
    />
    <div class="slider-value" v-if="showValue">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  step: {
    type: Number,
    default: 1
  },
  unit: {
    type: String,
    default: ''
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  showValue: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'input']);

const displayValue = computed(() => {
  return `${props.modelValue}${props.unit}`;
});

function updateValue(event) {
  const value = Number(event.target.value);
  emit('update:modelValue', value);
  emit('input', value);
}
</script>

<style scoped>
.slider-container {
  width: 100%;
  padding: 0.5rem 0;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.75rem;
  color: #718096;
}

.slider {
  width: 100%;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 5px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider:disabled {
  opacity: 0.5;
}

.slider:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

.slider:disabled::-moz-range-thumb {
  cursor: not-allowed;
}

.slider-value {
  text-align: center;
  margin-top: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
</style> 