import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service Worker desabilitado para evitar conflitos
// import * as serviceWorkerRegistration from '@/serviceWorkerRegistration';
// serviceWorkerRegistration.register();

