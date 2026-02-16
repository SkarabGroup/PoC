import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Listen for hash changes to handle register link
  useEffect(() => {
    const handleHashChange = () => {
      setShowRegister(window.location.hash === '#register');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-[#73787e]">Caricamento...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegisterSuccess={() => {
            window.location.hash = '';
            setShowRegister(false);
          }}
          onBackToLogin={() => {
            window.location.hash = '';
            setShowRegister(false);
          }}
        />
      );
    }
    return <LoginPage onLogin={() => {}} />;
  }

  return <Dashboard />;
}
