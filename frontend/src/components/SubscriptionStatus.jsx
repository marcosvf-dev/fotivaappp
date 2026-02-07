import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard } from 'lucide-react';

const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!subscription) return null;

  const { is_active, days_remaining, requires_payment } = subscription;
  const status = subscription.subscription?.status;

  // Trial ativo
  if (status === 'trial' && is_active) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-blue-900 font-semibold mb-1">
              Período de Teste Gratuito
            </h3>
            <p className="text-blue-700 text-sm">
              {days_remaining > 0 
                ? `Você tem ${days_remaining} ${days_remaining === 1 ? 'dia' : 'dias'} restantes de teste grátis!`
                : 'Seu período de teste terminou hoje.'
              }
            </p>
            {days_remaining <= 7 && days_remaining > 0 && (
              <button 
                onClick={() => window.location.href = '/subscription/upgrade'}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Assinar Agora - R$ 19,90/mês
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Trial expirado
  if (requires_payment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-red-900 font-semibold mb-1">
              Período de Teste Encerrado
            </h3>
            <p className="text-red-700 text-sm mb-3">
              Assine agora para continuar usando o Fotiva e gerenciando seus eventos!
            </p>
            <button 
              onClick={() => window.location.href = '/subscription/upgrade'}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Assinar - R$ 19,90/mês
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assinatura ativa
  if (status === 'active' && is_active) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-green-900 font-semibold mb-1">
              Assinatura Ativa
            </h3>
            <p className="text-green-700 text-sm">
              Sua assinatura está ativa e renovará automaticamente.
            </p>
            {days_remaining && days_remaining <= 7 && (
              <p className="text-green-600 text-xs mt-1">
                Próxima cobrança em {days_remaining} {days_remaining === 1 ? 'dia' : 'dias'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assinatura cancelada
  if (status === 'cancelled') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h3 className="text-yellow-900 font-semibold mb-1">
              Assinatura Cancelada
            </h3>
            <p className="text-yellow-700 text-sm mb-3">
              Você ainda tem acesso até o fim do período pago.
            </p>
            <button 
              onClick={() => window.location.href = '/subscription/upgrade'}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700"
            >
              Reativar Assinatura
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionStatus;
