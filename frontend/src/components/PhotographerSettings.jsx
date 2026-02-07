import React, { useState, useEffect } from 'react';
import { Phone, Bell, Save, CheckCircle } from 'lucide-react';
import usePushNotifications from '../hooks/usePushNotifications';

const PhotographerSettings = () => {
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    loading: notifLoading
  } = usePushNotifications();

  useEffect(() => {
    fetchUserPhone();
  }, []);

  const fetchUserPhone = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.phone) {
        setPhone(data.phone);
      }
    } catch (error) {
      console.error('Erro ao buscar telefone:', error);
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erro ao salvar telefone:', error);
      alert('Erro ao salvar telefone');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata: (XX) XXXXX-XXXX
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    return value;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

      {/* Telefone para WhatsApp */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Meu Telefone</h2>
            <p className="text-sm text-gray-600">
              Para receber notificações via WhatsApp
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePhone}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={15}
            />
            <p className="text-xs text-gray-500 mt-2">
              💬 Você receberá lembretes de eventos neste número
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Salvar Telefone'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Push Notifications */}
      {isSupported && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Notificações Push
              </h2>
              <p className="text-sm text-gray-600">
                Receba alertas direto no navegador
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              📱 Notificações no celular/computador<br />
              ⏰ Alertas de eventos em 48h, 24h e 12h<br />
              🔔 Funciona mesmo com o app fechado
            </p>
          </div>

          {isSubscribed ? (
            <button
              onClick={unsubscribe}
              disabled={notifLoading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {notifLoading ? 'Desativando...' : 'Desativar Notificações'}
            </button>
          ) : (
            <button
              onClick={subscribe}
              disabled={notifLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {notifLoading ? 'Ativando...' : 'Ativar Notificações'}
            </button>
          )}
        </div>
      )}

      {/* Informações */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Como funcionam as notificações:</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
          <li>• <strong>WhatsApp:</strong> Você receberá mensagens automáticas no número cadastrado</li>
          <li>• <strong>Push:</strong> Notificações aparecem no navegador/celular</li>
          <li>• <strong>Quando:</strong> 48h, 24h e 12h antes de cada evento</li>
          <li>• <strong>Conteúdo:</strong> Nome do cliente, local, horário e valores</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotographerSettings;
