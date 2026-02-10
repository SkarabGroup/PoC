import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Inserisci username e password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      toast.success('Login effettuato!');
      onLogin();
    } catch (error: any) {
      setError(error.message || 'Credenziali errate');
      toast.error('Login fallito');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white border border-[#e5e5e5] rounded-xl mb-4 shadow-sm">
            <Shield className="w-8 h-8 text-[#2e3338]" />
          </div>
          <h1 className="text-[#2e3338] mb-2">Code Guardian</h1>
          <p className="text-[#73787e]">Accedi alla tua dashboard</p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-[#2e3338] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] focus:ring-offset-0 transition-all"
                placeholder="Inserisci username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#2e3338] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#2e3338] focus:ring-offset-0 transition-all"
                placeholder="Inserisci password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
            <p className="text-center text-[#73787e]">
              Non hai un account?{' '}
              <button
                onClick={() => window.location.hash = 'register'}
                className="text-[#2e3338] font-medium hover:underline"
              >
                Registrati
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
