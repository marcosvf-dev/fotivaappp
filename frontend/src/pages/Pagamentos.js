import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { Plus, Check, Clock, AlertCircle, Edit2, Trash2, Link as LinkIcon, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Pagamentos = () => {
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    event_id: '',
    installments: 1,
    down_payment: 0,
    first_due_date: ''
  });
  const [editFormData, setEditFormData] = useState({
    amount: 0,
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, eventsRes] = await Promise.all([
        axios.get(`${API_URL}/payments`),
        axios.get(`${API_URL}/events`)
      ]);
      setPayments(paymentsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedEvent = events.find(e => e.id === formData.event_id);
      if (!selectedEvent) return;

      const downPayment = parseFloat(formData.down_payment);
      const remaining = selectedEvent.total_value - downPayment;
      const installmentAmount = remaining / parseInt(formData.installments);

      // Create installments
      const promises = [];
      for (let i = 1; i <= parseInt(formData.installments); i++) {
        const dueDate = new Date(formData.first_due_date);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        promises.push(
          axios.post(`${API_URL}/payments`, {
            event_id: selectedEvent.id,
            client_id: selectedEvent.client_id,
            client_name: selectedEvent.client_name,
            event_name: selectedEvent.name,
            installment_number: i,
            total_installments: parseInt(formData.installments),
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0]
          })
        );
      }

      await Promise.all(promises);
      toast.success(`${formData.installments} parcelas criadas com sucesso!`);
      setShowDialog(false);
      setFormData({
        event_id: '',
        installments: 1,
        down_payment: 0,
        first_due_date: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar parcelas');
    }
  };

  const markAsPaid = async (paymentId) => {
    try {
      await axios.patch(`${API_URL}/payments/${paymentId}/mark-paid`);
      toast.success('Pagamento marcado como pago!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao marcar pagamento');
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setEditFormData({
      amount: payment.amount,
      due_date: payment.due_date
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/payments/${editingPayment.id}`, editFormData);
      toast.success('Pagamento atualizado com sucesso!');
      setShowEditDialog(false);
      setEditingPayment(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const handleDelete = async (paymentId, clientName, installmentNumber) => {
    if (window.confirm(`Tem certeza que deseja deletar a parcela ${installmentNumber} de ${clientName}?`)) {
      try {
        await axios.delete(`${API_URL}/payments/${paymentId}`);
        toast.success('Pagamento deletado com sucesso!');
        fetchData();
      } catch (error) {
        toast.error('Erro ao deletar pagamento');
      }
    }
  };

  const generatePaymentLink = async (paymentId) => {
    try {
      const response = await axios.post(`${API_URL}/payments/${paymentId}/generate-link`);
      const link = response.data.payment_link;
      
      // Copiar para área de transferência
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado para área de transferência!');
      
      fetchData(); // Atualizar para mostrar o link salvo
    } catch (error) {
      toast.error('Erro ao gerar link de pagamento');
    }
  };

  const copyPaymentLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const totalReceived = payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => !p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => !p.paid && new Date(p.due_date) < new Date()).reduce((sum, p) => sum + p.amount, 0);

  const groupedPayments = payments.reduce((acc, payment) => {
    const key = payment.client_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(payment);
    return acc;
  }, {});

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4A9B6E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando pagamentos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
              Pagamentos
            </h1>
            <p className="mt-1 text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Controle de parcelas e recebimentos
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <button 
                data-testid="create-payment-button"
                className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} />
                Nova Cobrança
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Parcelas de Pagamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Evento</label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  >
                    <option value="">Selecione um evento</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - R$ {event.total_value.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.down_payment}
                    onChange={(e) => setFormData({...formData, down_payment: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Número de Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.installments}
                    onChange={(e) => setFormData({...formData, installments: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Data do Primeiro Vencimento</label>
                  <input
                    type="date"
                    value={formData.first_due_date}
                    onChange={(e) => setFormData({...formData, first_due_date: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="submit-payment-button"
                  className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all"
                >
                  Criar Parcelas
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
            </DialogHeader>
            {editingPayment && (
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">Data de Vencimento</label>
                  <input
                    type="date"
                    value={editFormData.due_date}
                    onChange={(e) => setEditFormData({...editFormData, due_date: e.target.value})}
                    required
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all"
                >
                  Salvar Alterações
                </button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <Check size={20} className="text-[#4A9B6E]" />
              </div>
              <p className="text-sm text-[#6B7280]">Total Recebido</p>
            </div>
            <p className="text-2xl font-semibold text-[#111827]">
              R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#FFF8E1] rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-[#F4C542]" />
              </div>
              <p className="text-sm text-[#6B7280]">A Receber</p>
            </div>
            <p className="text-2xl font-semibold text-[#111827]">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <p className="text-sm text-[#6B7280]">Atrasados</p>
            </div>
            <p className="text-2xl font-semibold text-[#111827]">
              R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Payments List */}
        {Object.keys(groupedPayments).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedPayments).map(([clientName, clientPayments]) => (
              <div key={clientName} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-medium text-[#111827] mb-4">{clientName}</h3>
                <div className="text-sm text-[#6B7280] mb-2">
                  {clientPayments[0].event_name}
                </div>
                <div className="text-base font-medium text-[#4A9B6E] mb-4">
                  Valor Total: R$ {(clientPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>

                <div className="space-y-3">
                  {clientPayments.sort((a, b) => a.installment_number - b.installment_number).map((payment) => {
                    const isOverdue = !payment.paid && new Date(payment.due_date) < new Date();
                    return (
                      <div 
                        key={payment.id}
                        data-testid={`payment-item-${payment.id}`}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-[#4A9B6E]/20 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            payment.paid ? 'bg-[#E8F5E9]' : isOverdue ? 'bg-red-50' : 'bg-[#FFF8E1]'
                          }`}>
                            {payment.paid ? (
                              <Check size={20} className="text-[#4A9B6E]" />
                            ) : isOverdue ? (
                              <AlertCircle size={20} className="text-red-600" />
                            ) : (
                              <Clock size={20} className="text-[#F4C542]" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#111827]">
                              Parcela {payment.installment_number} de {payment.total_installments}
                            </p>
                            <p className="text-xs text-[#6B7280] mt-1">
                              Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')} 
                              {payment.paid && payment.paid_date && ` • Pago em ${new Date(payment.paid_date).toLocaleDateString('pt-BR')}`}
                            </p>
                            {payment.payment_link && (
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => copyPaymentLink(payment.payment_link)}
                                  className="flex items-center gap-1 text-xs text-[#4A9B6E] hover:text-[#3D8B5E]"
                                >
                                  <Copy size={12} />
                                  Copiar link
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <p className="text-base font-semibold text-[#111827]">
                            R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center gap-2">
                            {!payment.paid && (
                              <>
                                <button
                                  onClick={() => generatePaymentLink(payment.id)}
                                  data-testid={`generate-link-button-${payment.id}`}
                                  className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1"
                                  title="Gerar link de pagamento"
                                >
                                  <LinkIcon size={16} />
                                  Link
                                </button>
                                <button
                                  onClick={() => handleEdit(payment)}
                                  data-testid={`edit-button-${payment.id}`}
                                  className="bg-amber-500 text-white hover:bg-amber-600 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                                  title="Editar pagamento"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(payment.id, payment.client_name, payment.installment_number)}
                                  data-testid={`delete-button-${payment.id}`}
                                  className="bg-red-500 text-white hover:bg-red-600 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                                  title="Deletar pagamento"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={() => markAsPaid(payment.id)}
                                  data-testid={`mark-paid-button-${payment.id}`}
                                  className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-4 py-2 text-sm font-medium transition-all"
                                >
                                  Marcar como Pago
                                </button>
                              </>
                            )}
                            {payment.paid && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#4A9B6E]">
                                Pago
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#111827] mb-2">Nenhum pagamento cadastrado</h3>
            <p className="text-[#6B7280] mb-6">Comece criando parcelas para seus eventos</p>
            <button 
              onClick={() => setShowDialog(true)}
              className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeira Cobrança
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Pagamentos;
