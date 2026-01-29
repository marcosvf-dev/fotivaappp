import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from '@/serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA functionality (only in production)
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log('FOTIVA PWA instalado com sucesso! Agora você pode usar o app offline.');
    },
    onUpdate: () => {
      console.log('Nova versão disponível! Recarregue para atualizar.');
    }
  });
} else {
  console.log('Service Worker desabilitado em desenvolvimento');
}
