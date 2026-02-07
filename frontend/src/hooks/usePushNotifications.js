import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const PUSH_SERVICE_URL = process.env.REACT_APP_PUSH_SERVICE_URL || 'http://localhost:8001';

// Converte base64 para Uint8Array (necessário para VAPID)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o navegador suporta Push Notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsSupported(false);
      setLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        setSubscription(sub);
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      setLoading(true);

      // Pedir permissão
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        alert('Você precisa permitir notificações para receber alertas de eventos!');
        setLoading(false);
        return false;
      }

      // Buscar chave pública VAPID
      const response = await fetch(`${PUSH_SERVICE_URL}/vapid-public-key`);
      const { publicKey } = await response.json();

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Criar subscription
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Salvar subscription no backend
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: sub.toJSON()
        })
      });

      setSubscription(sub);
      setIsSubscribed(true);
      setLoading(false);

      return true;
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      alert('Erro ao ativar notificações. Tente novamente.');
      setLoading(false);
      return false;
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setLoading(true);

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remover do backend
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/auth/push-subscription`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSubscription(null);
      setIsSubscribed(false);
      setLoading(false);

      return true;
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
      setLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribeToPush,
    unsubscribeFromPush
  };
};
