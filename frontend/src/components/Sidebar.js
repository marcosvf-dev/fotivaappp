import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, CreditCard, Image, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/eventos', icon: Calendar, label: 'Eventos' },
    { path: '/pagamentos', icon: CreditCard, label: 'Pagamentos' },
    { path: '/galeria', icon: Image, label: 'Galeria' },
    { path: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="w-64 bg-[#2C3E50] text-white h-screen fixed left-0 top-0 flex flex-col border-r border-[#34495E]" data-testid="sidebar">
      <div className="p-6 border-b border-[#34495E]">
        <img 
          src="https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg"
          alt="FOTIVA"
          className="h-10 w-auto"
        />
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`sidebar-link-${item.label.toLowerCase()}`}
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
          onClick={logout}
          data-testid="logout-button"
          className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-[#34495E] rounded-lg transition-colors w-full"
        >
          <LogOut size={18} />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;