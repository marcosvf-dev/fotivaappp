import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 10 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-prompt" data-testid="pwa-install-prompt">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-[#4A9B6E] rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#111827] mb-1">
            Instalar FOTIVA
          </h3>
          <p className="text-xs text-[#6B7280] mb-3">
            Instale o app na sua tela inicial para acesso rápido e funcionalidade offline
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              data-testid="pwa-install-button"
              className="flex-1 bg-[#4A9B6E] text-white hover:bg-[#3D8B5E] rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              data-testid="pwa-dismiss-button"
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
