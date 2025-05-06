// Временное решение для ошибки "Cannot access 'db' before initialization"
window.db = {}; 

// Включаем демо-режим по умолчанию для Netlify
if (window.location.hostname.includes('netlify.app')) {
  localStorage.setItem('smart_home_demo_mode', 'true');
  localStorage.setItem('smart_home_server_url', 'https://demo-api.example.com');
} 