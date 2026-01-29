import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, CreditCard, Image, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/eventos', icon: Calendar, label: 'Eventos' },
    { path: '/pagamentos', icon: CreditCard, label: 'Pagamentos' },
    { path: '/galeria', icon: Image, label: 'Galeria' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#2C3E50] border-b border-[#34495E] z-50 flex items-center justify-between px-4">
        <img 
          src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
          alt="FOTIVA"
          className="h-8 w-auto"
        />
        <button
          onClick={() => setIsOpen(true)}
          data-testid="mobile-menu-button"
          className="text-white p-2 hover:bg-[#34495E] rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={closeSidebar}
          data-testid="mobile-sidebar-overlay"
        />
      )}

      {/* Sidebar Drawer */}
      <div 
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#2C3E50] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="mobile-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-[#34495E] flex items-center justify-between">
            <img 
              src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
              alt="FOTIVA"
              className="h-10 w-auto"
            />
            <button
              onClick={closeSidebar}
              className="text-white p-2 hover:bg-[#34495E] rounded-lg transition-colors"
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  data-testid={`mobile-sidebar-link-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#4A9B6E] text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-[#34495E]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[#34495E]">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-10 h-10 rounded-full bg-[#4A9B6E] flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.brand_name || 'Fotógrafo'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                closeSidebar();
              }}
              data-testid="mobile-logout-button"
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-[#34495E] rounded-lg transition-colors w-full"
            >
              <LogOut size={18} />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;