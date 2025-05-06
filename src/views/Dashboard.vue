<template>
  <div class="dashboard-page h-full flex flex-col">
    <!-- Хедер страницы -->
    <div class="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div class="container mx-auto">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-semibold text-gray-800">Дашборд</h1>
          <div class="flex gap-3">
            <button 
              v-if="widgets.length > 0"
              @click="toggleEditMode" 
              class="px-4 py-2 rounded-lg flex items-center"
              :class="{ 
                'bg-yellow-500 hover:bg-yellow-600 text-white': isEditMode,
                'bg-gray-100 hover:bg-gray-200 text-gray-700': !isEditMode
              }"
            >
              <i class="fas mr-2" :class="isEditMode ? 'fa-check' : 'fa-edit'"></i>
              {{ isEditMode ? 'Сохранить' : 'Редактировать' }}
            </button>
            <button 
              @click="refreshData" 
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg flex items-center"
              :disabled="isRefreshing"
            >
              <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': isRefreshing }"></i>
              Обновить
            </button>
            <button 
              @click="showWidgetSelector = true" 
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center"
            >
              <i class="fas fa-plus mr-2"></i>
              Добавить виджет
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Основное содержимое дашборда -->
    <div class="flex-grow bg-gray-50 p-4 overflow-auto">
      <div class="container mx-auto">
        <!-- Загрузка или ошибки -->
        <div v-if="isLoading" class="h-full flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-3 text-gray-600">Загрузка данных...</p>
          </div>
        </div>
        
        <div v-else-if="loadError" class="h-full flex items-center justify-center">
          <div class="text-center p-6 bg-white rounded-lg shadow-sm">
            <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-3"></i>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
            <p class="text-gray-600 mb-4">{{ loadError }}</p>
            <button 
              @click="retryLoading" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Повторить
            </button>
          </div>
        </div>
        
        <!-- Виджеты дашборда -->
        <div v-else>
          <div v-if="widgets.length === 0" class="h-64 flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm">
            <i class="fas fa-th-large text-5xl text-gray-300 mb-4"></i>
            <h2 class="text-xl font-semibold text-gray-700 mb-2">Дашборд пока пуст</h2>
            <p class="text-gray-600 mb-4 text-center max-w-md">
              Добавьте виджеты для отображения ваших устройств и датчиков. Для этого нажмите кнопку "Добавить виджет".
            </p>
            <button 
              @click="showWidgetSelector = true" 
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <i class="fas fa-plus mr-2"></i>
              Добавить виджет
            </button>
          </div>
          
          <!-- Инструкции для режима редактирования -->
          <div v-else-if="isEditMode" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
            <i class="fas fa-info-circle mr-2"></i>
            <span>Используйте мышь, чтобы перемещать виджеты и менять их размер. Нажмите "Сохранить" для применения изменений.</span>
          </div>
          
          <!-- Сетка виджетов с использованием vue-grid-layout -->
          <div v-if="widgets.length > 0">
            <grid-layout
              v-model:layout="layout"
              :col-num="12"
              :row-height="50"
              :is-draggable="isEditMode"
              :is-resizable="isEditMode"
              :vertical-compact="true"
              :use-css-transforms="true"
              :margin="[10, 10]"
              @layout-updated="onLayoutUpdated"
            >
              <grid-item
                v-for="widget in widgets"
                :key="widget.id"
                :x="getWidgetLayout(widget.id).x"
                :y="getWidgetLayout(widget.id).y"
                :w="getWidgetLayout(widget.id).w"
                :h="getWidgetLayout(widget.id).h"
                :i="widget.id"
                :class="{ 'edit-mode': isEditMode }"
              >
                <div class="widget-container h-full">
                  <div class="widget-header">
                    <div class="flex items-center">
                      <h3 class="widget-title">{{ getDeviceName(widget.deviceId) }}</h3>
                    </div>
                    <div class="flex gap-2">
                      <button @click="removeWidget(widget.id)" class="delete-btn">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <div class="widget-content">
                    <!-- Если тип виджета security, используем напрямую SecurityWidget -->
                    <security-widget v-if="widget.type === 'security'" />
                    <!-- Для остальных виджетов используем DeviceWidget -->
                    <device-widget
                      v-else
                      :device-id="widget.deviceId"
                      :widget-id="widget.id"
                    />
                  </div>
                </div>
              </grid-item>
            </grid-layout>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для выбора виджета -->
    <widget-selector 
      v-if="showWidgetSelector" 
      @close="showWidgetSelector = false"
      @widget-added="onWidgetAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDashboardStore } from '../store/dashboardStore';
import { useDeviceStore } from '../store/deviceStore';
import DeviceWidget from '../components/dashboard/DeviceWidget.vue';
import SecurityWidget from '../components/dashboard/SecurityWidget.vue';
import WidgetSelector from '../components/dashboard/WidgetSelector.vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

const dashboardStore = useDashboardStore();
const deviceStore = useDeviceStore();

// Состояние UI
const showWidgetSelector = ref(false);
const isLoading = ref(true);
const loadError = ref(null);
const isRefreshing = ref(false);
const isEditMode = ref(false);

// Получение данных из хранилища
const widgets = computed(() => dashboardStore.widgets);

// Настройки Layout для виджетов
const layout = ref([]);
const defaultWidgetWidth = 4;
const defaultWidgetHeight = 6;

