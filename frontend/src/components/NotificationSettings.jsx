import React from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const NotificationSettings = () => {
  const { 
    isSupported, 
    isSubscribed, 
    loading, 
    subscribeToPush, 
    unsubscribeFromPush 
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      const success = await unsubscribeFromPush();
      if (success) {
        alert('Notificações desativadas com sucesso!');
      }
    } else {
      const success = await subscribeToPush();
      if (success) {
        alert('Notificações ativadas! Você receberá alertas 48h, 24h e 12h antes dos seus eventos.');
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ Seu navegador não suporta notificações push. 
          Use Chrome, Firefox ou Edge para receber notificações.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {isSubscribed ? (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="text-green-600" size={24} />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <BellOff className="text-gray-400" size={24} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Notificações de Eventos
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Receba lembretes automáticos no celular e WhatsApp em 48h, 24h e 12h antes dos seus eventos.
          </p>

          {isSubscribed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm font-medium">
                ✅ Notificações ativadas!
              </p>
              <p className="text-green-700 text-xs mt-1">
                Você receberá alertas antes de cada evento confirmado.
              </p>
            </div>
          )}

          <button
            onClick={handleToggleNotifications}
            disabled={loading}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
              ${isSubscribed 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-green-600 text-white hover:bg-green-700'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processando...
              </>
            ) : isSubscribed ? (
              <>
                <BellOff size={18} />
                Desativar Notificações
              </>
            ) : (
              <>
                <Bell size={18} />
                Ativar Notificações
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Como funciona:
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>48 horas antes:</strong> Lembrete inicial com detalhes do evento</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>24 horas antes:</strong> Confirmação e checklist de preparação</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span><strong>12 horas antes:</strong> Lembrete final com local e horário</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings;
