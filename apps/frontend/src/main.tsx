import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <Toaster richColors position="top-right" />
    <App />
  </AuthProvider>
);
