import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/eventos', icon: '📅', label: 'Eventos' },
    { path: '/clientes', icon: '👥', label: 'Clientes' },
    { path: '/pagamentos', icon: '💰', label: 'Pagamentos' },
    { path: '/galeria', icon: '📸', label: 'Galeria' },
    { path: '/configuracoes', icon: '⚙️', label: 'Configurações' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#2C3E50] text-white w-64 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#4A9B6E]">FOTIVA</h2>
              {/* Close button (mobile only) */}
              <button
                onClick={onClose}
                className="lg:hidden text-white hover:text-gray-300"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">Gestão Fotográfica</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#4A9B6E] text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
