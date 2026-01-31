import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Clientes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clienteId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/clients/${clienteId}`);
      toast.success('Cliente excluído com sucesso!');
      fetchClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.phone && cliente.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#4A9B6E] border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Carregando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes cadastrados</p>
          </div>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="mt-4 md:mt-0 bg-[#4A9B6E] text-white px-6 py-3 rounded-lg hover:bg-[#3d8259] transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Novo Cliente
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar cliente por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A9B6E] focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{clientes.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#4A9B6E] bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Com Email</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {clientes.filter(c => c.email).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Com Telefone</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {clientes.filter(c => c.phone).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clientes List */}
        {filteredClientes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Comece adicionando seu primeiro cliente!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/clientes/novo')}
                className="bg-[#4A9B6E] text-white px-6 py-3 rounded-lg hover:bg-[#3d8259] transition-colors"
              >
                Adicionar Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Telefone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Cadastro</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#4A9B6E] rounded-full flex items-center justify-center text-white font-semibold">
                            {cliente.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{cliente.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cliente.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {cliente.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
