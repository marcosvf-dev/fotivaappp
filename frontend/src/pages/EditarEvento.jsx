import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, DollarSign, User, Loader2, Clock, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const EditarEvento = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    client_id: '',
    event_type: '',
    event_date: '',
    event_time: '',
    location: '',
    total_value: '',
    amount_paid: '0',
    remaining_installments: '1',
    notes: ''
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Buscar dados do evento e clientes ao carregar
  useEffect(() => {
    fetchEventoEClientes();
  }, [id]);

  const fetchEventoEClientes = async () => {
    try {
      const token = localStorage.getItem('token');

      // Buscar clientes
      const clientesResponse = await fetch(`${API_URL}/api/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!clientesResponse.ok) throw new Error('Erro ao buscar clientes');
      const clientesData = await clientesResponse.json();
      setClientes(clientesData);

      // Buscar evento específico
      const eventoResponse = await fetch(`${API_URL}/api/events/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!eventoResponse.ok) throw new Error('Evento não encontrado');
      const eventoData = await eventoResponse.json();

      // Separar data e hora
      const eventDateTime = new Date(eventoData.event_date);
      const date = eventDateTime.toISOString().split('T')[0];
      const time = eventDateTime.toTimeString().slice(0, 5);

      setFormData({
        client_id: eventoData.client_id || '',
        event_type: eventoData.event_type || '',
        event_date: date,
        event_time: time,
        location: eventoData.location || '',
        total_value: eventoData.total_value || '',
        amount_paid: eventoData.amount_paid || '0',
        remaining_installments: eventoData.remaining_installments || '1',
        notes: eventoData.notes || ''
      });

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar evento');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.client_id) {
      setError('Selecione um cliente');
      return;
    }
    if (!formData.event_type) {
      setError('Tipo de evento é obrigatório');
      return;
    }
    if (!formData.event_date) {
      setError('Data do evento é obrigatória');
      return;
    }
    if (!formData.total_value) {
      setError('Valor total é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Combinar data e hora
      let dateTimeStr = formData.event_date;
      if (formData.event_time) {
        dateTimeStr += `T${formData.event_time}:00`;
      } else {
        dateTimeStr += 'T12:00:00';
      }

      // Preparar dados do evento
      const eventData = {
        client_id: formData.client_id,
        event_type: formData.event_type,
        event_date: dateTimeStr,
        location: formData.location || '',
        total_value: parseFloat(formData.total_value),
        amount_paid: parseFloat(formData.amount_paid || 0),
        remaining_installments: parseInt(formData.remaining_installments || 1),
        notes: formData.notes || ''
      };

      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao atualizar evento');
      }

      // Sucesso! Navegar para lista de eventos
      navigate('/eventos');
    } catch (err) {
      console.error('Erro ao atualizar evento:', err);
      setError(err.message || 'Erro ao atualizar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    setLoading(true);

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

      // Sucesso! Navegar para lista de eventos
      navigate('/eventos');
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      setError('Erro ao excluir evento. Tente novamente.');
      setLoading(false);
    }
  };

  const calcularValorRestante = () => {
    const total = parseFloat(formData.total_value || 0);
    const pago = parseFloat(formData.amount_paid || 0);
    return total - pago;
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={48} className="animate-spin text-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/eventos')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Evento</h1>
              <p className="text-gray-600 mt-2">Atualize as informações do evento</p>
            </div>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 size={20} />
              Excluir Evento
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipo de Evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                placeholder="Ex: Casamento, Aniversário, Formatura"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="time"
                    name="event_time"
                    value={formData.event_time}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Local do evento"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">💰 Valores e Pagamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor Total */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="total_value"
                      value={formData.total_value}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Valor Já Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Já Pago
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={20} className="text-green-400" />
                    </div>
                    <input
                      type="number"
                      name="amount_paid"
                      value={formData.amount_paid}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Parcelas Restantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restante será pago em quantas vezes?
                </label>
                <select
                  name="remaining_installments"
                  value={formData.remaining_installments}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="1">À vista (1x)</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                  <option value="6">6x</option>
                  <option value="12">12x</option>
                </select>
              </div>

              {/* Resumo Financeiro */}
              {formData.total_value && (
                <div className="p-3 bg-white rounded border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="font-medium">R$ {parseFloat(formData.total_value || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Já Pago:</span>
                      <span className="font-medium">R$ {parseFloat(formData.amount_paid || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600 pt-2 border-t">
                      <span className="font-medium">Restante:</span>
                      <span className="font-bold">R$ {calcularValorRestante().toFixed(2)}</span>
                    </div>
                    {formData.remaining_installments > 1 && calcularValorRestante() > 0 && (
                      <div className="flex justify-between text-blue-600 text-xs">
                        <span>Valor por parcela:</span>
                        <span>R$ {(calcularValorRestante() / parseInt(formData.remaining_installments)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Observações sobre o evento..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/eventos')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditarEvento;
