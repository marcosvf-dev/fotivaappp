import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Loader2 } from 'lucide-react';

const NovoCliente = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validação: apenas nome é obrigatório
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

      // Criar objeto apenas com campos preenchidos
      const clientData = {
        name: formData.name.trim()
      };

      // Adicionar email apenas se preenchido
      if (formData.email.trim()) {
        clientData.email = formData.email.trim();
      }

      // Adicionar telefone apenas se preenchido
      if (formData.phone.trim()) {
        clientData.phone = formData.phone.trim();
      }

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao criar cliente');
      }

      // Sucesso! Navegar para lista de clientes
      navigate('/clientes');
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      setError(err.message || 'Erro ao criar cliente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/clientes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Novo Cliente</h1>
          <p className="text-gray-600 mt-2">Cadastre um novo cliente</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome (Obrigatório) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome completo do cliente"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Telefone (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={20} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/clientes')}
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
                    Criando...
                  </>
                ) : (
                  'Criar Cliente'
                )}
              </button>
            </div>
          </form>

          {/* Nota */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Nota:</span> Apenas o nome é obrigatório. 
              Email e telefone são opcionais e podem ser adicionados depois.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoCliente;
