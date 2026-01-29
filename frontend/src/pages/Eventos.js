import React, { useEffect, useState } from 'react';
import ResponsiveDashboardLayout from '@/components/ResponsiveDashboardLayout';
import axios from 'axios';
import { Plus, Calendar, MapPin, Clock, Phone, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Eventos = () => {
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    name: '',
    date: '',
    time: '',
    location: '',
    total_value: '',
    status: 'confirmado'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/events`),
        axios.get(`${API_URL}/clients`)
      ]);
      setEvents(eventsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      const eventData = {
        ...formData,
        client_name: selectedClient?.name || formData.client_name,
        total_value: parseFloat(formData.total_value)
      };
      await axios.post(`${API_URL}/events`, eventData);
      toast.success('Evento criado com sucesso!');
      setShowDialog(false);
      setFormData({
        client_id: '',
        client_name: '',
        name: '',
        date: '',
        time: '',
        location: '',
        total_value: '',
        status: 'confirmado'
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar evento');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmado: 'bg-[#E8F5E9] text-[#4A9B6E]',
      pendente: 'bg-[#FFF8E1] text-[#F4C542]',
      concluido: 'bg-blue-50 text-blue-600'
    };
    return colors[status] || colors.confirmado;
  };

  if (loading) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4A9B6E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando eventos...</p>
          </div>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
              Eventos
            </h1>
            <p className="mt-1 text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Gerencie seus eventos e compromissos
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <button 
                data-testid="create-event-button"
                className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} />
                Novo Evento
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Cliente</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Nome do Evento</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="Casamento Maria & João"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Data</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-2">Horário</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Local</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="Igreja São Pedro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({...formData, total_value: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="5000.00"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="submit-event-button"
                  className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all"
                >
                  Criar Evento
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => (
              <div 
                key={event.id}
                data-testid={`event-card-${event.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[#111827] mb-1">{event.name}</h3>
                    <p className="text-sm text-[#6B7280]">{event.client_name}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                    <Calendar size={16} className="flex-shrink-0" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                    <Clock size={16} className="flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Valor Total</p>
                    <p className="text-lg font-semibold text-[#111827]">
                      R$ {event.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280] mb-1">Pago</p>
                    <p className="text-sm font-medium text-[#4A9B6E]">
                      R$ {event.paid_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280] mb-1">Restante</p>
                    <p className="text-sm font-medium text-[#F4C542]">
                      R$ {(event.total_value - event.paid_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#111827] mb-2">Nenhum evento cadastrado</h3>
            <p className="text-[#6B7280] mb-6">Comece criando seu primeiro evento</p>
            <button 
              onClick={() => setShowDialog(true)}
              className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeiro Evento
            </button>
          </div>
        )}
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default Eventos;