import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ─── Root ───────────────────────────────────────────────────────────────────
const container = document.getElementById('root');

if (!container) {
  throw new Error(
    '[main.jsx] Elemento #root não encontrado no HTML. ' +
    'Verifique o index.html.'
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);