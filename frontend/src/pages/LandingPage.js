import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users, DollarSign, Image, BarChart3, Bell } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Agenda Inteligente',
      description: 'Organize seus eventos, compromissos e ensaios fotográficos em um só lugar com lembretes automáticos.'
    },
    {
      icon: Users,
      title: 'Cadastro de Clientes',
      description: 'Gerencie informações completas de cada cliente, histórico de eventos e preferências.'
    },
    {
      icon: DollarSign,
      title: 'Controle Financeiro',
      description: 'Acompanhe pagamentos, parcelas, valores pendentes e gere relatórios financeiros completos.'
    },
    {
      icon: Bell,
      title: 'Alertas Automáticos',
      description: 'Receba notificações de vencimentos de parcelas e próximos eventos agendados.'
    },
    {
      icon: Image,
      title: 'Galeria para Clientes',
      description: 'Envie fotos para seus clientes escolherem favoritas e criarem álbuns personalizados.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analítico',
      description: 'Visualize seu faturamento mensal, eventos confirmados e métricas do seu negócio.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F8F9FA]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img 
            src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
            alt="FOTIVA"
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              data-testid="header-login-link"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link 
              to="/cadastro"
              data-testid="header-register-button"
              className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-2.5 font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-semibold text-[#111827] leading-tight" style={{ fontFamily: 'Work Sans, sans-serif' }}>
              Seu estúdio fotográfico na palma da mão
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Gerencie eventos, controle pagamentos parcelados, envie galerias e tenha total visão financeira do seu negócio. Tudo em uma plataforma profissional.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link 
                to="/cadastro"
                data-testid="hero-cta-button"
                className="bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-8 py-4 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-2 text-base"
              >
                Começar grátis por 30 dias
                <ArrowRight size={20} />
              </Link>
              <a 
                href="#recursos"
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-8 py-4 font-medium transition-all inline-flex items-center justify-center text-base"
              >
                Conhecer recursos
              </a>
            </div>
            <p className="mt-4 text-sm text-[#9CA3AF]">
              ✨ 30 dias grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1761426952799-108385c4753d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoZXIlMjB3b3JraW5nJTIwY2FtZXJhfGVufDB8fHx8MTc2OTcyNTczNXww&ixlib=rb-4.1.0&q=85"
              alt="Fotógrafo profissional trabalhando"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="max-w-7xl mx-auto px-6 py-20 bg-white rounded-3xl my-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight font-medium text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Recursos que transformam seu negócio
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#6B7280] max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Tudo que você precisa para gerenciar seu estúdio fotográfico de forma profissional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl border border-gray-100 p-8 hover:border-[#4A9B6E]/20 transition-colors group"
              >
                <div className="w-12 h-12 bg-[#E8F5E9] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#4A9B6E] transition-colors">
                  <Icon size={24} className="text-[#4A9B6E] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-medium text-[#111827] mb-2" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-[#6B7280] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight font-medium text-[#111827]" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            Preço simples e transparente
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#6B7280]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Um único plano com todos os recursos. Sem complicação.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border-2 border-[#4A9B6E] p-8 shadow-lg">
            <div className="text-center">
              <h3 className="text-2xl font-medium text-[#111827] mb-2" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                Plano Profissional
              </h3>
              <div className="flex items-baseline justify-center gap-2 my-6">
                <span className="text-5xl font-semibold text-[#111827]">R$ 19,90</span>
                <span className="text-[#6B7280]">/mês</span>
              </div>
              <p className="text-[#4A9B6E] font-medium mb-6">✅ Primeiro mês grátis</p>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Eventos ilimitados',
                'Clientes ilimitados',
                'Controle completo de pagamentos',
                'Galerias para clientes',
                'Dashboard analítico',
                'Alertas automáticos',
                'Suporte prioritário'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-[#6B7280]">
                  <div className="w-5 h-5 bg-[#E8F5E9] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-[#4A9B6E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Link 
              to="/cadastro"
              data-testid="pricing-cta-button"
              className="w-full bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-6 py-4 font-medium transition-all shadow-sm hover:shadow-md active:scale-95 inline-flex items-center justify-center gap-2"
            >
              Começar agora
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
              alt="FOTIVA"
              className="h-8 w-auto"
            />
            <p className="text-sm text-[#6B7280]">
              © 2025 FOTIVA. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">Sobre</a>
              <a href="#" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">Contato</a>
              <a href="#" className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;