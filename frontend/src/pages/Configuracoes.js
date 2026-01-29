import React, { useState } from 'react';
import ResponsiveDashboardLayout from '@/components/ResponsiveResponsiveDashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

const Configuracoes = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    brand_name: user?.brand_name || '',
    profile_photo: user?.profile_photo || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement update user profile API
    toast.success('Perfil atualizado com sucesso!');
  };

  return (
    <ResponsiveDashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-semibold text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Configurações
          </h1>
          <p className="mt-1 text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Gerencie suas informações pessoais
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="mb-8">
            <h2 className="text-xl font-medium text-[#111827] mb-6" style={{ fontFamily: 'Work Sans, sans-serif' }}>
              Foto de Perfil
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#4A9B6E] flex items-center justify-center text-white text-3xl font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2">
                  <Camera size={16} />
                  Alterar Foto
                </button>
                <p className="text-xs text-[#9CA3AF] mt-2">JPG, PNG ou GIF. Máximo 2MB.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                data-testid="settings-name-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                data-testid="settings-email-input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <div>
              <label htmlFor="brand_name" className="block text-sm font-medium text-[#111827] mb-2">
                Nome do Estúdio
              </label>
              <input
                type="text"
                id="brand_name"
                data-testid="settings-brand-input"
                value={formData.brand_name}
                onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                data-testid="settings-save-button"
                className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-8 py-3 font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-medium text-[#111827] mb-2" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Assinatura
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">Gerencie sua assinatura do FOTIVA</p>
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#111827]">Plano Profissional</p>
              <p className="text-xs text-[#6B7280] mt-1">R$ 19,90/mês</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#4A9B6E]">
              Ativo
            </span>
          </div>
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default Configuracoes;