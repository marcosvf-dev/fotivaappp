import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveDashboardLayout from '@/components/ResponsiveDashboardLayout';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NovoCliente = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/clients`, formData);
      toast.success('Cliente criado com sucesso!');
      navigate('/eventos');
    } catch (error) {
      toast.error('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDashboardLayout>
      <div className="max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-6" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Novo Cliente
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="name"
                data-testid="client-name-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="Maria Silva"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#111827] mb-2">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                data-testid="client-phone-input"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="(11) 98765-4321"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                data-testid="client-email-input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="maria@email.com"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-3 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="submit-client-button"
                disabled={loading}
                className="flex-1 bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default NovoCliente;
