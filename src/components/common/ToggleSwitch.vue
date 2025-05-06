<template>
  <label class="toggle-switch">
    <input 
      type="checkbox" 
      :checked="modelValue" 
      @change="updateValue"
      :disabled="disabled"
      class="toggle-switch-checkbox"
    >
    <div class="toggle-switch-slider"></div>
  </label>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'input']);

function updateValue(event) {
  const value = event.target.checked;
  emit('update:modelValue', value);
  emit('input', value);
}
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: .3s;
  border-radius: 24px;
}

.toggle-switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-switch-slider {
  background-color: #3b82f6;
}

input:disabled + .toggle-switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

input:checked + .toggle-switch-slider:before {
  transform: translateX(20px);
}
</style> 