import { defineStore } from 'pinia'
import { useDeviceStore } from './deviceStore'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    widgets: [],
    nextWidgetId: 1,
    layout: {},
    widgetLayouts: [], // Новый массив для хранения layout в формате vue-grid-layout
    availableWidgetTypes: [
      { 
        id: 'appliances', 
        name: 'Бытовая техника', 
        description: 'Управление бытовой техникой', 
        icon: 'fa-tv',
        allowsMultiple: true,
        category: 'APPLIANCES'
      },
      { 
        id: 'climate', 
        name: 'Датчики климата', 
        description: 'Отображение показателей климата', 
        icon: 'fa-temperature-half',
        allowsMultiple: true,
        category: 'CLIMATE'
      },
      { 
        id: 'lighting', 
        name: 'Освещение', 
        description: 'Управление умным освещением', 
        icon: 'fa-lightbulb',
        allowsMultiple: true,
        category: 'LIGHTING'
      },
      {
        id: 'security',
        name: 'Безопасность',
        component: 'SecurityWidget',
        allowsMultiple: false,
        description: 'Управление системой безопасности дома',
        icon: 'fa-shield-alt',
        recommended: true
      },
      {
        id: 'notifications',
        name: 'Уведомления',
        component: 'NotificationsWidget',
        allowsMultiple: false,
        description: 'Показывает последние уведомления системы',
        icon: 'fa-bell',
        recommended: true
      }
    ]
  }),
  
  getters: {
    // Получить список виджетов
    getWidgets: (state) => state.widgets,
    
    // Получить список доступных типов виджетов (категорий)
    getAvailableWidgetTypes: (state) => state.availableWidgetTypes,
    
    // Проверить, можно ли добавить еще виджет определенного типа
    canAddWidgetType: (state) => (typeId) => {
      const widgetType = state.availableWidgetTypes.find(type => type.id === typeId);
      if (!widgetType) return false;
      
      // Если виджет может быть добавлен многократно
      if (widgetType.allowsMultiple) return true;
      
      // Иначе проверяем, есть ли уже такой виджет
      return !state.widgets.some(widget => widget.type === typeId);
    },

    // Проверить, есть ли уже виджет для конкретного устройства
    hasWidgetForDevice: (state) => (deviceId) => {
      return state.widgets.some(widget => widget.deviceId === deviceId);
    },
    
    // Получить устройства для выбранной категории
    getDevicesForCategory: () => (category) => {
      const deviceStore = useDeviceStore();
      return deviceStore.devices.filter(device => device.category === category);
    },
    
    // Получить макет виджета
    getWidgetLayout: (state) => (widgetId) => {
      return state.layout[widgetId] || null;
    },
    
    // Получить все макеты виджетов для vue-grid-layout
    getWidgetLayouts: (state) => state.widgetLayouts
  },
  
  actions: {
    // Добавить новый виджет
    addWidget(type, deviceId, deviceType, settings = {}) {
      try {
        console.log('Добавление виджета:', { type, deviceId, deviceType, settings });
        
        const widgetType = this.availableWidgetTypes.find(t => t.id === type);
        if (!widgetType) {
          console.error(`Тип виджета ${type} не найден в списке доступных типов:`, this.availableWidgetTypes);
          return null;
        }
        
        // Проверяем, нет ли уже виджета для этого устройства
        if (deviceId && this.hasWidgetForDevice(deviceId)) {
          console.warn(`Виджет для устройства ${deviceId} уже существует на дашборде`);
          return null;
        }
        
        // Определяем компонент виджета на основе типа устройства
        let component;
        switch (type) {
          case 'appliances':
            if (deviceType === 'TV') {
              component = 'TVWidget';
            } else {
              component = 'GenericApplianceWidget';
            }
            break;
          case 'climate':
            if (deviceType === 'TEMPERATURE_SENSOR') {
              component = 'TemperatureWidget';
            } else if (deviceType === 'HUMIDITY_SENSOR') {
              component = 'HumidityWidget';
            } else {
              component = 'GenericClimateWidget';
            }
            break;
          case 'lighting':
            component = 'LightWidget';
            break;
          case 'security':
            component = 'SecurityWidget';
            break;  
          case 'notifications':
            component = 'NotificationsWidget';
            break;
          default:
            component = 'GenericWidget';
        }
        
        const newWidget = {
          id: `widget_${Date.now()}`,
          type,
          deviceId,
          deviceType,
          settings,
          component,
          createdAt: new Date().toISOString()
        };
        
        console.log('Создан новый виджет:', newWidget);
        
        this.widgets.push(newWidget);
        this.saveWidgets();
        
        return newWidget;
      } catch (error) {
        console.error('Ошибка в методе addWidget:', error);
        return null;
      }
    },
    
    // Добавить виджет с устройством
    addDeviceWidget(deviceId) {
      try {
        console.log('Вызван метод addDeviceWidget с deviceId:', deviceId);
        
        // Получить информацию об устройстве
        const deviceStore = useDeviceStore();
        const device = deviceStore.getDeviceById(deviceId);
        
        if (!device) {
          console.error(`Устройство с ID ${deviceId} не найдено`);
          return null;
        }
        
        console.log('Найдено устройство:', device);
        
        // Определяем тип виджета на основе категории устройства
        let widgetType;
        switch (device.category) {
          case 'APPLIANCES':
            widgetType = 'appliances';
            break;
          case 'CLIMATE':
            widgetType = 'climate';
            break;
          case 'LIGHTING':
            widgetType = 'lighting';
            break;
          case 'SECURITY':
            widgetType = 'security';
            break;
          default:
            widgetType = 'appliances'; // По умолчанию
        }
        
        console.log(`Добавляем виджет типа ${widgetType} для устройства ${deviceId}, подтип: ${device.subType || device.type}`);
        
        // Добавляем виджет
        return this.addWidget(widgetType, deviceId, device.subType || device.type);
      } catch (error) {
        console.error('Ошибка в методе addDeviceWidget:', error);
        return null;
      }
    },
    
    // Удалить виджет
    removeWidget(widgetId) {
      const index = this.widgets.findIndex(widget => widget.id === widgetId);
      if (index !== -1) {
        this.widgets.splice(index, 1);
        this.saveWidgets();
        
        // Удаляем также виджет из макета
        this.widgetLayouts = this.widgetLayouts.filter(item => item.i !== widgetId);
        this.saveWidgetLayouts();
        
        return true;
      }
      return false;
    },
    
    // Обновить настройки виджета
    updateWidgetSettings(widgetId, settings) {
      const widget = this.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.settings = { ...widget.settings, ...settings };
        this.saveWidgets();
        return true;
      }
      return false;
    },
    
    // Сохранить макет дашборда
    saveLayout(layoutData) {
      this.layout = { ...layoutData };
      try {
        localStorage.setItem('dashboard_layout', JSON.stringify(this.layout));
        console.log('Макет дашборда сохранен:', this.layout);
      } catch (error) {
        console.error('Ошибка при сохранении макета:', error);
      }
    },
    
    // Загрузить макет дашборда
    loadLayout() {
      try {
        const savedLayout = localStorage.getItem('dashboard_layout');
        if (savedLayout) {
          this.layout = JSON.parse(savedLayout);
          console.log('Макет дашборда загружен:', this.layout);
        }
      } catch (error) {
        console.error('Ошибка при загрузке макета:', error);
        this.layout = {};
      }
    },
    
    // Обновить настройки макета для виджета
    updateWidgetLayout(widgetId, layout) {
      this.layout[widgetId] = { ...layout };
      this.saveLayout(this.layout);
    },
    
    // Обновить весь макет виджетов для vue-grid-layout
    updateWidgetLayouts(layouts) {
      this.widgetLayouts = [...layouts];
      this.saveWidgetLayouts();
    },
    
    // Сохранить макеты виджетов в localStorage
    saveWidgetLayouts() {
      try {
        localStorage.setItem('dashboard_widget_layouts', JSON.stringify(this.widgetLayouts));
        console.log('Макеты виджетов сохранены:', this.widgetLayouts);
      } catch (error) {
        console.error('Ошибка при сохранении макетов виджетов:', error);
      }
    },
    
    // Загрузить макеты виджетов из localStorage
    loadWidgetLayouts() {
      try {
        const savedLayouts = localStorage.getItem('dashboard_widget_layouts');
        if (savedLayouts) {
          this.widgetLayouts = JSON.parse(savedLayouts);
          console.log('Макеты виджетов загружены:', this.widgetLayouts);
        }
      } catch (error) {
        console.error('Ошибка при загрузке макетов виджетов:', error);
        this.widgetLayouts = [];
      }
    },
    
    // Сохранить виджеты в localStorage
    saveWidgets() {
      try {
        localStorage.setItem('dashboard_widgets', JSON.stringify(this.widgets));
      } catch (error) {
        console.error('Ошибка при сохранении виджетов:', error);
      }
    },
    
    // Загрузить виджеты из localStorage
    loadWidgets() {
      return new Promise((resolve) => {
        try {
          const savedWidgets = localStorage.getItem('dashboard_widgets');
          if (savedWidgets) {
            this.widgets = JSON.parse(savedWidgets);
            console.log('Загружено виджетов:', this.widgets.length);
          }
          
          // Также загружаем макеты виджетов
          this.loadWidgetLayouts();
          
          resolve(this.widgets);
        } catch (error) {
          console.error('Ошибка при загрузке виджетов:', error);
          this.widgets = [];
          resolve([]);
        }
      });
    },
    
    // Сбросить виджеты к состоянию по умолчанию
    resetWidgets() {
      // Тут можно добавить логику для сброса виджетов к определенному состоянию
      this.widgets = [];
      this.widgetLayouts = [];
      this.saveWidgets();
      this.saveWidgetLayouts();
    },
    
    // Полностью очистить виджеты
    clearWidgets() {
      this.widgets = [];
      this.widgetLayouts = [];
      this.saveWidgets();
      this.saveWidgetLayouts();
    },
    
    // Добавить виджет безопасности (без привязки к устройству)
    addSecurityWidget() {
      // Проверяем, есть ли уже виджет безопасности
      const hasSecurityWidget = this.widgets.some(w => w.type === 'security');
      if (hasSecurityWidget) {
        console.warn('Виджет безопасности уже существует на дашборде');
        return null;
      }
      
      const newWidget = {
        id: `widget_${Date.now()}`,
        type: 'security',
        component: 'SecurityWidget',
        // Не добавляем deviceId для виджета безопасности
        createdAt: new Date().toISOString()
      };
      
      console.log('Создан новый виджет безопасности:', newWidget);
      
      this.widgets.push(newWidget);
      this.saveWidgets();
      
      return newWidget;
    }
  }
}) 