import { useToast } from 'vue-toastification'

/**
 * Композабл для работы с нотификациями
 * @returns {Object} Методы для работы с нотификациями
 */
export function useNotify() {
  const toast = useToast()
  
  const success = (message) => {
    toast.success(message, {
      timeout: 3000,
      position: 'top-right',
      closeOnClick: true,
      pauseOnHover: true
    })
  }
  
  const error = (message) => {
    toast.error(message, {
      timeout: 5000,
      position: 'top-right',
      closeOnClick: true,
      pauseOnHover: true
    })
  }
  
  const warning = (message) => {
    toast.warning(message, {
      timeout: 4000,
      position: 'top-right',
      closeOnClick: true,
      pauseOnHover: true
    })
  }
  
  const info = (message) => {
    toast.info(message, {
      timeout: 3000,
      position: 'top-right',
      closeOnClick: true,
      pauseOnHover: true
    })
  }
  
  return {
    success,
    error,
    warning,
    info
  }
} 