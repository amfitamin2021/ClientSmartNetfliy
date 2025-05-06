<template>
  <div class="room-visualization">
    <div class="canvas-container" ref="canvasContainer"></div>
    
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">Загрузка 3D-модели...</div>
    </div>
    
    <!-- Панель управления -->
    <div class="controls-panel">
      <button @click="resetCamera" class="control-btn">
        <i class="fas fa-sync-alt"></i>
      </button>
      
      <button @click="toggleWireframe" class="control-btn">
        <i class="fas fa-border-all"></i>
      </button>
      
      <button @click="toggleLights" class="control-btn">
        <i class="fas fa-lightbulb"></i>
      </button>
      
      <button @click="toggleDeviceLabels" class="control-btn">
        <i class="fas fa-tag"></i>
      </button>

      <button @click="toggleEffects" class="control-btn">
        <i class="fas fa-magic"></i>
      </button>
    </div>
    
    <!-- Информация о выбранном устройстве -->
    <div v-if="selectedDevice" class="device-info-panel">
      <div class="panel-header">
        <h3>{{ selectedDevice.name }}</h3>
        <button @click="closeDeviceInfo" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="panel-content">
        <div class="info-row">
          <span class="label">Тип:</span>
          <span class="value">{{ selectedDevice.type }}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Статус:</span>
          <span class="value" :class="selectedDevice.status === 'ONLINE' ? 'status-online' : 'status-offline'">
            {{ selectedDevice.status === 'ONLINE' ? 'Онлайн' : 'Оффлайн' }}
          </span>
        </div>
        
        <div class="device-controls" v-if="selectedDevice.canControl">
          <!-- Управление в зависимости от типа устройства -->
          <div v-if="selectedDevice.type === 'LIGHT'" class="light-controls">
            <div class="control-row">
              <span class="label">Включение:</span>
              <label class="switch">
                <input 
                  type="checkbox" 
                  :checked="selectedDevice.power === 'on'" 
                  @change="toggleDevice(selectedDevice)"
                >
                <span class="slider round"></span>
              </label>
            </div>
            
            <div v-if="selectedDevice.capabilities?.brightness" class="control-row">
              <span class="label">Яркость:</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                :value="selectedDevice.brightness" 
                @input="updateBrightness($event, selectedDevice)"
                class="range-input"
              >
              <span class="value">{{ selectedDevice.brightness }}%</span>
            </div>
            
            <div v-if="selectedDevice.capabilities?.color" class="control-row">
              <span class="label">Цвет:</span>
              <div 
                class="color-preview" 
                :style="{ backgroundColor: '#' + selectedDevice.color }"
                @click="showColorPicker = true"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { useDeviceStore } from '@/store/deviceStore'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'