// Функция для получения макета виджета по ID
function getWidgetLayout(widgetId) {
  const widgetLayout = layout.value.find(item => item.i === widgetId);
  if (widgetLayout) {
    return widgetLayout;
  }
  
  // Если не найден, создаем новый с дефолтными значениями
  const newLayout = {
    i: widgetId,
    x: 0,
    y: 0,
    w: defaultWidgetWidth,
    h: defaultWidgetHeight
  };
  
  // Ищем свободное место для виджета
  const maxY = layout.value.length > 0 
    ? Math.max(...layout.value.map(item => item.y + item.h))
    : 0;
  
  newLayout.y = maxY;
  
  return newLayout;
}

// Обработчик обновления макета
function onLayoutUpdated(newLayout) {
  layout.value = newLayout;
  saveWidgetLayout();
}

// Функция переключения режима редактирования
function toggleEditMode() {
  if (isEditMode.value) {
    saveWidgetLayout();
  }
  
  isEditMode.value = !isEditMode.value;
}

// Ключ для хранения макета виджетов
const WIDGET_LAYOUT_KEY = 'dashboard_widget_layout';

// Сохранение макета виджетов
function saveWidgetLayout() {
  localStorage.setItem(WIDGET_LAYOUT_KEY, JSON.stringify(layout.value));
  // Обновляем также в сторе, если требуется
  dashboardStore.updateWidgetLayouts(layout.value);
}

// Загрузка макета виджетов
function loadWidgetLayout() {
  try {
    const savedLayout = localStorage.getItem(WIDGET_LAYOUT_KEY);
    if (savedLayout) {
      layout.value = JSON.parse(savedLayout);
    } else {
      // Инициализация макета для существующих виджетов
      initializeLayout();
    }
  } catch (error) {
    console.error('Ошибка при загрузке макета виджетов:', error);
    initializeLayout();
  }
}

// Инициализация макета для существующих виджетов
function initializeLayout() {
  layout.value = widgets.value.map((widget, index) => {
    // Располагаем виджеты по сетке, по 3 в строке
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    return {
      i: widget.id,
      x: col * defaultWidgetWidth,
      y: row * defaultWidgetHeight,
      w: defaultWidgetWidth,
      h: defaultWidgetHeight
    };
  });
}

// Интервал для автоматического обновления данных
let updateInterval = null;

// Функция для обновления данных устройств
async function refreshData() {
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  
  try {
    // Обновляем данные устройств
    await deviceStore.fetchDevices();
    
    // Сбрасываем ошибку, если она была
    loadError.value = null;
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
    loadError.value = 'Не удалось обновить данные устройств. Проверьте подключение к сети.';
  } finally {
    isRefreshing.value = false;
  }
}

// Загрузка данных при монтировании компонента
async function loadDashboardData() {
  try {
    isLoading.value = true;
    
    // Загрузка виджетов
    await dashboardStore.loadWidgets();
    
    // Если устройств нет, загружаем их
    if (deviceStore.devices.length === 0) {
      await deviceStore.fetchDevices();
    }
    
    // Загрузка макета виджетов
    loadWidgetLayout();
    
    loadError.value = null;
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    loadError.value = 'Не удалось загрузить данные дашборда. Проверьте подключение к сети.';
  } finally {
    isLoading.value = false;
  }
}

// Повторная попытка загрузки данных
function retryLoading() {
  loadDashboardData();
}

// Получение имени устройства по его ID
function getDeviceName(deviceId) {
  const device = deviceStore.getDeviceById(deviceId);
  return device ? device.name : 'Устройство';
}

// Методы для управления виджетами
function removeWidget(widgetId) {
  dashboardStore.removeWidget(widgetId);
  
  // Также удаляем элемент из layout
  layout.value = layout.value.filter(item => item.i !== widgetId);
  saveWidgetLayout();
}

function onWidgetAdded() {
  showWidgetSelector.value = false;
  
  // Получаем последний добавленный виджет
  if (widgets.value.length > 0) {
    const lastWidget = widgets.value[widgets.value.length - 1];
    
    // Добавляем его в layout
    const maxY = layout.value.length > 0 
      ? Math.max(...layout.value.map(item => item.y + item.h))
      : 0;
      
    layout.value.push({
      i: lastWidget.id,
      x: 0,
      y: maxY,
      w: defaultWidgetWidth,
      h: defaultWidgetHeight
    });
    
    saveWidgetLayout();
  }
  
  // Обновляем данные устройств после добавления виджета
  refreshData();
}

// Жизненный цикл
onMounted(() => {
  // Первоначальная загрузка данных
  loadDashboardData();
  
  // Настройка автоматического обновления каждые 30 секунд
  updateInterval = setInterval(() => {
    refreshData();
  }, 30000);
});

onUnmounted(() => {
  // Очистка интервала при размонтировании компонента
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
}

.container {
  max-width: 1600px;
}

.widget-container {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.widget-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #dc3545;
}

.delete-btn:hover {
  background-color: #f8d7da;
}

.widget-content {
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
}

.vue-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, right;
}

.vue-grid-item.edit-mode {
  border: 2px dashed #4299e1;
}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item .vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M0 10V0h1v9h9v1z" fill="rgba(0,0,0,.5)"/><path d="M3 10V3h1v6h6v1z" fill="rgba(0,0,0,.5)"/><path d="M6 10V6h1v3h3v1z" fill="rgba(0,0,0,.5)"/></svg>');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

@media (min-width: 768px) {
  .container {
    padding: 0 1rem;
  }
}
</style> 