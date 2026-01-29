import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    brand_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success('Conta criada com sucesso! Bem-vindo ao FOTIVA!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
            alt="FOTIVA"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-semibold text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Comece grátis agora
          </h1>
          <p className="mt-2 text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
            30 dias grátis, sem cartão de crédito
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#111827] mb-2">
                Nome completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                data-testid="register-name-input"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="João Silva"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111827] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                data-testid="register-email-input"
                value={formData.email}
                onChange={handleChange}
                required
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#111827] mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  data-testid="register-password-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all pr-11"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="brand_name" className="block text-sm font-medium text-[#111827] mb-2">
                Nome do estúdio <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="brand_name"
                name="brand_name"
                data-testid="register-brand-input"
                value={formData.brand_name}
                onChange={handleChange}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A9B6E] focus-visible:ring-offset-2 transition-all"
                placeholder="Fotografia Silva"
              />
            </div>

            <button
              type="submit"
              data-testid="register-submit-button"
              disabled={loading}
              className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-3 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[#4A9B6E] hover:text-[#3D8B5E] font-medium transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;