export default {
  name: 'Room3DVisualization',
  
  props: {
    roomId: {
      type: String,
      required: true
    },
    devices: {
      type: Array,
      default: () => []
    },
    roomData: {
      type: Object,
      required: true
    }
  },
  
  emits: ['device-selected', 'device-updated'],
  
  setup(props, { emit }) {
    const deviceStore = useDeviceStore()
    const canvasContainer = ref(null)
    const isLoading = ref(true)
    const selectedDevice = ref(null)
    const showColorPicker = ref(false)
    
    // Three.js компоненты
    let scene, camera, renderer, controls
    let roomMesh, floorMesh
    let deviceObjects = []
    let lights = []
    let isWireframe = false
    let areLightsOn = true
    let areLabelsVisible = true
    let effectsEnabled = true
    
    // HTML-элементы для меток
    let deviceLabels = []
    
    // Композитор эффектов
    let composer, bloomPass, glitchPass, rgbShiftPass
    
    // Инициализация 3D-сцены
    const initScene = () => {
      // Создание сцены
      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x121212) // Темный фон
      
      // Добавление тумана для атмосферы
      scene.fog = new THREE.FogExp2(0x121212, 0.035)
      
      // Размеры контейнера
      const width = canvasContainer.value.clientWidth
      const height = canvasContainer.value.clientHeight
      
      // Создание камеры
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)
      
      // Создание рендерера
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputEncoding = THREE.sRGBEncoding
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2
      canvasContainer.value.appendChild(renderer.domElement)
      
      // Добавление управления орбитальной камерой
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.25
      controls.screenSpacePanning = false
      controls.maxPolarAngle = Math.PI / 2
      
      // Добавление света
      const ambientLight = new THREE.AmbientLight(0x303030, 0.3) // Приглушенное окружающее освещение
      scene.add(ambientLight)
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7)
      directionalLight.position.set(5, 10, 7)
      directionalLight.castShadow = true
      // Настройка теней для красивого рендеринга
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      directionalLight.shadow.camera.near = 0.5
      directionalLight.shadow.camera.far = 50
      directionalLight.shadow.bias = -0.0001
      scene.add(directionalLight)
      
      // Добавляем мягкий точечный свет для заполнения сцены
      const pointLight = new THREE.PointLight(0x2d8fd5, 1, 15)
      pointLight.position.set(-3, 5, 0)
      pointLight.castShadow = true
      scene.add(pointLight)
      
      // Добавляем подсветку с другой стороны для создания контраста
      const accentLight = new THREE.PointLight(0xd056d3, 1, 10)
      accentLight.position.set(3, 3, -3)
      scene.add(accentLight)
      
      lights.push(ambientLight, directionalLight, pointLight, accentLight)
      
      // Создание комнаты
      createRoom()
      
      // Добавление устройств
      updateDevices()
      
      // Инициализация эффектов
      initPostProcessing()
      
      // Запуск анимации
      animate()
      
      isLoading.value = false
    }
    
    // Создание модели комнаты
    const createRoom = () => {
      // Пол
      const floorGeometry = new THREE.PlaneGeometry(10, 10, 32, 32)
      const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.DoubleSide
      })
      floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)
      floorMesh.rotation.x = -Math.PI / 2
      floorMesh.receiveShadow = true
      scene.add(floorMesh)
      
      // Добавляем текстуру сетки на пол для лучшей ориентации
      const gridHelper = new THREE.GridHelper(10, 20, 0x555555, 0x333333)
      gridHelper.position.y = 0.01
      scene.add(gridHelper)
      
      // Стены
      const wallHeight = 3
      const roomGeometry = new THREE.BoxGeometry(10, wallHeight, 10)
      const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x272727,
        roughness: 0.8,
        metalness: 0.3,
        transparent: true,
        opacity: 0.7,
        side: THREE.BackSide
      })
      roomMesh = new THREE.Mesh(roomGeometry, wallMaterial)
      roomMesh.position.y = wallHeight / 2
      roomMesh.receiveShadow = true
      scene.add(roomMesh)
      
      // Добавление эффектов неоновой подсветки по углам комнаты
      addNeonEdges(wallHeight)
    }
    
    // Добавление неоновых краев вдоль стен
    const addNeonEdges = (wallHeight) => {
      const edgeGeometry = new THREE.BoxGeometry(10.05, 0.05, 0.05)
      const neonMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2d8fd5,
        emissive: 0x2d8fd5,
        emissiveIntensity: 1
      })
      
      // Вертикальные ребра
      for (let i = 0; i < 4; i++) {
        const vertEdge = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, wallHeight, 0.05),
          new THREE.MeshBasicMaterial({ color: 0xd056d3, emissive: 0xd056d3 })
        )
        
        const x = (i % 2 === 0) ? -5 : 5
        const z = (i < 2) ? -5 : 5
        
        vertEdge.position.set(x, wallHeight/2, z)
        scene.add(vertEdge)
      }
      
      // Горизонтальные ребра внизу
      for (let i = 0; i < 4; i++) {
        const edge = new THREE.Mesh(edgeGeometry, neonMaterial)
        
        if (i < 2) {
          edge.position.set(0, 0.025, i === 0 ? -5 : 5)
        } else {
          edge.rotation.y = Math.PI / 2
          edge.position.set(i === 2 ? -5 : 5, 0.025, 0)
        }
        
        scene.add(edge)
      }
      
      // Горизонтальные ребра вверху
      for (let i = 0; i < 4; i++) {
        const topEdge = new THREE.Mesh(edgeGeometry, 
          new THREE.MeshBasicMaterial({ color: 0x2d8fd5, emissive: 0x2d8fd5 })
        )
        
        if (i < 2) {
          topEdge.position.set(0, wallHeight, i === 0 ? -5 : 5)
        } else {
          topEdge.rotation.y = Math.PI / 2
          topEdge.position.set(i === 2 ? -5 : 5, wallHeight, 0)
        }
        
        scene.add(topEdge)
      }
    }
    
    // Создание 3D-представления устройства
    const createDeviceObject = (device) => {
      let mesh
      
      // Используем категорию и подтип если они есть, иначе используем обычный тип
      if (device.category && device.subType) {
        // Создаем модель на основе категории и подтипа
        switch (device.category) {
          case 'LIGHTING':
            if (device.subType === 'SMART_BULB' || device.subType === 'LED_STRIP' || 
                device.subType === 'CEILING_LIGHT') {
              mesh = createLightbulb(device)
            } else {
              mesh = createDefaultDevice(device)
            }
            break
            
          case 'CLIMATE':
            if (device.subType === 'THERMOSTAT' || device.subType === 'TEMPERATURE_SENSOR') {
              mesh = createThermostat(device)
            } else {
              mesh = createDefaultDevice(device)
            }
            break
            
          case 'SECURITY':
            if (device.subType === 'CAMERA') {
              mesh = createCamera(device)
            } else if (device.subType === 'SMART_LOCK') {
              mesh = createLock(device)
            } else {
              mesh = createDefaultDevice(device)
            }
            break
            
          case 'APPLIANCES':
            if (device.subType === 'TV') {
              mesh = createTV(device)
            } else if (device.subType === 'VACUUM') {
              mesh = createVacuum(device)
            } else {
              mesh = createDefaultDevice(device)
            }
            break
            
          default:
            mesh = createDefaultDevice(device)
        }
      } else {
        // Для обратной совместимости используем старую логику по типу
        switch(device.type.toUpperCase()) {
          case 'LIGHT':
            mesh = createLightbulb(device)
            break
            
          case 'THERMOSTAT':
            mesh = createThermostat(device)
            break
            
          case 'LOCK':
            mesh = createLock(device)
            break
            
          case 'CAMERA':
            mesh = createCamera(device)
            break
            
          case 'TV':
            mesh = createTV(device)
            break
            
          case 'VACUUM':
            mesh = createVacuum(device)
            break
            
          default:
            mesh = createDefaultDevice(device)
        }
      }
      
      mesh.userData = { deviceId: device.id }
      
      // Позиционирование устройства
      const x = (Math.random() - 0.5) * 8
      const z = (Math.random() - 0.5) * 8
      let y = 0.5
      
      // Особое позиционирование для разных типов устройств
      if (device.category) {
        switch(device.category) {
          case 'LIGHTING':
            y = 2.5 // Освещение у потолка
            break
          case 'SECURITY':
            if (device.subType === 'CAMERA') {
              y = 2.2 // Камеры высоко
            } else if (device.subType === 'SMART_LOCK') {
              // Замки на стенах
              const wallSide = Math.random() > 0.5 ? 1 : -1
              if (Math.random() > 0.5) {
                // Вертикальная стена
                mesh.position.set(4.5 * wallSide, 1.3, z)
                mesh.rotation.y = wallSide > 0 ? -Math.PI / 2 : Math.PI / 2
                return mesh
              } else {
                // Горизонтальная стена
                mesh.position.set(x, 1.3, 4.5 * wallSide)
                mesh.rotation.y = wallSide > 0 ? Math.PI : 0
                return mesh
              }
            }
            break
          case 'APPLIANCES':
            if (device.subType === 'TV') {
              y = 1.0 // ТВ на уровне тумбы
              
              // Размещаем ТВ у стены
              const wallSide = Math.random() > 0.5 ? 1 : -1
              if (Math.random() > 0.5) {
                // Вертикальная стена
                mesh.position.set(4.5 * wallSide, y, z)
                mesh.rotation.y = wallSide > 0 ? -Math.PI / 2 : Math.PI / 2
                return mesh
              } else {
                // Горизонтальная стена
                mesh.position.set(x, y, 4.5 * wallSide)
                mesh.rotation.y = wallSide > 0 ? Math.PI : 0
                return mesh
              }
            } else if (device.subType === 'VACUUM') {
              y = 0.1 // Пылесос на полу
            }
            break
          case 'CLIMATE':
            if (device.subType === 'THERMOSTAT') {
              // Термостаты на стенах
              const wallSide = Math.random() > 0.5 ? 1 : -1
              if (Math.random() > 0.5) {
                // Вертикальная стена
                mesh.position.set(4.9 * wallSide, 1.5, z)
                mesh.rotation.y = wallSide > 0 ? -Math.PI / 2 : Math.PI / 2
                return mesh
              } else {
                // Горизонтальная стена
                mesh.position.set(x, 1.5, 4.9 * wallSide)
                mesh.rotation.y = wallSide > 0 ? Math.PI : 0
                return mesh
              }
            }
            break
        }
      } else {
        // Обратная совместимость для устаревшего свойства type
        switch(device.type.toUpperCase()) {
          case 'LIGHT':
            y = 2.5 // Размещаем лампочку у потолка
            break
          case 'CAMERA':
            y = 2.2 // Камеру тоже размещаем повыше
            break
          case 'TV':
            y = 1.0 // ТВ на уровне тумбы
            break
        }
      }
      
      mesh.position.set(x, y, z)
      return mesh
    }
    
    // Создание модели лампочки
    const createLightbulb = (device) => {
      const group = new THREE.Group()
      
      // Цоколь лампочки
      const baseGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.15, 16)
      const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.2,
        metalness: 0.8
      })
      const base = new THREE.Mesh(baseGeometry, baseMaterial)
      base.position.y = -0.15
      group.add(base)
      
      // Стеклянная колба
      const bulbGeometry = new THREE.SphereGeometry(0.15, 32, 32)
      const color = device.color ? parseInt('0x' + device.color) : 0xffcc00
      const bulbMaterial = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: device.power === 'on' ? color : 0x000000,
        emissiveIntensity: device.brightness ? device.brightness / 100 : 0.5,
        transparent: true,
        transmission: 0.9,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      })
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial)
      group.add(bulb)
      
      // Нить накаливания (только для включенных ламп)
      if (device.power === 'on') {
        const filamentGeometry = new THREE.TorusGeometry(0.05, 0.005, 16, 32)
        const filamentMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffcc00,
          emissive: 0xffcc00,
        })
        const filament = new THREE.Mesh(filamentGeometry, filamentMaterial)
        filament.rotation.x = Math.PI / 2
        bulb.add(filament)
        
        // Добавляем свет
        const pointLight = new THREE.PointLight(
          color,
          device.brightness ? device.brightness / 100 * 0.7 : 0.3,
          3
        )
        pointLight.position.set(0, 0, 0)
        group.add(pointLight)
        
        // Добавляем эффект свечения
        const glowGeometry = new THREE.SphereGeometry(0.25, 32, 32)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.15,
          side: THREE.BackSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        group.add(glow)
      }
      
      // Устанавливаем свойства для всех элементов группы
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание модели термостата
    const createThermostat = (device) => {
      const group = new THREE.Group()
      
      // Корпус термостата
      const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32)
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee,
        roughness: 0.2,
        metalness: 0.5
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.rotation.x = Math.PI / 2
      group.add(body)
      
      // Дисплей термостата
      const displayGeometry = new THREE.CircleGeometry(0.14, 32)
      const displayMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
      })
      const display = new THREE.Mesh(displayGeometry, displayMaterial)
      display.position.set(0, 0, 0.041)
      body.add(display)
      
      // Температура на дисплее
      if (device.temperature) {
        // Создаем текстуру для отображения температуры
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = 128
        canvas.height = 128
        
        context.fillStyle = '#333333'
        context.fillRect(0, 0, 128, 128)
        
        context.font = 'bold 48px Arial'
        context.fillStyle = device.temperature > 24 ? '#ff5722' : '#2196f3'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(`${device.temperature}°`, 64, 64)
        
        const texture = new THREE.CanvasTexture(canvas)
        displayMaterial.map = texture
        displayMaterial.needsUpdate = true
      }
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание модели замка
    const createLock = (device) => {
      const group = new THREE.Group()
      
      // Основа замка
      const baseGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.08)
      const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x404040,
        roughness: 0.2,
        metalness: 0.8
      })
      const base = new THREE.Mesh(baseGeometry, baseMaterial)
      group.add(base)
      
      // Дисплей или индикатор
      const indicatorGeometry = new THREE.CircleGeometry(0.04, 32)
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: device.status === 'locked' ? 0xff0000 : 0x00ff00, 
      })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.position.set(0, 0.1, 0.041)
      base.add(indicator)
      
      // Клавиатура или сенсорная панель
      const keypadGeometry = new THREE.PlaneGeometry(0.18, 0.18)
      const keypadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.9,
        metalness: 0.2
      })
      const keypad = new THREE.Mesh(keypadGeometry, keypadMaterial)
      keypad.position.set(0, -0.07, 0.041)
      base.add(keypad)
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание модели камеры
    const createCamera = (device) => {
      const group = new THREE.Group()
      
      // Корпус камеры
      const bodyGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.35)
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.5
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      group.add(body)
      
      // Объектив
      const lensGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 32)
      const lensMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.1,
        metalness: 0.9
      })
      const lens = new THREE.Mesh(lensGeometry, lensMaterial)
      lens.rotation.x = Math.PI / 2
      lens.position.set(0, 0, 0.2)
      group.add(lens)
      
      // Индикатор
      const indicatorGeometry = new THREE.CircleGeometry(0.015, 16)
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: device.power === 'on' ? 0xff0000 : 0x333333
      })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.position.set(0.06, 0.05, 0.18)
      group.add(indicator)
      
      // Кронштейн крепления
      const mountGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.15)
      const mountMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555,
        roughness: 0.5,
        metalness: 0.5
      })
      const mount = new THREE.Mesh(mountGeometry, mountMaterial)
      mount.position.set(0, 0, -0.15)
      group.add(mount)
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      // Поворот камеры, чтобы она смотрела вниз
      group.rotation.x = -Math.PI / 6
      
      return group
    }
    
    // Создание модели телевизора
    const createTV = (device) => {
      const group = new THREE.Group()
      
      // Экран телевизора
      const screenGeometry = new THREE.BoxGeometry(0.8, 0.45, 0.05)
      const screenMaterial = new THREE.MeshStandardMaterial({ 
        color: device.power === 'on' ? 0x333333 : 0x111111,
        roughness: 0.1,
        metalness: 0.5
      })
      const screen = new THREE.Mesh(screenGeometry, screenMaterial)
      group.add(screen)
      
      // Рамка
      const frameGeometry = new THREE.BoxGeometry(0.85, 0.5, 0.06)
      const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.7
      })
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.z = -0.01
      group.add(frame)
      
      // Подставка
      const standGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2)
      const standMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.7
      })
      const stand = new THREE.Mesh(standGeometry, standMaterial)
      stand.position.set(0, -0.3, 0)
      group.add(stand)
      
      // Экран с изображением для включенного ТВ
      if (device.power === 'on') {
        const activeScreenGeometry = new THREE.PlaneGeometry(0.75, 0.4)
        
        // Создаем текстуру с градиентом для экрана
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = 256
        canvas.height = 128
        
        // Создаем градиент
        const gradient = context.createLinearGradient(0, 0, 0, 128)
        gradient.addColorStop(0, '#0077cc')
        gradient.addColorStop(1, '#00aaff')
        
        context.fillStyle = gradient
        context.fillRect(0, 0, 256, 128)
        
        // Добавляем немного контента
        context.fillStyle = 'rgba(255, 255, 255, 0.7)'
        for (let i = 0; i < 5; i++) {
          context.fillRect(20, 20 + i * 20, 200 - i * 30, 8)
        }
        
        const texture = new THREE.CanvasTexture(canvas)
        const screenActiveMaterial = new THREE.MeshBasicMaterial({ 
          map: texture
        })
        const activeScreen = new THREE.Mesh(activeScreenGeometry, screenActiveMaterial)
        activeScreen.position.z = 0.03
        screen.add(activeScreen)
        
        // Добавляем свечение для экрана
        const glowGeometry = new THREE.PlaneGeometry(0.85, 0.5)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00aaff,
          transparent: true,
          opacity: 0.2,
          side: THREE.FrontSide
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        glow.position.z = 0.04
        screen.add(glow)
      }
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание модели робота-пылесоса
    const createVacuum = (device) => {
      const group = new THREE.Group()
      
      // Основная часть пылесоса
      const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 32)
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.3,
        metalness: 0.7
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.rotation.x = Math.PI / 2
      group.add(body)
      
      // Верхняя часть с кнопками
      const topGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 32)
      const topMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x666666,
        roughness: 0.4,
        metalness: 0.6
      })
      const top = new THREE.Mesh(topGeometry, topMaterial)
      top.position.y = 0.05
      body.add(top)
      
      // Индикатор
      const indicatorGeometry = new THREE.CircleGeometry(0.03, 16)
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: device.power === 'on' ? 0x00ff00 : 0x555555
      })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.rotation.x = -Math.PI / 2
      indicator.position.set(0, 0.02, 0)
      top.add(indicator)
      
      // Бампер
      const bumperGeometry = new THREE.TorusGeometry(0.25, 0.02, 16, 32)
      const bumperMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.3
      })
      const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial)
      bumper.rotation.x = Math.PI / 2
      bumper.position.y = -0.02
      body.add(bumper)
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание по умолчанию для неизвестных типов устройств
    const createDefaultDevice = (device) => {
      const group = new THREE.Group()
      
      // Основная часть 
      const bodyGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x607d8b,
        roughness: 0.4,
        metalness: 0.6
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      group.add(body)
      
      // Индикатор
      const indicatorGeometry = new THREE.CircleGeometry(0.04, 16)
      const indicatorMaterial = new THREE.MeshBasicMaterial({ 
        color: device.power === 'on' ? 0x00ff00 : 0x555555
      })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.position.set(0, 0, 0.13)
      group.add(indicator)
      
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      
      return group
    }
    
    // Создание HTML-метки для устройства
    const createDeviceLabel = (device, position) => {
      const label = document.createElement('div')
      label.className = 'device-label'
      label.textContent = device.name
      label.style.display = areLabelsVisible ? 'block' : 'none'
      
      // Добавляем индикатор статуса
      const statusIndicator = document.createElement('span')
      statusIndicator.className = `status-indicator ${device.status === 'ONLINE' ? 'online' : 'offline'}`
      label.appendChild(statusIndicator)
      
      canvasContainer.value.appendChild(label)
      
      return {
        element: label,
        deviceId: device.id,
        update: (newPosition) => {
          // Преобразование 3D-координат в экранные
          const vector = newPosition.clone()
          vector.project(camera)
          
          const x = (vector.x * 0.5 + 0.5) * canvasContainer.value.clientWidth
          const y = (-vector.y * 0.5 + 0.5) * canvasContainer.value.clientHeight
          
          label.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
        }
      }
    }
    
    // Обновление устройств в сцене
    const updateDevices = () => {
      // Удаляем существующие объекты устройств
      deviceObjects.forEach(obj => {
        scene.remove(obj)
      })
      
      // Удаляем метки устройств
      deviceLabels.forEach(label => {
        if (label.element && label.element.parentNode) {
          label.element.parentNode.removeChild(label.element)
        }
      })
      
      deviceObjects = []
      deviceLabels = []
      
      // Добавляем устройства из props
      props.devices.forEach(device => {
        const deviceObj = createDeviceObject(device)
        scene.add(deviceObj)
        deviceObjects.push(deviceObj)
        
        const label = createDeviceLabel(device, deviceObj.position)
        deviceLabels.push(label)
      })
    }
    
    // Инициализация эффектов постобработки
    const initPostProcessing = () => {
      composer = new EffectComposer(renderer)
      
      // Основной рендеринг сцены
      const renderPass = new RenderPass(scene, camera)
      composer.addPass(renderPass)
      
      // Свечение для неоновых объектов
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight),
        0.8,    // интенсивность
        0.3,    // радиус
        0.85    // порог
      )
      composer.addPass(bloomPass)
      
      // Смещение RGB каналов для киберпанк-эффекта
      rgbShiftPass = new ShaderPass(RGBShiftShader)
      rgbShiftPass.uniforms['amount'].value = 0.0015
      rgbShiftPass.enabled = false
      composer.addPass(rgbShiftPass)
      
      // Эффект глитча для включения при выборе устройств
      glitchPass = new GlitchPass()
      glitchPass.goWild = false
      glitchPass.enabled = false
      composer.addPass(glitchPass)
      
      // Коррекция гаммы
      const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader)
      composer.addPass(gammaCorrectionPass)
    }
    
    // Переключение визуальных эффектов
    const toggleEffects = () => {
      effectsEnabled = !effectsEnabled
      
      bloomPass.enabled = effectsEnabled
      if (effectsEnabled) {
        // При включении эффектов добавляем легкое смещение RGB
        rgbShiftPass.enabled = true
        rgbShiftPass.uniforms['amount'].value = 0.0015
      } else {
        rgbShiftPass.enabled = false
      }
    }
    
    // Активация эффекта глитча на короткое время
    const activateGlitch = () => {
      if (!glitchPass) return
      
      glitchPass.enabled = true
      setTimeout(() => {
        glitchPass.enabled = false
      }, 700)
    }
    
    // Обработка выбора устройства
    const onDeviceClick = (event) => {
      // Получаем координаты клика в пределах canvas
      const canvasBounds = renderer.domElement.getBoundingClientRect()
      const mouseX = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1
      const mouseY = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1
      
      // Создаем луч для выбора объекта
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera)
      
      // Проверяем пересечения с объектами устройств
      const intersects = raycaster.intersectObjects(deviceObjects)
      
      if (intersects.length > 0) {
        const selectedObj = intersects[0].object
        const deviceId = selectedObj.userData.deviceId
        const device = props.devices.find(d => d.id === deviceId)
        
        if (device) {
          selectedDevice.value = device
          emit('device-selected', device)
          
          // Активируем эффект глитча при выборе устройства
          activateGlitch()
        }
      } else {
        selectedDevice.value = null
        emit('device-selected', null)
      }
    }
    
    // Сброс камеры в исходное положение
    const resetCamera = () => {
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)
      controls.update()
    }
    
    // Переключение режима отображения (wireframe)
    const toggleWireframe = () => {
      isWireframe = !isWireframe
      roomMesh.material.wireframe = isWireframe
      floorMesh.material.wireframe = isWireframe
      
      deviceObjects.forEach(obj => {
        obj.material.wireframe = isWireframe
      })
    }
    
    // Переключение освещения
    const toggleLights = () => {
      areLightsOn = !areLightsOn
      lights.forEach(light => {
        light.intensity = areLightsOn ? (light.type === 'AmbientLight' ? 0.5 : 0.8) : 0.1
      })
    }
    
    // Переключение видимости меток
    const toggleDeviceLabels = () => {
      areLabelsVisible = !areLabelsVisible
      deviceLabels.forEach(label => {
        label.element.style.display = areLabelsVisible ? 'block' : 'none'
      })
    }
    
    // Закрытие панели информации об устройстве
    const closeDeviceInfo = () => {
      selectedDevice.value = null
    }
    
    // Включение/выключение устройства
    const toggleDevice = async (device) => {
      try {
        const newPower = device.power === 'on' ? 'off' : 'on'
        await deviceStore.updateDevice(device.id, { power: newPower })
        emit('device-updated', { ...device, power: newPower })
        
        // Обновляем 3D-представление устройства
        updateDeviceVisual(device.id, { power: newPower })
      } catch (error) {
        console.error('Ошибка при изменении состояния устройства:', error)
      }
    }
    
    // Изменение яркости
    const updateBrightness = async (event, device) => {
      try {
        const brightness = parseInt(event.target.value)
        await deviceStore.updateDevice(device.id, { brightness })
        emit('device-updated', { ...device, brightness })
        
        // Обновляем 3D-представление устройства
        updateDeviceVisual(device.id, { brightness })
      } catch (error) {
        console.error('Ошибка при изменении яркости:', error)
      }
    }
    
    // Обновление визуального представления устройства
    const updateDeviceVisual = (deviceId, properties) => {
      const deviceIndex = deviceObjects.findIndex(obj => obj.userData.deviceId === deviceId)
      
      if (deviceIndex !== -1) {
        const deviceObj = deviceObjects[deviceIndex]
        const device = props.devices.find(d => d.id === deviceId)
        
        if (!device) return
        
        // Обновление для различных типов устройств
        switch(device.type.toUpperCase()) {
          case 'LIGHT':
            updateLightVisual(deviceObj, device, properties)
            break
            
          case 'THERMOSTAT':
            updateThermostatVisual(deviceObj, device, properties)
            break
            
          case 'TV':
          case 'VACUUM':
          case 'LOCK':
          case 'CAMERA':
            updateBasicDeviceVisual(deviceObj, device, properties)
            break
            
          default:
            updateBasicDeviceVisual(deviceObj, device, properties)
        }
      }
    }
    
    // Обновление визуализации лампочки
    const updateLightVisual = (deviceObj, device, properties) => {
      // Найдем колбу (обычно это второй элемент в группе)
      let bulbMesh = null
      let pointLight = null
      let glowMesh = null
      
      // Ищем компоненты по типу материала
      deviceObj.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.material instanceof THREE.MeshPhysicalMaterial) {
            bulbMesh = object
          } else if (object.material instanceof THREE.MeshBasicMaterial && 
                    object.material.transparent && 
                    object.geometry instanceof THREE.SphereGeometry) {
            glowMesh = object
          }
        } else if (object instanceof THREE.PointLight) {
          pointLight = object
        }
      })
      
      if (!bulbMesh) return
      
      // Обработка изменения состояния включения/выключения
      if (properties.power !== undefined) {
        const isOn = properties.power === 'on'
        const colorValue = device.color ? parseInt('0x' + device.color) : 0xffcc00
        
        // Обновляем материал колбы
        bulbMesh.material.emissive = new THREE.Color(isOn ? colorValue : 0x000000)
        
        // Если лампа включается/выключается, нам нужно обновить всю структуру
        // Запрашиваем полное обновление объекта
        const x = deviceObj.position.x
        const y = deviceObj.position.y
        const z = deviceObj.position.z
        
        // Удаляем старый объект из сцены
        scene.remove(deviceObj)
        
        // Создаем новый объект с обновленными свойствами
        const updatedDevice = {...device, power: properties.power}
        const newLamp = createLightbulb(updatedDevice)
        newLamp.position.set(x, y, z)
        newLamp.userData = deviceObj.userData
        
        // Добавляем объект на сцену и обновляем ссылку
        scene.add(newLamp)
        deviceObjects[deviceIndex] = newLamp
        
        return
      }
      
      // Обновление яркости
      if (properties.brightness !== undefined && bulbMesh) {
        const brightness = properties.brightness / 100
        bulbMesh.material.emissiveIntensity = brightness
        
        // Обновляем интенсивность света, если лампа включена
        if (pointLight && device.power === 'on') {
          pointLight.intensity = brightness * 0.7
        }
        
        // Обновляем свечение
        if (glowMesh) {
          glowMesh.material.opacity = 0.15 * brightness
        }
      }
      
      // Обновление цвета
      if (properties.color !== undefined && bulbMesh) {
        const colorValue = parseInt('0x' + properties.color)
        bulbMesh.material.color.set(colorValue)
        
        if (device.power === 'on') {
          bulbMesh.material.emissive.set(colorValue)
          
          if (pointLight) {
            pointLight.color.set(colorValue)
          }
          
          if (glowMesh) {
            glowMesh.material.color.set(colorValue)
          }
        }
      }
    }
    
    // Обновление визуализации термостата
    const updateThermostatVisual = (deviceObj, device, properties) => {
      if (properties.temperature !== undefined) {
        // Найдем дисплей термостата
        let displayMesh = null
        
        deviceObj.traverse((object) => {
          if (object instanceof THREE.Mesh && 
              object.material instanceof THREE.MeshBasicMaterial &&
              object.geometry instanceof THREE.CircleGeometry) {
            displayMesh = object
          }
        })
        
        if (displayMesh) {
          // Создаем новую текстуру для отображения температуры
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.width = 128
          canvas.height = 128
          
          context.fillStyle = '#333333'
          context.fillRect(0, 0, 128, 128)
          
          context.font = 'bold 48px Arial'
          context.fillStyle = properties.temperature > 24 ? '#ff5722' : '#2196f3'
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          context.fillText(`${properties.temperature}°`, 64, 64)
          
          if (displayMesh.material.map) {
            displayMesh.material.map.dispose()
          }
          
          const texture = new THREE.CanvasTexture(canvas)
          displayMesh.material.map = texture
          displayMesh.material.needsUpdate = true
        }
      }
    }
    
    // Обновление визуализации для базовых устройств
    const updateBasicDeviceVisual = (deviceObj, device, properties) => {
      if (properties.power !== undefined) {
        // Найдем индикатор
        let indicatorMesh = null
        
        deviceObj.traverse((object) => {
          if (object instanceof THREE.Mesh && 
              object.material instanceof THREE.MeshBasicMaterial &&
              object.geometry instanceof THREE.CircleGeometry) {
            indicatorMesh = object
          }
        })
        
        if (indicatorMesh) {
          const isOn = properties.power === 'on'
          let indicatorColor = 0x555555
          
          // Определяем цвет индикатора в зависимости от категории и подтипа
          if (isOn) {
            if (device.category && device.subType) {
              // Используем категорию и подтип
              switch (device.category) {
                case 'APPLIANCES':
                  indicatorColor = 0x00ff00  // Зеленый для бытовой техники
                  break
                case 'SECURITY':
                  if (device.subType === 'CAMERA') {
                    indicatorColor = 0xff0000  // Красный для камер
                  } else {
                    indicatorColor = 0x00aaff  // Синий для других устройств безопасности
                  }
                  break
                case 'CLIMATE':
                  indicatorColor = 0x00ffaa  // Бирюзовый для устройств климат-контроля
                  break
                default:
                  indicatorColor = 0x00ff00  // Зеленый по умолчанию
              }
            } else {
              // Обратная совместимость по типу устройства
              switch(device.type.toUpperCase()) {
                case 'TV':
                  indicatorColor = 0x00ff00
                  break
                case 'CAMERA':
                  indicatorColor = 0xff0000
                  break
                case 'VACUUM':
                  indicatorColor = 0x00ff00
                  break
                default:
                  indicatorColor = 0x00ff00
              }
            }
          }
          
          indicatorMesh.material.color.set(indicatorColor)
          
          // Для телевизора нужно обновить экран
          const isTV = (device.category === 'APPLIANCES' && device.subType === 'TV') || 
                       (device.type && device.type.toUpperCase() === 'TV')
                       
          if (isTV) {
            // Полностью перестраиваем объект, так как нужно добавить/удалить экран
            const x = deviceObj.position.x
            const y = deviceObj.position.y
            const z = deviceObj.position.z
            const rotation = deviceObj.rotation.clone()
            
            scene.remove(deviceObj)
            
            const updatedDevice = {...device, power: properties.power}
            const newTV = createTV(updatedDevice)
            newTV.position.set(x, y, z)
            newTV.rotation.copy(rotation)
            newTV.userData = deviceObj.userData
            
            scene.add(newTV)
            deviceObjects[deviceIndex] = newTV
          }
        }
      }
      
      // Для других устройств могут быть добавлены специфические обновления
      // в зависимости от их свойств
    }
    
    // Анимация
    const animate = () => {
      requestAnimationFrame(animate)
      
      // Обновление положения меток
      deviceLabels.forEach((label, index) => {
        if (deviceObjects[index]) {
          label.update(deviceObjects[index].position)
        }
      })
      
      // Пульсация интенсивности свечения для визуального эффекта
      if (bloomPass && effectsEnabled) {
        bloomPass.strength = 0.8 + Math.sin(Date.now() * 0.001) * 0.2
      }
      
      // Обновление управления камерой
      controls.update()
      
      // Используем composer вместо стандартного рендеринга
      if (composer) {
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
    }
    
    // Обработка изменения размера окна
    const handleResize = () => {
      if (!canvasContainer.value || !camera || !renderer) return
      
      const width = canvasContainer.value.clientWidth
      const height = canvasContainer.value.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      
      renderer.setSize(width, height)
      
      // Обновление размера для composer
      if (composer) {
        composer.setSize(width, height)
      }
    }
    
    // Слушатель событий для выбора устройства
    const setupEventListeners = () => {
      renderer.domElement.addEventListener('click', onDeviceClick)
      window.addEventListener('resize', handleResize)
    }
    
    // Наблюдение за изменениями списка устройств
    watch(() => props.devices, () => {
      if (scene) {
        updateDevices()
      }
    }, { deep: true })
    
    // Инициализация при монтировании компонента
    onMounted(() => {
      initScene()
      setupEventListeners()
    })
    
    // Очистка ресурсов при размонтировании
    onUnmounted(() => {
      if (renderer) {
        renderer.domElement.removeEventListener('click', onDeviceClick)
        window.removeEventListener('resize', handleResize)
        
        renderer.dispose()
        
        // Удаляем метки устройств
        deviceLabels.forEach(label => {
          if (label.element && label.element.parentNode) {
            label.element.parentNode.removeChild(label.element)
          }
        })
        
        // Очищаем сцену
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
        
        scene = null
        camera = null
        renderer = null
        controls = null
      }
    })
    
    return {
      canvasContainer,
      isLoading,
      selectedDevice,
      showColorPicker,
      resetCamera,
      toggleWireframe,
      toggleLights,
      toggleDeviceLabels,
      toggleEffects,
      closeDeviceInfo,
      toggleDevice,
      updateBrightness
    }
  }
}
</script>

