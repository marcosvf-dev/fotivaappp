import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, MapPin, DollarSign, Edit2, Trash2, User } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

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
      toast.error('Erro ao carregar eventos');
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

      toast.success('Evento excluído com sucesso!');
      fetchEventos();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      toast.error('Erro ao excluir evento');
    }
  };

  const filteredEventos = eventos.filter(evento => {
    const searchLower = searchTerm.toLowerCase();
    return (
      evento.name?.toLowerCase().includes(searchLower) ||
      evento.client_name?.toLowerCase().includes(searchLower) ||
      evento.location?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não definida';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calcularPorcentagemPaga = (totalValue, paidAmount) => {
    if (!totalValue || totalValue === 0) return 0;
    return Math.round(((paidAmount || 0) / totalValue) * 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4A9B6E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando eventos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
            <p className="text-gray-600 mt-1">Gerencie seus eventos e compromissos</p>
          </div>
          <button
            onClick={() => navigate('/eventos/novo')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A9B6E] text-white rounded-lg hover:bg-[#3d8259] transition-colors"
          >
            <Plus size={20} />
            <span>Novo Evento</span>
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent"
          />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total de Eventos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{eventos.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-2xl font-bold text-[#4A9B6E] mt-1">
              {formatCurrency(eventos.reduce((sum, e) => sum + (e.total_value || 0), 0))}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Recebido</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(eventos.reduce((sum, e) => sum + (e.paid_amount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Lista de Eventos */}
        {filteredEventos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Comece criando seu primeiro evento'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/eventos/novo')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4A9B6E] text-white rounded-lg hover:bg-[#3d8259] transition-colors"
              >
                <Plus size={20} />
                <span>Criar Primeiro Evento</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEventos.map((evento) => {
              const porcentagemPaga = calcularPorcentagemPaga(evento.total_value, evento.paid_amount);
              const valorRestante = (evento.total_value || 0) - (evento.paid_amount || 0);

              return (
                <div key={evento.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-4">
                    {/* Header do Evento */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {evento.name}
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

                    {/* Informações */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">{formatDate(evento.date)} às {evento.time}</span>
                      </div>
                      {evento.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <span className="text-sm">{evento.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Informações Financeiras */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-gray-600 mb-1">Valor Total</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(evento.total_value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Já Pago</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(evento.paid_amount)}
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
                      <div>
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
                      <div className="text-sm text-gray-600 italic border-l-4 border-gray-300 pl-3">
                        "{evento.notes}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Eventos;
