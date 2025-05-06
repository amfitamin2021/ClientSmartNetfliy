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

// Включаем демо-режим по умолчанию только для Netlify
if (window.location.hostname.includes('netlify.app')) {
  localStorage.setItem('smart_home_demo_mode', 'true');
  localStorage.setItem('smart_home_server_url', 'https://demo-api.example.com');
}

// Механизм аварийного переключения на запасную страницу
window.addEventListener('DOMContentLoaded', function() {
  // Установка таймера для проверки загрузки приложения
  setTimeout(function() {
    const appElement = document.getElementById('app');
    
    // Если элемент #app пуст (приложение не загрузилось)
    if (appElement && appElement.children.length === 0) {
      console.log("Приложение не загрузилось. Переключение на запасную страницу...");
      
      // Пробуем загрузить запасную страницу
      fetch('/index.fallback.html')
        .then(response => response.text())
        .then(html => {
          document.body.innerHTML = html;
        })
        .catch(error => {
          console.error('Не удалось загрузить запасную страницу:', error);
          
          // Простой запасной вариант, если запасная страница не загрузилась
          document.body.innerHTML = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; background: #f5f5f5; border-radius: 5px;">
              <h1>Умный дом - Проблема загрузки</h1>
              <p>Приложение не смогло загрузиться корректно. Попробуйте следующие действия:</p>
              <ul>
                <li>Включите демо-режим: <button onclick="localStorage.setItem('smart_home_demo_mode', 'true'); window.location.reload();">Включить демо-режим</button></li>
                <li>Перезагрузите страницу: <button onclick="window.location.reload();">Перезагрузить</button></li>
              </ul>
            </div>
          `;
        });
    }
  }, 5000); // Ждем 5 секунд перед проверкой
});

// Добавляем визуальный отладчик на страницу только в режиме Netlify или при наличии параметра debug
if (window.location.hostname.includes('netlify.app') || window.location.search.includes('debug')) {
  window.addEventListener('DOMContentLoaded', function() {
    // Создаем элемент для отображения ошибок
    const debugContainer = document.createElement('div');
    debugContainer.style.position = 'fixed';
    debugContainer.style.top = '10px';
    debugContainer.style.left = '10px';
    debugContainer.style.right = '10px';
    debugContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugContainer.style.color = 'white';
    debugContainer.style.padding = '20px';
    debugContainer.style.zIndex = '9999';
    debugContainer.style.fontFamily = 'monospace';
    debugContainer.style.fontSize = '14px';
    debugContainer.style.maxHeight = '80%';
    debugContainer.style.overflow = 'auto';
    
    // Заголовок
    const heading = document.createElement('h2');
    heading.textContent = 'Отладочная информация';
    debugContainer.appendChild(heading);
    
    // Информация о среде
    const envInfo = document.createElement('div');
    envInfo.innerHTML = `
      <p>URL: ${window.location.href}</p>
      <p>Демо-режим: ${localStorage.getItem('smart_home_demo_mode')}</p>
      <p>Адрес сервера: ${localStorage.getItem('smart_home_server_url')}</p>
      <p>User Agent: ${navigator.userAgent}</p>
    `;
    debugContainer.appendChild(envInfo);
    
    // Контейнер для ошибок
    const errorsContainer = document.createElement('div');
    errorsContainer.innerHTML = '<h3>Ошибки:</h3>';
    debugContainer.appendChild(errorsContainer);
    
    // Добавляем на страницу
    document.body.appendChild(debugContainer);
    
    // Перехватываем все ошибки
    window.addEventListener('error', function(event) {
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.style.marginBottom = '10px';
      errorDiv.innerHTML = `
        <p><strong>Ошибка:</strong> ${event.message}</p>
        <p><strong>Источник:</strong> ${event.filename}, строка ${event.lineno}, колонка ${event.colno}</p>
      `;
      errorsContainer.appendChild(errorDiv);
      
      return false; // Позволяем ошибке также отобразиться в консоли
    });
    
    // Проверяем, загрузился ли Vue
    setTimeout(() => {
      const appElement = document.getElementById('app');
      const appInfo = document.createElement('div');
      appInfo.innerHTML = `<p>Состояние #app: ${appElement.children.length > 0 ? 'Есть содержимое' : 'Пусто'}</p>`;
      envInfo.appendChild(appInfo);
    }, 3000);
  });
} 