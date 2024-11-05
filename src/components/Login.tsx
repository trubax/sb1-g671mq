import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, AlertCircle, LogIn, UserCircle2, Code } from 'lucide-react';

export default function Login() {
  const { login, loginAnonymously, currentUser, bypassAuth, isDevelopment } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [nickname, setNickname] = useState('');

  if (currentUser) {
    return <Navigate to="/chat" />;
  }

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      await login();
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        setIsRedirecting(true);
        setError('Il popup è stato bloccato. Reindirizzamento in corso...');
      } else if (error?.code === 'auth/unauthorized-domain') {
        setError('Questo dominio non è autorizzato per l\'accesso. Contatta l\'amministratore.');
      } else {
        setError('Si è verificato un errore durante l\'accesso. Riprova più tardi.');
        console.error('Errore di login:', error);
      }
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  const handleAnonymousLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Inserisci un nickname valido');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await loginAnonymously(nickname.trim());
    } catch (error: any) {
      setError(error.message || 'Si è verificato un errore durante l\'accesso temporaneo.');
      console.error('Errore durante l\'accesso temporaneo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevBypass = () => {
    try {
      bypassAuth();
    } catch (error) {
      console.error('Errore bypass dev:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-white">Benvenuto su CriptX</h2>
          <p className="mt-2 text-sm text-gray-400">Messaggistica sicura per tutti</p>
        </div>

        {error && (
          <div className={`bg-${isRedirecting ? 'blue' : 'red'}-900/50 border border-${isRedirecting ? 'blue' : 'red'}-500 rounded-lg p-4 flex items-start space-x-2`}>
            <AlertCircle className={`w-5 h-5 text-${isRedirecting ? 'blue' : 'red'}-500 flex-shrink-0 mt-0.5`} />
            <span className={`text-sm text-${isRedirecting ? 'blue' : 'red'}-200`}>{error}</span>
          </div>
        )}

        {showNicknameInput ? (
          <form onSubmit={handleAnonymousLogin} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
                Scegli un nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Il tuo nickname"
                minLength={3}
                maxLength={20}
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Il nickname deve essere tra 3 e 20 caratteri
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi come ospite'}
              </button>
              <button
                type="button"
                onClick={() => setShowNicknameInput(false)}
                className="px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Indietro
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading || isRedirecting}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <LogIn className="w-5 h-5" />
              {isRedirecting ? 'Reindirizzamento...' : isLoading ? 'Accesso in corso...' : 'Accedi con Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">oppure</span>
              </div>
            </div>

            <button
              onClick={() => setShowNicknameInput(true)}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <UserCircle2 className="w-5 h-5" />
              Accedi come ospite
            </button>

            {isDevelopment && (
              <button
                onClick={handleDevBypass}
                className="w-full flex items-center justify-center px-4 py-3 border border-orange-600/30 text-sm font-medium rounded-md text-orange-400 hover:bg-orange-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 gap-2"
              >
                <Code className="w-5 h-5" />
                Modalità Sviluppo
              </button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-center text-gray-500">
            Accedendo, accetti i nostri Termini di Servizio e la Privacy Policy
          </p>
          {showNicknameInput && (
            <p className="text-xs text-center text-gray-500">
              L'account ospite scade dopo 24 ore o al logout
            </p>
          )}
          <p className="text-xs text-center text-gray-500">
            Le tue conversazioni sono crittografate end-to-end
          </p>
        </div>
      </div>
    </div>
  );
}