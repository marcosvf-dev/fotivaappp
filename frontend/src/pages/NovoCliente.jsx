import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NovoCliente = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório!');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/clients`, formData);
      toast.success('Cliente cadastrado com sucesso!');
      navigate('/clientes');
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/clientes')}
            className="text-[#4A9B6E] hover:text-[#3d8259] mb-4 flex items-center gap-2"
          >
            <span>←</span> Voltar para Clientes
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-600 mt-1">Preencha os dados do cliente</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Nome */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ex: Maria Silva Santos"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent"
            />
          </div>

          {/* Telefone */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 98765-4321"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Opcional</p>
          </div>

          {/* Email */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="cliente@exemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Opcional</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#4A9B6E] text-white px-6 py-3 rounded-lg hover:bg-[#3d8259] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cadastrando...
                </span>
              ) : (
                'Cadastrar Cliente'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Dica</h3>
              <p className="text-sm text-blue-800">
                Apenas o nome é obrigatório. Você pode adicionar telefone e email depois, se necessário.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NovoCliente;
