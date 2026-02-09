import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usersApi } from '../services/api';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({ email: '', username: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getProfile();
        setProfile({
          email: data.email,
          username: data.username,
        });
      } catch (error) {
        toast.error('Errore caricamento profilo');
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await usersApi.updateProfile({ email: profile.email });
      toast.success('Profilo aggiornato!');
    } catch (error: any) {
      toast.error(error.message || 'Errore aggiornamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Compila tutti i campi');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La password deve essere di almeno 6 caratteri');
      return;
    }

    try {
      await usersApi.updatePassword(currentPassword, newPassword);
      toast.success('Password aggiornata!');
      setShowPasswordFields(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Errore cambio password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINA') {
      toast.error('Digita "ELIMINA" per confermare');
      return;
    }

    try {
      await usersApi.deleteAccount();
      toast.success('Account eliminato');
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
      logout();
    } catch (error: any) {
      toast.error(error.message || 'Errore eliminazione account');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-[#2e3338] mb-2">Impostazioni</h1>
        <p className="text-[#73787e]">
          Gestisci le tue preferenze e la configurazione dell'account
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white border border-[#e5e5e5] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#f0f9ff] rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-[#2e3338]">Profilo Utente</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2e3338] mb-1">Username</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-3 py-2 bg-[#f5f5f5] border border-[#e5e5e5] rounded-md text-[#73787e] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2e3338] mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-[#2e3338] text-white rounded-lg hover:bg-[#1a1d20] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>

          {/* Password Section */}
          <div className="pt-6 border-t border-[#e5e5e5] mt-6">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="text-blue-600 hover:underline text-sm font-medium mb-4"
            >
              {showPasswordFields ? 'Nascondi campi password' : 'Cambia password'}
            </button>

            {showPasswordFields && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2e3338] mb-1">Password corrente</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
                    placeholder="Inserisci la password corrente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2e3338] mb-1">Nuova password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
                    placeholder="Minimo 6 caratteri"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2e3338] mb-1">Conferma nuova password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#2e3338] focus:outline-none focus:ring-2 focus:ring-[#2e3338]"
                    placeholder="Conferma la nuova password"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Aggiorna password
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="pt-6 border-t border-[#e5e5e5] mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-900 font-medium mb-2">Zona Pericolosa</h3>
              <p className="text-red-700 text-sm mb-4">
                Eliminare il tuo account cancellerà permanentemente tutti i tuoi dati, repository e analisi. Questa azione non può essere annullata.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Elimina account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-semibold text-[#2e3338]">
              Sei assolutamente sicuro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#73787e] leading-relaxed">
              Questa azione non può essere annullata. Eliminerà permanentemente il tuo account
              e rimuoverà tutti i tuoi dati dai nostri server, inclusi repository e analisi.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <label className="block text-sm font-medium text-[#2e3338]">
              Digita <span className="font-bold text-red-600">ELIMINA</span> per confermare:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-lg text-[#2e3338] placeholder:text-[#a8adb3] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              placeholder="Digita ELIMINA"
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmText('')}
              className="px-4 py-2 border border-[#e5e5e5] rounded-lg text-[#2e3338] bg-white hover:bg-[#f5f5f5] transition-colors font-medium"
            >
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              Elimina definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
