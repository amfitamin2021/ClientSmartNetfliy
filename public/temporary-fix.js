// Более полная заглушка для объекта db со всеми возможными методами
window.db = {
  // Базовые методы для работы с базой данных
  open: () => Promise.resolve(),
  close: () => Promise.resolve(),
  transaction: () => ({
    objectStore: () => ({
      get: () => Promise.resolve({}),
      getAll: () => Promise.resolve([]),
      put: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      index: () => ({
        get: () => Promise.resolve({}),
        getAll: () => Promise.resolve([])
      })
    }),
    commit: () => Promise.resolve(),
    abort: () => Promise.resolve()
  }),
  objectStoreNames: {
    contains: () => true
  },
  createObjectStore: () => ({
    createIndex: () => ({})
  })
};

// Включаем демо-режим по умолчанию для Netlify
if (window.location.hostname.includes('netlify.app')) {
  localStorage.setItem('smart_home_demo_mode', 'true');
  localStorage.setItem('smart_home_server_url', 'https://demo-api.example.com');
} 