<style scoped>
.room-visualization {
  position: relative;
  width: 100%;
  height: 500px;
  background-color: #0f0f0f;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  margin: 0 auto;
  max-width: 900px;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 15, 15, 0.9);
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(45, 143, 213, 0.1);
  border-left-color: #2d8fd5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 16px;
  color: #2d8fd5;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(45, 143, 213, 0.8);
}

.controls-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 5;
}

.control-btn {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(45, 143, 213, 0.5);
  color: #2d8fd5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background-color: rgba(45, 143, 213, 0.2);
  border-color: rgba(45, 143, 213, 0.8);
  color: #fff;
  box-shadow: 0 0 15px rgba(45, 143, 213, 0.5);
}

.device-info-panel {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 300px;
  background-color: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(45, 143, 213, 0.7);
  border-radius: 10px;
  padding: 16px;
  color: #fff;
  max-width: 300px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(45, 143, 213, 0.3);
  backdrop-filter: blur(10px);
  z-index: 5;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #888;
  cursor: pointer;
}

.close-btn:hover {
  color: #333;
}

.panel-content {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.label {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.status-online {
  color: #4caf50;
}

.status-offline {
  color: #f44336;
}

.device-controls {
  margin-top: 16px;
}

.device-controls .switch {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.device-controls .label {
  margin-right: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.slider-container {
  margin-top: 8px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(45, 143, 213, 0.3);
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2d8fd5;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(45, 143, 213, 0.8);
}

.color-picker-button {
  background-color: rgba(45, 143, 213, 0.2);
  border: 1px solid rgba(45, 143, 213, 0.7);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.color-picker-button:hover {
  background-color: rgba(45, 143, 213, 0.4);
  box-shadow: 0 0 15px rgba(45, 143, 213, 0.5);
}

.color-picker-button i {
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 