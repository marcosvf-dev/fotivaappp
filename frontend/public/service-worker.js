// Service Worker para Push Notifications
// Arquivo: public/service-worker.js

self.addEventListener('push', function(event) {
  console.log('Push recebido:', event);

  let notificationData = {
    title: 'Lembrete de Evento 📸',
    body: 'Você tem um evento próximo!',
    icon: '/logo192.png',
    badge: '/badge.png',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      console.error('Erro ao parsear dados da notificação:', e);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo192.png',
    badge: notificationData.badge || '/badge.png',
    vibrate: [200, 100, 200],
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ver Evento'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Se já tem uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Senão, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Ativar o service worker imediatamente
self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado');
  event.waitUntil(self.clients.claim());
});
