<template>
  <div class="p-4">
    <div class="mb-4 flex justify-between items-center">
      <h1 class="text-xl font-medium">Устройства</h1>
    </div>
    
    <div class="flex gap-4 mb-4 flex-wrap md:flex-nowrap">
      <div class="relative flex-grow max-w-md">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3">
          <i class="fas fa-search text-gray-400"></i>
        </span>
        <input
          type="text"
          placeholder="Поиск устройств..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          v-model="searchQuery"
        />
      </div>
      
      <div class="flex-grow-0">
        <select 
          class="w-full px-4 py-2 rounded-lg border border-gray-200 appearance-none bg-white"
          v-model="selectedRoom"
        >
          <option value="all">Все комнаты</option>
          <option 
            v-for="room in rooms" 
            :key="room.id"
            :value="room.id"
          >
            {{ room.name }}
          </option>
        </select>
      </div>
      
      <button 
        class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        @click="openAddDeviceModal"
      >
        <i class="fas fa-plus mr-2"></i> Добавить устройство
      </button>
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else>
      <!-- Список устройств -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="device in filteredDevices" :key="device.id" class="bg-white rounded-lg shadow-sm p-4">
          <div class="text-sm text-gray-500 mb-1">{{ device.room || 'Неизвестное место' }}</div>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <!-- Иконка в зависимости от типа устройства -->
              <i :class="getDeviceIcon(device.type)" class="mr-2"></i>
              <h3 class="font-medium">{{ device.name }}</h3>
            </div>
            <div v-if="!device.online" class="text-xs px-2 py-1 bg-red-100 text-red-500 rounded-full">
              Офлайн
            </div>
          </div>

          <!-- Содержимое в зависимости от типа устройства -->
          <div class="mt-3">
            <!-- TV -->
            <template v-if="device.type === 'tv' || (device.category === 'APPLIANCES' && device.subType === 'TV')">
              <div class="flex flex-col">
                <!-- Статус включения -->
                <div class="flex items-center justify-between mb-3">
                  <div class="text-gray-700">Состояние</div>
                  <div class="flex items-center">
                    <label class="toggle-switch">
                      <input
                        type="checkbox"
                        :checked="device.active"
                        @change="toggleTV(device)"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <!-- Телевизор, отображение -->
                <div class="bg-white rounded-lg border border-gray-200 p-3 relative">
                  <!-- Визуализация ТВ -->
                  <div class="bg-gray-800 rounded-lg p-2 text-center mb-4" 
                       :class="{ 'opacity-30': !device.active || !device.online }">
                    <div class="py-8 flex items-center justify-center">
                      <i class="fas fa-tv text-5xl text-gray-400"></i>
                    </div>
                    <div class="mt-2 text-xs text-gray-400">
                      {{ getTVStatus(device) }}
                    </div>
                  </div>
                  
                  <!-- Элементы управления -->
                  <div :class="{ 'opacity-50 pointer-events-none': !device.active }">
                    <!-- Каналы -->
                    <div class="mb-4">
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-gray-600 text-sm">Канал</div>
                        <div class="text-gray-800 font-medium">{{ device.rawProperties?.tb_channel || '1' }}</div>
                      </div>
                      <div class="flex gap-2">
                        <button 
                          class="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg flex-1"
                          @click="changeChannel(device, -1)"
                          :disabled="!device.active"
                        >
                          <i class="fas fa-chevron-left"></i>
                        </button>
                        <button 
                          class="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg flex-1"
                          @click="changeChannel(device, 1)"
                          :disabled="!device.active"
                        >
                          <i class="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                    
                    <!-- Быстрый выбор канала -->
                    <div class="mb-4">
                      <div class="text-gray-600 text-sm mb-2">Каналы</div>
                      <div class="flex flex-wrap gap-2">
                        <button 
                          v-for="channel in 10" 
                          :key="channel"
                          class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                          :class="{ 'bg-blue-100 text-blue-600': device.rawProperties?.tb_channel === channel.toString() }"
                          @click="setChannel(device, channel)"
                          :disabled="!device.active"
                        >
                          {{ channel }}
                        </button>
                      </div>
                    </div>
                    
                    <!-- Громкость -->
                    <div class="mb-4">
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-gray-600 text-sm">Громкость</div>
                        <div class="text-gray-800 font-medium">{{ device.rawProperties?.tb_volume || '50' }}</div>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        :value="device.rawProperties?.tb_volume || 50"
                        @input="updateLocalVolume(device, $event)"
                        @change="changeVolume(device, $event)"
                        class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        :disabled="!device.active"
                      >
                    </div>
                    
                    <!-- Источник сигнала -->
                    <div class="mb-4">
                      <div class="text-gray-600 text-sm mb-2">Источник сигнала</div>
                      <div class="grid grid-cols-3 gap-2">
                        <button 
                          v-for="source in inputSources" 
                          :key="source.value"
                          class="py-1 px-2 rounded-md text-xs text-center"
                          :class="(device.rawProperties?.tb_input_source === source.value) ? 
                            'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                          @click="changeInputSource(device, source.value)"
                          :disabled="!device.active"
                        >
                          {{ source.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Кондиционер -->
            <template v-else-if="device.type === 'aircon'">
              <div class="text-2xl font-bold">{{ device.temperature }}°C</div>
              <div class="flex items-center gap-2 mt-2">
                <button class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center" @click="decreaseTemperature(device)">
                  <i class="fas fa-minus text-blue-500"></i>
                </button>
                <button class="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center" @click="increaseTemperature(device)">
                  <i class="fas fa-plus text-blue-500"></i>
                </button>
              </div>
              <div class="mt-2 text-sm text-gray-500">
                Режим: {{ getModeText(device.mode) }}
              </div>
            </template>

            <!-- Умная лампа -->
            <template v-else-if="device.type === 'light' || (device.category === 'LIGHTING' && device.subType === 'SMART_BULB')">
              <div class="flex flex-col">
                <!-- Статус включения -->
                <div class="flex items-center justify-between mb-3">
                  <div class="text-gray-700">Состояние</div>
                  <div class="flex items-center">
                    <div v-if="!device.online" class="text-xs text-gray-500 mr-2">
                      {{ device.isVirtual ? 'Виртуальное устройство' : 'Офлайн' }}
                    </div>
                    <label class="toggle-switch" :class="{ 'cursor-not-allowed': !device.canControl }">
                      <input
                        type="checkbox"
                        :checked="device.active"
                        @change="handleToggleLight(device, $event)"
                        :disabled="!device.canControl"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <!-- Визуализация лампы -->
                <LightVisualization 
                  :active="device.active"
                  :brightness="device.brightness"
                  :color="device.color"
                />
                
                <!-- Регулятор яркости -->
                <div class="mt-4">
              <div class="flex items-center justify-between mb-2">
                    <div class="text-gray-600 text-sm">Яркость</div>
                    <div class="flex items-center">
                      <div class="text-gray-800 font-medium">{{ device.brightness }}%</div>
                    </div>
              </div>
                  
              <input 
                type="range" 
                min="0" 
                max="100" 
                    v-model.number="device.brightness"
                    @input="handleBrightnessChange(device, $event)"
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    :disabled="!device.canControl"
                  >
                </div>
                
                <!-- Выбор цвета -->
                <div class="mt-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-gray-600 text-sm">Цвет</div>
                    <ColorPicker 
                      :value="device.color"
                      @input="color => handleColorPickerChange(device, color)"
                      :disabled="!device.canControl"
                    />
                  </div>
                  
                  <div class="flex flex-wrap gap-2 mt-2">
                    <div v-for="color in predefinedColors" :key="color" class="color-square">
                      <button 
                        class="w-6 h-6 rounded-full border border-gray-200" 
                        :style="{ backgroundColor: color }"
                        :class="{ 'ring-2 ring-blue-500 scale-110': device.color === color }"
                        @click="handleColorPickerChange(device, color)"
                        :disabled="!device.canControl"
                      ></button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Датчик температуры или термостат -->
            <template v-else-if="device.type === 'thermostat' || (device.category === 'CLIMATE' && ['THERMOSTAT', 'TEMPERATURE_SENSOR'].includes(device.subType))">
              <div class="flex flex-col">
                <!-- Статус включения -->
                <div class="flex items-center justify-between mb-3">
                  <div class="text-gray-700">Состояние</div>
                  <div class="flex items-center">
                    <div v-if="!device.online" class="text-xs text-gray-500 mr-2">
                      {{ device.isVirtual ? 'Виртуальное устройство' : 'Офлайн' }}
                    </div>
                    <label class="toggle-switch" :class="{ 'cursor-not-allowed': !device.canControl }">
                      <input
                        type="checkbox"
                        :checked="device.active"
                        @change="toggleDevice(device)"
                        :disabled="!device.canControl"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <!-- Компактное отображение датчика температуры -->
                <div class="bg-white rounded-lg shadow-sm p-3 relative">
                  <!-- Индикатор обновления данных -->
                  <div v-if="isUpdating" class="absolute top-0 right-0 m-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <!-- Основная информация с датчиком температуры -->
                  <div class="flex items-start gap-3">
                    <!-- Круговой индикатор -->
                    <div class="relative w-24 h-24">
                      <svg class="w-full h-full" viewBox="0 0 120 120">
                        <circle
                          class="text-gray-100"
                          stroke-width="12"
                          stroke="currentColor"
                          fill="transparent"
                          r="54"
                          cx="60"
                          cy="60"
                        />
                        <circle
                          class="text-blue-600"
                          stroke-width="12"
                          :stroke-dasharray="2 * Math.PI * 54"
                          :stroke-dashoffset="getTemperatureDashOffset(device.rawProperties?.tb_temperature)"
                          stroke-linecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="54"
                          cx="60"
                          cy="60"
                          transform="rotate(-90, 60, 60)"
                        />
                        <circle cx="60" cy="60" r="40" fill="white" />
                        <text x="60" y="52" dominant-baseline="middle" text-anchor="middle" style="font-size: 24px">🌡️</text>
                        <text x="60" y="75" dominant-baseline="middle" text-anchor="middle" :fill="getTemperatureColor(device.rawProperties?.tb_temperature)" style="font-size: 16px; font-weight: bold">
                          {{ device.rawProperties?.tb_temperature || '--' }}°C
                        </text>
                      </svg>
                    </div>
                    
                    <!-- Информация и статус -->
                    <div class="flex-grow">
                      <!-- Основная информация -->
                      <div class="flex flex-col">
                        <div class="font-medium text-sm mb-1">{{ getTemperatureLevelText(device.rawProperties?.tb_temperature) }}</div>
                        <div class="text-xs text-gray-500 mb-2">
                          {{ getTemperatureRecommendation(device.rawProperties?.tb_temperature) }}
                        </div>
                      </div>
                      
                      <!-- Батарея -->
                      <div class="flex items-center justify-between mt-1">
                        <div class="text-xs text-gray-500">Заряд:</div>
                        <div class="flex items-center">
                          <span 
                            class="text-xs font-medium py-1 px-2 rounded-full flex items-center gap-1"
                            :class="{
                              'bg-red-100 text-red-600': (device.rawProperties?.tb_battery < 20),
                              'bg-yellow-100 text-yellow-600': (device.rawProperties?.tb_battery >= 20 && device.rawProperties?.tb_battery < 50),
                              'bg-green-100 text-green-600': (device.rawProperties?.tb_battery >= 50)
                            }"
                          >
                            <i class="fas fa-battery-three-quarters text-xs mr-1"></i>
                            {{ device.rawProperties?.tb_battery || '--' }}%
                          </span>
                        </div>
                      </div>
                      
                      <!-- Обновление -->
                      <div class="flex items-center justify-between mt-1">
                        <div class="text-xs text-gray-500">Обновлено:</div>
                        <div class="flex items-center">
                          <span class="text-xs">{{ formatDate(device.rawProperties?.tb_last_updated) }}</span>
                          <button 
                            @click="refreshDevices" 
                            class="ml-2 text-blue-500 hover:text-blue-600 transition-colors"
                            :disabled="isUpdating"
                            :class="{ 'opacity-50 cursor-not-allowed': isUpdating }"
                            title="Обновить данные"
                          >
                            <i class="fas fa-sync-alt text-xs" :class="{ 'animate-spin': isUpdating }"></i>
                          </button>
                        </div>
                      </div>
                      
                      <!-- Кнопка для отображения подробной информации -->
                      <button 
                        @click="toggleDetails(device.id)" 
                        class="w-full mt-2 text-xs py-1 px-2 text-blue-600 bg-blue-50 rounded flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i :class="shouldShowDetails(device.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="mr-1"></i>
                        {{ shouldShowDetails(device.id) ? 'Скрыть детали' : 'Показать детали' }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Развернутая информация (показывается только при клике) -->
                  <div v-if="shouldShowDetails(device.id)" class="mt-3 border-t border-gray-100 pt-3">
                    <!-- График температуры -->
                    <div class="mb-4">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex gap-1">
                          <button 
                            v-for="period in ['24ч', '7д', '30д']" 
                            :key="period"
                            @click="setPeriod(device.id, period)"
                            :class="[
                              'px-2 py-0.5 text-xs rounded',
                              getPeriod(device.id) === period ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                            ]"
                          >
                            {{ period }}
                          </button>
                        </div>
                      </div>
                      
                      <TemperatureChart 
                        :device-id="device.id"
                        :color="getTemperatureColor(device.rawProperties?.tb_temperature)" 
                        :update-interval="30000"
                      />
                    </div>
                    
                    <!-- Информация о температуре -->
                    <div class="mb-4">
                      <h4 class="text-sm font-medium mb-2">Информация о температуре</h4>
                      
                      <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg mb-3">
                        <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                        <div>
                          <p class="text-blue-700 text-sm font-medium">{{ getTemperatureTitle(device.rawProperties?.tb_temperature) }}</p>
                          <p class="text-xs text-blue-600">{{ getTemperatureDetailedMessage(device.rawProperties?.tb_temperature) }}</p>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p class="text-xs text-gray-500 flex items-center">
                            <i class="fas fa-bullseye text-blue-500 mr-1"></i>
                            Оптимальный уровень
                          </p>
                          <p class="font-medium">20-24°C</p>
                          <p class="text-xs text-gray-500">Комфортный для человека</p>
                        </div>
                        <div>
                          <p class="text-xs text-gray-500 flex items-center">
                            <i class="fas fa-exchange-alt text-blue-500 mr-1"></i>
                            Изменение
                          </p>
                          <p class="font-medium text-blue-500">-0.5°C</p>
                          <p class="text-xs text-gray-500">За последние 24 часа</p>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Кнопки действий -->
                    <div class="mt-3 flex gap-2">
                      <button 
                        class="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex-grow flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i class="fas fa-link mr-1"></i>
                        Автоматизация
                      </button>
                      <button 
                        class="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex-grow flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i class="fas fa-bell mr-1"></i>
                        Уведомления
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Датчик влажности -->
            <template v-else-if="device.category === 'CLIMATE' && device.subType === 'HUMIDITY_SENSOR'">
              <div class="flex flex-col">
                <!-- Статус включения -->
                <div class="flex items-center justify-between mb-3">
                  <div class="text-gray-700">Состояние</div>
                  <div class="flex items-center">
                    <div v-if="!device.online" class="text-xs text-gray-500 mr-2">
                      {{ device.isVirtual ? 'Виртуальное устройство' : 'Офлайн' }}
                    </div>
                    <label class="toggle-switch" :class="{ 'cursor-not-allowed': !device.canControl }">
                      <input
                        type="checkbox"
                        :checked="device.active"
                        @change="toggleDevice(device)"
                        :disabled="!device.canControl"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                
                <!-- Компактное отображение датчика влажности -->
                <div class="bg-white rounded-lg shadow-sm p-3 relative">
                  <!-- Индикатор обновления данных -->
                  <div v-if="isUpdating" class="absolute top-0 right-0 m-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <!-- Основная информация с датчиком влажности -->
                  <div class="flex items-start gap-3">
                    <!-- Круговой индикатор влажности -->
                    <HumidityGauge
                      :value="device.rawProperties?.tb_humidity || 0"
                      :loading="device.rawProperties?.tb_loading || false"
                      :size="100"
                      label="Влажность"
                    />
                    
                    <!-- Информация и статус -->
                    <div class="flex-grow">
                      <!-- Основная информация -->
                      <div class="flex flex-col">
                        <div class="font-medium text-sm mb-1">{{ getHumidityLevelText(device.rawProperties?.tb_humidity) }}</div>
                        <div class="text-xs text-gray-500 mb-2">
                          {{ getHumidityRecommendation(device.rawProperties?.tb_humidity) }}
                        </div>
                      </div>
                      
                      <!-- Батарея -->
                      <div class="flex items-center justify-between mt-1">
                        <div class="text-xs text-gray-500">Заряд:</div>
                        <div class="flex items-center">
                          <span 
                            class="text-xs font-medium py-1 px-2 rounded-full flex items-center gap-1"
                            :class="{
                              'bg-red-100 text-red-600': (device.rawProperties?.tb_battery < 20),
                              'bg-yellow-100 text-yellow-600': (device.rawProperties?.tb_battery >= 20 && device.rawProperties?.tb_battery < 50),
                              'bg-green-100 text-green-600': (device.rawProperties?.tb_battery >= 50)
                            }"
                          >
                            <i class="fas fa-battery-three-quarters text-xs mr-1"></i>
                            {{ device.rawProperties?.tb_battery || '--' }}%
                          </span>
                        </div>
                      </div>
                      
                      <!-- Обновление -->
                      <div class="flex items-center justify-between mt-1">
                        <div class="text-xs text-gray-500">Обновлено:</div>
                        <div class="flex items-center">
                          <span class="text-xs">{{ formatDate(device.rawProperties?.tb_last_updated) }}</span>
                          <button 
                            @click="refreshDevices" 
                            class="ml-2 text-blue-500 hover:text-blue-600 transition-colors"
                            :disabled="isUpdating"
                            :class="{ 'opacity-50 cursor-not-allowed': isUpdating }"
                            title="Обновить данные"
                          >
                            <i class="fas fa-sync-alt text-xs" :class="{ 'animate-spin': isUpdating }"></i>
                          </button>
                        </div>
                      </div>
                      
                      <!-- Кнопка для отображения подробной информации -->
                      <button 
                        @click="toggleDetails(device.id)" 
                        class="w-full mt-2 text-xs py-1 px-2 text-blue-600 bg-blue-50 rounded flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i :class="shouldShowDetails(device.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="mr-1"></i>
                        {{ shouldShowDetails(device.id) ? 'Скрыть детали' : 'Показать детали' }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Развернутая информация (показывается только при клике) -->
                  <div v-if="shouldShowDetails(device.id)" class="mt-3 border-t border-gray-100 pt-3">
                    <!-- График влажности -->
                    <HumidityChart 
                      :device-id="device.id"
                      :color="getHumidityColor(device.rawProperties?.tb_humidity)" 
                    />
                    
                    <!-- Подробная информация о влажности -->
                    <HumidityInfo
                      :humidity="device.rawProperties?.tb_humidity || 0"
                      :temperature="device.rawProperties?.tb_temperature || 22"
                      :trend="-2"
                    />
                    
                    <!-- Кнопки действий -->
                    <div class="mt-3 flex gap-2">
                      <button 
                        class="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex-grow flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i class="fas fa-link mr-1"></i>
                        Автоматизация
                      </button>
                      <button 
                        class="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded flex-grow flex items-center justify-center hover:bg-blue-100 transition-colors"
                      >
                        <i class="fas fa-bell mr-1"></i>
                        Уведомления
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Умный замок -->
            <template v-else-if="device.type === 'lock' || (device.category === 'SECURITY' && device.subType === 'SMART_LOCK')">
              <div 
                class="p-2 rounded-md mb-3 text-center"
                :class="device.rawProperties?.tb_locked === 'true' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'"
              >
                <i :class="device.rawProperties?.tb_locked === 'true' ? 'fas fa-check-circle' : 'fas fa-lock-open'" class="mr-1"></i>
                {{ device.rawProperties?.tb_locked === 'true' ? 'Закрыто' : 'Открыто' }}
              </div>
              <div class="flex justify-center mt-3">
                <button 
                  class="px-4 py-2 rounded-md text-white"
                  :class="device.rawProperties?.tb_locked === 'true' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'"
                  @click="toggleLock(device)"
                  :disabled="!device.canControl"
                >
                  {{ device.rawProperties?.tb_locked === 'true' ? 'Открыть' : 'Закрыть' }}
                </button>
              </div>
            </template>

            <!-- Камера -->
            <template v-else-if="device.type === 'camera' || (device.category === 'SECURITY' && device.subType === 'CAMERA')">
              <div class="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                <i class="fas fa-camera text-gray-400 text-3xl"></i>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <div class="text-sm text-gray-500">
                  {{ device.rawProperties?.tb_recording === 'on' ? 'Запись включена' : 'Запись выключена' }}
                </div>
                <button 
                  class="text-blue-500 text-sm"
                  @click="toggleRecording(device)"
                  :disabled="!device.canControl"
                >
                  {{ device.rawProperties?.tb_recording === 'on' ? 'Остановить' : 'Начать запись' }}
                </button>
              </div>
            </template>

            <!-- Робот-пылесос -->
            <template v-else-if="device.type === 'vacuum' || (device.category === 'APPLIANCES' && device.subType === 'VACUUM')">
              <div class="flex items-center justify-between mb-2">
                <div>Статус</div>
                <div class="text-gray-500">{{ getVacuumStatus(device) }}</div>
              </div>
              <div class="flex items-center gap-2 mt-3">
                <button 
                  class="px-3 py-1 rounded-md bg-blue-500 text-white text-sm flex items-center"
                  @click="startVacuum(device)"
                  :disabled="!device.canControl || device.rawProperties?.tb_power === 'on'"
                >
                  <i class="fas fa-play mr-1"></i> Старт
                </button>
                <button 
                  class="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm flex items-center"
                  @click="stopVacuum(device)"
                  :disabled="!device.canControl || device.rawProperties?.tb_power !== 'on'"
                >
                  <i class="fas fa-home mr-1"></i> Домой
                </button>
              </div>
            </template>
            
            <!-- Другие устройства -->
            <template v-else>
              <div class="mt-4 flex items-center justify-between">
                <div>Статус</div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    class="sr-only peer" 
                    v-model="device.active"
                    @change="toggleDevice(device)"
                    :disabled="!device.canControl"
                  >
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div class="mt-2 text-sm text-gray-500">
                {{ device.online ? 'Онлайн' : 'Офлайн' }}
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <div v-if="filteredDevices.length === 0" class="text-center py-12 text-gray-500">
        <i class="text-4xl mb-4 fas fa-ghost"></i>
        <p>Нет устройств в выбранной комнате</p>
      </div>
    </div>
  </div>
  
  <!-- Модальное окно добавления устройства -->
  <DeviceAddModal 
    :is-open="isAddDeviceModalOpen" 
    :rooms="rooms"
    @close="closeAddDeviceModal"
    @device-added="handleDeviceAdded"
    @error="handleError"
  />
</template>

<script>
import { useDeviceStore } from '../store/deviceStore'
import { useLocationStore } from '../store/locationStore'
import { computed, ref, onMounted, reactive, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import DeviceAddModal from '../components/DeviceAddModal.vue'
import ColorPicker from '../components/ColorPicker.vue'
import LightVisualization from '../components/LightVisualization.vue'
import HumidityGauge from '../components/devices/HumidityGauge.vue'
import HumidityChart from '../components/devices/HumidityChart.vue'
import HumidityInfo from '../components/devices/HumidityInfo.vue'
import TemperatureChart from '../components/devices/TemperatureChart.vue'
import api, { devicesApi } from '../services/api'

// Функция debounce для задержки выполнения
function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

export default {
  name: 'DevicesView',
  
  components: {
    DeviceAddModal,
    ColorPicker,
    LightVisualization,
    HumidityGauge,
    HumidityChart,
    HumidityInfo,
    TemperatureChart
  },
  
  setup() {
    const deviceStore = useDeviceStore()
    const locationStore = useLocationStore()
    const searchQuery = ref('')
    const selectedRoom = ref('all')
    const isAddDeviceModalOpen = ref(false)
    
    // Создаем ref переменные для загрузки и ошибок
    const loading = ref(false)
    const error = ref(null)
    
    // Синхронизируем локальные переменные с состоянием из хранилища
    const updateStoreState = () => {
      loading.value = deviceStore.loading
      error.value = deviceStore.error
    }
    
    // Состояние отображения деталей для каждого устройства
    const deviceDetailsState = reactive({})
    
    // Реактивная функция для переключения деталей
    const toggleDetails = (deviceId) => {
      if (!deviceDetailsState[deviceId]) {
        deviceDetailsState[deviceId] = true
      } else {
        deviceDetailsState[deviceId] = !deviceDetailsState[deviceId]
      }
    }
    
    // Проверка, отображаются ли детали для устройства
    const shouldShowDetails = (deviceId) => {
      return deviceDetailsState[deviceId] === true
    }
    
    // Комнаты доступные в системе
    const rooms = [
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Гостиная' },
      { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', name: 'Кухня' },
      { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Спальня' },
      { id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8', name: 'Ванная' },
      { id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8', name: 'Коридор' },
      { id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8', name: 'Гараж' }
    ]
    
    // Предопределенные цвета для выбора
    const predefinedColors = [
      '#FFFFFF', // Белый
      '#F8F8FF', // Холодный белый
      '#FFF8DC', // Теплый белый
      '#FF0000', // Красный
      '#00FF00', // Зеленый
      '#0000FF', // Синий
      '#FFFF00', // Желтый
      '#FF00FF', // Пурпурный
      '#FFA500'  // Оранжевый
    ]
    
    // Отфильтрованные устройства
    const filteredDevices = computed(() => {
      return deviceStore.getFilteredDevices(selectedRoom.value, searchQuery.value)
    })
    
    // Интервал для обновления данных устройств
    let updateInterval = null
    
    // Флаг обновления данных
    const isUpdating = ref(false)
    
    // Функция обновления данных с сервера
    const refreshDevices = async () => {
      try {
        isUpdating.value = true
        loading.value = true // Устанавливаем флаг загрузки
        await deviceStore.fetchDevices()
        updateStoreState() // Обновляем состояние после запроса
      } catch (err) {
        console.error('Ошибка при обновлении данных:', err)
        error.value = 'Не удалось загрузить устройства. Пожалуйста, попробуйте позже.' // Устанавливаем сообщение об ошибке
      } finally {
        isUpdating.value = false
        loading.value = false // Сбрасываем флаг загрузки
      }
    }
    
    // Загрузка устройств при монтировании компонента и настройка автообновления
    onMounted(() => {
      // Первоначальная загрузка
      refreshDevices()
      
      // Настройка автообновления каждые 30 секунд
      updateInterval = setInterval(() => {
        refreshDevices()
      }, 30000)
    })
    
    // Очистка интервала при размонтировании компонента
    onBeforeUnmount(() => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    })
    
    // Методы для работы с модальным окном
    const openAddDeviceModal = () => {
      isAddDeviceModalOpen.value = true
    }
    
    const closeAddDeviceModal = () => {
      isAddDeviceModalOpen.value = false
    }
    
    // Получение иконки для типа устройства
    const getDeviceIcon = (type) => {
      if (!type) return 'fas fa-microchip'
      
      type = type.toLowerCase()
      
      switch(type) {
        case 'light': return 'fas fa-lightbulb'
        case 'thermostat': return 'fas fa-thermometer-half'
        case 'lock': return 'fas fa-lock'
        case 'camera': return 'fas fa-video'
        case 'tv': return 'fas fa-tv'
        case 'vacuum': return 'fas fa-broom'
        default: return 'fas fa-microchip'
      }
    }
    
    // Обработка переключения лампы
    const handleToggleLight = (device, event) => {
      const isActive = event.target.checked
      
      // Обновляем локальное состояние
      device.active = isActive
      
      // Отправляем команду на сервер
      deviceStore.toggleDevice(device.id, isActive)
        .catch(error => {
          // Возвращаем прежнее состояние при ошибке
          device.active = !isActive
          console.error('Ошибка при переключении лампы:', error)
        })
    }
    
    // Обработка изменения яркости
    const handleBrightnessChange = debounce((device, event) => {
      const newBrightness = typeof event === 'object' ? parseInt(event.target.value) : event
      
      // Отправляем команду на сервер
      deviceStore.setBrightness(device.id, newBrightness)
        .catch(error => {
          console.error('Ошибка при изменении яркости:', error)
        })
    }, 300) // Задержка 300 мс для предотвращения слишком частых запросов
    
    // Обработка изменения цвета
    const handleColorPickerChange = (device, color) => {
      if (!device.canControl) return
      
      // Обновляем локальное состояние
      device.color = color
      
      // Отправляем команду на сервер
      deviceStore.setLightColor(device.id, color.replace('#', ''))
        .catch(error => {
          console.error('Ошибка при изменении цвета:', error)
        })
    }
    
    // Изменение температуры термостата
    const decreaseTemperature = (device) => {
      const currentTemp = parseInt(device.rawProperties?.tb_temperature || '22')
      const newTemp = Math.max(16, currentTemp - 1)
      
      // Обновляем локальное состояние
      device.rawProperties.tb_temperature = newTemp.toString()
      
      // Отправляем команду на сервер
      deviceStore.sendCommand(device.id, 'setState', { tb_temperature: newTemp.toString() })
        .catch(error => {
          // Возвращаем прежнее значение при ошибке
          device.rawProperties.tb_temperature = currentTemp.toString()
          console.error('Ошибка при уменьшении температуры:', error)
        })
    }
    
    const increaseTemperature = (device) => {
      const currentTemp = parseInt(device.rawProperties?.tb_temperature || '22')
      const newTemp = Math.min(32, currentTemp + 1)
      
      // Обновляем локальное состояние
      device.rawProperties.tb_temperature = newTemp.toString()
      
      // Отправляем команду на сервер
      deviceStore.sendCommand(device.id, 'setState', { tb_temperature: newTemp.toString() })
        .catch(error => {
          // Возвращаем прежнее значение при ошибке
          device.rawProperties.tb_temperature = currentTemp.toString()
          console.error('Ошибка при увеличении температуры:', error)
        })
    }
    
    // Переключение замка
    const toggleLock = (device) => {
      // Вместо прямого изменения состояния и вызова sendCommand
      // используем специальный метод toggleLock из deviceStore
      deviceStore.toggleLock(device.id)
        .catch(error => {
          console.error('Ошибка при переключении замка:', error)
        })
    }
    
    // Переключение записи камеры
    const toggleRecording = (device) => {
      const currentState = device.rawProperties?.tb_recording === 'on'
      const newState = !currentState ? 'on' : 'off'
      
      // Обновляем локальное состояние
      device.rawProperties.tb_recording = newState
      
      // Отправляем команду на сервер
      deviceStore.sendCommand(device.id, 'setState', { tb_recording: newState })
        .catch(error => {
          // Возвращаем прежнее значение при ошибке
          device.rawProperties.tb_recording = currentState ? 'on' : 'off'
          console.error('Ошибка при переключении записи:', error)
        })
    }
    
    // Управление пылесосом
    const startVacuum = (device) => {
      // Обновляем локальное состояние
      device.rawProperties.tb_power = 'on'
      device.rawProperties.tb_mode = 'cleaning'
      
      // Отправляем команду на сервер
      deviceStore.sendCommand(device.id, 'setState', { 
        tb_power: 'on',
        tb_mode: 'cleaning'
      })
        .catch(error => {
          // Возвращаем прежнее значение при ошибке
          device.rawProperties.tb_power = 'off'
          device.rawProperties.tb_mode = 'idle'
          console.error('Ошибка при запуске пылесоса:', error)
        })
    }
    
    const stopVacuum = (device) => {
      // Обновляем локальное состояние
      device.rawProperties.tb_power = 'off'
      device.rawProperties.tb_mode = 'idle'
      
      // Отправляем команду на сервер
      deviceStore.sendCommand(device.id, 'setState', { 
        tb_power: 'off',
        tb_mode: 'idle'
      })
        .catch(error => {
          // Возвращаем прежнее значение при ошибке
          device.rawProperties.tb_power = 'on'
          device.rawProperties.tb_mode = 'cleaning'
          console.error('Ошибка при остановке пылесоса:', error)
        })
    }
    
    // Получение статуса пылесоса
    const getVacuumStatus = (device) => {
      if (device.rawProperties?.tb_power === 'off') {
        return 'Выключен'
      }
      
      switch (device.rawProperties?.tb_mode) {
        case 'cleaning': return 'Уборка'
        case 'spot': return 'Точечная уборка'
        case 'idle': return 'Ожидание'
        case 'returning': return 'Возвращение на базу'
        case 'charging': return 'Зарядка'
        default: return 'Неизвестно'
      }
    }
    
    // Получение текста режима
    const getModeText = (mode) => {
      switch (mode) {
        case 'auto': return 'Автоматический'
        case 'cool': return 'Охлаждение'
        case 'heat': return 'Обогрев'
        case 'fan': return 'Вентиляция'
        case 'dry': return 'Осушение'
        default: return 'Неизвестно'
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return 'Недавно'
      
      try {
        const date = new Date(dateString)
        // Проверяем валидность даты
        if (isNaN(date.getTime())) return 'Недавно'
        
        return date.toLocaleString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch (e) {
        console.error('Ошибка при форматировании даты:', e)
        return 'Недавно'
      }
    }
    
    // Периоды отображения графиков для устройств
    const devicePeriods = reactive({})
    
    // Установка периода для устройства
    const setPeriod = (deviceId, period) => {
      devicePeriods[deviceId] = period
    }
    
    // Получение текущего периода для устройства
    const getPeriod = (deviceId) => {
      return devicePeriods[deviceId] || '24ч'
    }

    // Получение текста для уровня температуры
    const getTemperatureLevelText = (temperature) => {
      if (!temperature) return 'Нет данных'
      temperature = parseFloat(temperature)
      
      if (temperature < 18) return 'Слишком холодно'
      if (temperature <= 20) return 'Прохладно'
      if (temperature <= 24) return 'Оптимальная температура'
      if (temperature <= 28) return 'Тепло'
      return 'Слишком жарко'
    }
    
    // Получение смещения для графика температуры
    const getTemperatureDashOffset = (temperature) => {
      if (!temperature) return 2 * Math.PI * 54
      temperature = parseFloat(temperature)
      const percentage = Math.min((temperature / 40) * 100, 100)
      return 2 * Math.PI * 54 - (percentage / 100) * 2 * Math.PI * 54
    }
    
    // Получение цвета для температуры
    const getTemperatureColor = (temperature) => {
      if (!temperature) return 'gray'
      temperature = parseFloat(temperature)
      
      if (temperature < 18) return '#3B82F6' // синий - холодно
      if (temperature <= 20) return '#60A5FA' // светло-синий - прохладно
      if (temperature <= 24) return '#10B981' // зеленый - оптимально
      if (temperature <= 28) return '#F59E0B' // оранжевый - тепло
      return '#EF4444' // красный - жарко
    }
    
    // Получение рекомендации по температуре
    const getTemperatureRecommendation = (temperature) => {
      if (!temperature) return 'Проверьте подключение датчика'
      temperature = parseFloat(temperature)
      
      if (temperature < 18) return 'Рекомендуется включить обогреватель'
      if (temperature <= 20) return 'Слегка прохладно, при желании можно увеличить температуру'
      if (temperature <= 24) return 'Идеальная температура для комфорта и здоровья'
      if (temperature <= 28) return 'Рекомендуется включить вентилятор или кондиционер'
      return 'Срочно включите кондиционер или откройте окно'
    }
    
    // Получение заголовка для подробной информации о температуре
    const getTemperatureTitle = (temperature) => {
      if (!temperature) return 'Данные не доступны'
      temperature = parseFloat(temperature)
      
      if (temperature < 18) return 'Низкая температура'
      if (temperature <= 20) return 'Немного ниже комфортной температуры'
      if (temperature <= 24) return 'Оптимальная температура'
      if (temperature <= 28) return 'Повышенная температура'
      return 'Высокая температура'
    }
    
    // Получение детального сообщения о температуре
    const getTemperatureDetailedMessage = (temperature) => {
      if (!temperature) return 'Невозможно получить данные о температуре. Проверьте подключение датчика.'
      temperature = parseFloat(temperature)
      
      if (temperature < 18) return 'Текущая температура может вызвать дискомфорт. Рекомендуется использовать обогреватель для повышения температуры до 20-24°C.'
      if (temperature <= 20) return 'Температура немного ниже оптимальной. Некоторым людям может быть прохладно.'
      if (temperature <= 24) return 'Текущая температура оптимальна для комфорта, здоровья и продуктивности.'
      if (temperature <= 28) return 'Температура выше комфортной. Рекомендуется использовать вентилятор или кондиционер.'
      return 'Текущая температура может вызвать перегрев и дискомфорт. Настоятельно рекомендуется охладить помещение.'
    }

    // Получение текста для уровня влажности
    const getHumidityLevelText = (humidity) => {
      if (!humidity) return 'Данные отсутствуют'
      
      const humidityNum = parseInt(humidity)
      
      if (isNaN(humidityNum)) return 'Неизвестно'
      
      if (humidityNum < 30) return 'Слишком сухо'
      if (humidityNum < 40) return 'Сухо'
      if (humidityNum <= 60) return 'Оптимальный уровень'
      if (humidityNum <= 70) return 'Повышенная влажность'
      return 'Высокая влажность'
    }
    
    // Общий метод для переключения любого устройства
    const toggleDevice = (device) => {
      // Отправляем команду на сервер с инвертированным состоянием
      deviceStore.toggleDevice(device.id, !device.active)
        .catch(error => {
          console.error('Ошибка при переключении устройства:', error)
        })
    }
    
    // Обработка добавления устройства
    const handleDeviceAdded = async (device) => {
      try {
        // Обновляем список устройств
        await deviceStore.fetchDevices()
        
        // Выводим сообщение об успешном добавлении
        console.log('Добавлено устройство:', device)
      } catch (error) {
        console.error('Ошибка при обработке добавленного устройства:', error)
      }
    }
    
    // Обработка ошибок
    const handleError = (error) => {
      console.error('Ошибка:', error)
    }
    
    // Добавляем новые функции для улучшенного отображения датчика влажности
    const getHumidityColor = (humidity) => {
      if (!humidity) return '#9CA3AF' // серый для неизвестного значения
      
      const humidityNum = parseInt(humidity)
      
      if (isNaN(humidityNum)) return '#9CA3AF'
      
      if (humidityNum < 30) return '#EF4444' // красный для слишком сухого
      if (humidityNum < 40) return '#F59E0B' // оранжевый для сухого
      if (humidityNum <= 60) return '#10B981' // зеленый для оптимального
      if (humidityNum <= 70) return '#F59E0B' // оранжевый для повышенной влажности
      return '#EF4444' // красный для высокой влажности
    }
    
    const getCircleLength = (radius) => {
      return 2 * Math.PI * radius
    }
    
    const getCircleOffset = (radius, percent) => {
      const circumference = getCircleLength(radius)
      const percentValue = parseFloat(percent) || 0
      return circumference - (circumference * Math.min(percentValue, 100) / 100)
    }
    
    const getHumidityRecommendation = (humidity) => {
      if (!humidity) return 'Нет данных о влажности'
      
      const humidityNum = parseInt(humidity)
      
      if (isNaN(humidityNum)) return 'Нет данных о влажности'
      
      if (humidityNum < 30) return 'Рекомендуется включить увлажнитель воздуха'
      if (humidityNum < 40) return 'Влажность ниже комфортной. Увлажнение рекомендуется'
      if (humidityNum <= 60) return 'Идеальный уровень влажности для здоровья'
      if (humidityNum <= 70) return 'Влажность выше комфортной нормы'
      return 'Высокая влажность. Рекомендуется использовать осушитель'
    }
    
    // Константы для телевизора
    const inputSources = [
      { value: 'tv', label: 'ТВ' },
      { value: 'hdmi1', label: 'HDMI 1' },
      { value: 'hdmi2', label: 'HDMI 2' },
      { value: 'av', label: 'AV' },
      { value: 'usb', label: 'USB' },
      { value: 'smarttv', label: 'Smart TV' }
    ]
    
    // Методы для управления телевизором
    const toggleTV = async (device) => {
      try {
        const newState = !device.active
        const command = {
          command: 'setState',
          parameters: {
            attr_server_active: newState ? 'true' : 'false',
            tb_power: newState ? 'on' : 'off'
          }
        }
        
        const response = await api.devices.sendCommand(device.id, command)
        
        // Обновляем состояние на основе ответа сервера
        if (response && response.properties) {
          // Обновляем rawProperties
          if (!device.rawProperties) device.rawProperties = {}
          Object.assign(device.rawProperties, response.properties)
          
          // Обновляем флаг активности на основе обоих свойств
          device.active = response.properties.attr_server_active === 'true' && 
                          response.properties.tb_power === 'on'
        } else {
          // Если нет ответа с сервера, обновляем локально
          device.active = newState
        }
        
        // Принудительно обновляем состояние устройства через 500мс
        setTimeout(() => refreshDeviceState(device), 500);
      } catch (error) {
        console.error('Ошибка при изменении состояния ТВ:', error)
        
        // При ошибке также стоит обновить состояние устройства
        setTimeout(() => refreshDeviceState(device), 500);
      }
    }
    
    const changeChannel = async (device, delta) => {
      try {
        // Получаем текущий канал
        let currentChannel = parseInt(device.rawProperties?.tb_channel || '1')
        const newChannel = Math.max(1, currentChannel + delta)
        
        const command = {
          command: 'setState',
          parameters: {
            tb_channel: newChannel.toString()
          }
        }
        
        // Также добавляем флаг активности, если устройство активно
        if (device.active) {
          command.parameters.attr_server_active = 'true';
        }
        
        await api.devices.sendCommand(device.id, command)
        
        // Обновляем состояние локально
        if (!device.rawProperties) device.rawProperties = {}
        device.rawProperties.tb_channel = newChannel.toString()
        
        // Принудительно обновляем состояние устройства через 500мс
        setTimeout(() => refreshDeviceState(device), 500);
        
        console.log(`Переключено на канал ${newChannel}`);
      } catch (error) {
        console.error('Ошибка при переключении канала:', error)
        // Удаляем раздражающее уведомление
        
        // При ошибке также обновляем состояние
        setTimeout(() => refreshDeviceState(device), 500);
      }
    }
    
    // Функция для принудительного обновления состояния устройства с сервера
    const refreshDeviceState = async (device) => {
      try {
        // Получаем обновленную информацию об устройстве с сервера
        const updatedDevice = await api.devices.getDevice(device.id)
        
        // Обновляем локальное состояние устройства
        if (updatedDevice) {
          // Обновляем свойства
          if (!device.rawProperties) device.rawProperties = {}
          Object.assign(device.rawProperties, updatedDevice.properties)
          
          // Обновляем флаг активности
          if (device.category === 'APPLIANCES' && device.subType === 'TV') {
            device.active = updatedDevice.properties.attr_server_active === 'true' && 
                           updatedDevice.properties.tb_power === 'on'
          } else {
            device.active = updatedDevice.properties.attr_server_active === 'true' || 
                           updatedDevice.properties.tb_power === 'on'
          }
          
          // Обновляем другие свойства
          if (updatedDevice.properties.tb_brightness) {
            device.brightness = parseInt(updatedDevice.properties.tb_brightness)
          }
          
          if (updatedDevice.properties.tb_color) {
            device.color = `#${updatedDevice.properties.tb_color}`
          }
          
          console.log('Устройство обновлено с сервера:', device)
          return true
        }
        return false
      } catch (error) {
        console.error('Ошибка при обновлении состояния устройства:', error)
        return false
      }
    }
    
    const setChannel = async (device, channel) => {
      try {
        const command = {
          command: 'setState',
          parameters: {
            tb_channel: channel.toString()
          }
        }
        
        // Также добавляем флаг активности, если устройство активно
        if (device.active) {
          command.parameters.attr_server_active = 'true';
        }
        
        await api.devices.sendCommand(device.id, command)
        
        // Обновляем состояние локально
        if (!device.rawProperties) device.rawProperties = {}
        device.rawProperties.tb_channel = channel.toString()
        
        // Принудительно обновляем состояние устройства через 500мс
        setTimeout(() => refreshDeviceState(device), 500);
        
        console.log(`Выбран канал ${channel}`);
      } catch (error) {
        console.error('Ошибка при выборе канала:', error)
        // Удаляем раздражающее уведомление
        
        // При ошибке также обновляем состояние
        setTimeout(() => refreshDeviceState(device), 500);
      }
    }
    
    const changeVolume = async (device, event) => {
      try {
        const newVolume = event.target.value
        
        // Обновляем состояние локально сразу
        if (!device.rawProperties) device.rawProperties = {}
        device.rawProperties.tb_volume = newVolume.toString()
        
        // Отправляем команду на сервер (только при отпускании ползунка)
        const command = {
          command: 'setState',
          parameters: {
            tb_volume: newVolume.toString()
          }
        }
        
        // Также добавляем флаг активности, если устройство активно
        if (device.active) {
          command.parameters.attr_server_active = 'true';
        }
        
        await api.devices.sendCommand(device.id, command)
        
        // Принудительно обновляем состояние устройства через 500мс
        setTimeout(() => refreshDeviceState(device), 500);
        
        console.log(`Громкость изменена: ${newVolume}`);
      } catch (error) {
        console.error('Ошибка при изменении громкости:', error)
        
        // При ошибке также обновляем состояние
        setTimeout(() => refreshDeviceState(device), 500);
      }
    }
    
    const changeInputSource = async (device, source) => {
      try {
        const command = {
          command: 'setState',
          parameters: {
            tb_input_source: source
          }
        }
        
        // Также добавляем флаг активности, если устройство активно
        if (device.active) {
          command.parameters.attr_server_active = 'true';
        }
        
        await api.devices.sendCommand(device.id, command)
        
        // Обновляем состояние локально
        if (!device.rawProperties) device.rawProperties = {}
        device.rawProperties.tb_input_source = source
        
        // Принудительно обновляем состояние устройства через 500мс
        setTimeout(() => refreshDeviceState(device), 500);
        
        // Находим метку для отображения без уведомления
        const sourceLabel = inputSources.find(item => item.value === source)?.label || source
        console.log(`Выбран источник: ${sourceLabel}`);
      } catch (error) {
        console.error('Ошибка при изменении источника:', error)
        // Удаляем раздражающее уведомление
        
        // При ошибке также обновляем состояние
        setTimeout(() => refreshDeviceState(device), 500);
      }
    }
    
    // Метод для обновления только локального значения громкости без отправки запроса
    const updateLocalVolume = (device, event) => {
      const newVolume = event.target.value
      if (!device.rawProperties) device.rawProperties = {}
      device.rawProperties.tb_volume = newVolume.toString()
    }
    
    const getFavoriteChannels = (device) => {
      if (!device.rawProperties?.tb_favorite_channels) return [1, 2, 3, 4]
      return device.rawProperties.tb_favorite_channels.split(',').map(ch => ch.trim())
    }
    
    const getTVStatus = (device) => {
      if (!device.active) return 'Выключен'
      
      const channel = device.rawProperties?.tb_channel || '1'
      const source = device.rawProperties?.tb_input_source || 'tv'
      const sourceLabel = inputSources.find(item => item.value === source)?.label || source
      
      return `${sourceLabel}, канал ${channel}`
    }

    return {
      searchQuery,
      selectedRoom,
      rooms,
      filteredDevices,
      isAddDeviceModalOpen,
      openAddDeviceModal,
      closeAddDeviceModal,
      getDeviceIcon,
      handleToggleLight,
      handleBrightnessChange,
      handleColorPickerChange,
      predefinedColors,
      handleDeviceAdded,
      handleError,
      decreaseTemperature,
      increaseTemperature,
      getModeText,
      toggleLock,
      toggleRecording,
      startVacuum,
      stopVacuum,
      getVacuumStatus,
      toggleDevice,
      formatDate,
      getHumidityLevelText,
      getHumidityColor,
      getCircleLength,
      getCircleOffset,
      getHumidityRecommendation,
      toggleDetails,
      shouldShowDetails,
      isUpdating,
      refreshDevices,
      getTemperatureLevelText,
      getTemperatureDashOffset,
      getTemperatureColor,
      getTemperatureRecommendation,
      getTemperatureTitle,
      getTemperatureDetailedMessage,
      setPeriod,
      getPeriod,
      inputSources,
      changeChannel,
      setChannel,
      changeVolume,
      changeInputSource,
      getFavoriteChannels,
      toggleTV,
      getTVStatus,
      refreshDeviceState,
      updateLocalVolume,
      loading,
      error
    }
  }
}
</script> 

<style scoped>
/* Стили для ползунка - улучшенная версия */
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 8px;
  background: #e2e8f0;
  outline: none;
  position: relative;
  cursor: pointer;
  margin: 10px 0;
}

/* Стиль для трека */
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 8px;
  border-radius: 8px;
  background: #e2e8f0;
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 8px;
  border-radius: 8px;
  background: #e2e8f0;
}

/* Настраиваем псевдоэлемент для фона заполнения */
input[type=range]::before {
  content: '';
  position: absolute;
  height: 8px;
  left: 0;
  top: 0;
  background: linear-gradient(90deg, #3B82F6, #60A5FA);
  border-radius: 8px;
  z-index: 1;
  pointer-events: none;
}

/* Стиль для ползунка */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3B82F6;
  border: 2px solid white;
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

input[type=range]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3B82F6;
  border: 2px solid white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  position: relative;
  z-index: 2;
}

/* Эффекты при наведении */
input[type=range]:hover::-webkit-slider-thumb {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

input[type=range]:hover::-moz-range-thumb {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

/* Эффекты при нажатии */
input[type=range]:active::-webkit-slider-thumb {
  transform: scale(0.9);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.4);
}

input[type=range]:active::-moz-range-thumb {
  transform: scale(0.9);
}

/* Стили для переключателя (toggle switch) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e2e8f0;
  transition: 0.4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
  background-color: #3B82F6;
}

input:focus + .toggle-slider {
  box-shadow: 0 0 2px #3B82F6;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* Стили для disabled состояния */
input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

input:disabled + .toggle-slider:before {
  background-color: #f1f1f1;
}

/* Эффект наведения */
.toggle-slider:hover {
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);
}

input:checked + .toggle-slider:hover {
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.6);
}

.light-bulb-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.light-glow {
  border-radius: 50%;
  transition: all 0.3s ease;
}
</style> 