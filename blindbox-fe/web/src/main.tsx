import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add default font preloading
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://rsms.me/inter/inter.css';
document.head.appendChild(link);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);