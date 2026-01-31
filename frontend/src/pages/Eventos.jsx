import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, MapPin, DollarSign, Edit2, Trash2, User } from 'lucide-react';

const Eventos = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar eventos');
      }

      const data = await response.json();
      setEventos(data);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir evento');
      }

      // Atualizar lista após exclusão
      fetchEventos();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      alert('Erro ao excluir evento');
    }
  };

  const filteredEventos = eventos.filter(evento => {
    const searchLower = searchTerm.toLowerCase();
    return (
      evento.event_type?.toLowerCase().includes(searchLower) ||
      evento.client_name?.toLowerCase().includes(searchLower) ||
      evento.location?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calcularPorcentagemPaga = (totalValue, amountPaid) => {
    if (!totalValue || totalValue === 0) return 0;
    return Math.round((amountPaid / totalValue) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
        <p className="text-gray-600 mt-2">Gerencie seus eventos e compromissos</p>
      </div>

      {/* Ações */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Botão Novo Evento */}
        <button
          onClick={() => navigate('/eventos/novo')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Novo Evento
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-600 text-sm">Total de Eventos</p>
          <p className="text-2xl font-bold text-gray-900">{eventos.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-600 text-sm">Valor Total</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(eventos.reduce((sum, e) => sum + (e.total_value || 0), 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-600 text-sm">Total Recebido</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(eventos.reduce((sum, e) => sum + (e.amount_paid || 0), 0))}
          </p>
        </div>
      </div>

      {/* Lista de Eventos */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {filteredEventos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Tente buscar com outros termos' 
              : 'Comece criando seu primeiro evento'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/eventos/novo')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeiro Evento
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEventos.map((evento) => {
            const porcentagemPaga = calcularPorcentagemPaga(evento.total_value, evento.amount_paid);
            const valorRestante = (evento.total_value || 0) - (evento.amount_paid || 0);

            return (
              <div key={evento.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Informações do Evento */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {evento.event_type}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <User size={16} />
                          <span>{evento.client_name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/eventos/editar/${evento.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(evento.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">{formatDate(evento.event_date)}</span>
                      </div>
                      {evento.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <span className="text-sm">{evento.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Informações Financeiras */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">Valor Total</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(evento.total_value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Já Pago</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(evento.amount_paid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Restante</p>
                          <p className="font-semibold text-orange-600">
                            {formatCurrency(valorRestante)}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progresso do pagamento</span>
                          <span className="font-medium">{porcentagemPaga}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${porcentagemPaga}%` }}
                          />
                        </div>
                      </div>

                      {/* Informação de Parcelas */}
                      {evento.remaining_installments > 1 && valorRestante > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          <span>Restante em {evento.remaining_installments}x de </span>
                          <span className="font-medium">
                            {formatCurrency(valorRestante / evento.remaining_installments)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Observações */}
                    {evento.notes && (
                      <div className="mt-3 text-sm text-gray-600 italic">
                        "{evento.notes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Eventos;
