import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './Modal';
import { AlertCircle, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  label?: string;
  onSuccess?: (isNewUser?: boolean) => void;
  onError?: (msg: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Retrieve client ID from Vite env or local storage
  const [clientId, setClientId] = useState<string>(() => {
    return (
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
      localStorage.getItem('vitos_google_client_id') ||
      ''
    );
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isGsiButtonRendered, setIsGsiButtonRendered] = useState(false);

  // Poll or detect when window.google.accounts is ready
  useEffect(() => {
    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
      }
    };
    checkGsi();
    const interval = setInterval(checkGsi, 300);
    return () => clearInterval(interval);
  }, []);

  // Handle the real credential response from Google Identity Services
  const handleCredentialResponse = async (response: any) => {
    setErrorText('');
    setIsLoading(true);

    try {
      if (!response || !response.credential) {
        throw new Error('No Google credential returned from account chooser.');
      }

      // Decode the real JWT ID token payload from Google
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const email = (payload.email || '').toLowerCase().trim();
      const hostedDomain = payload.hd || '';

      // Strict verification: Must be @vitstudent.ac.in
      if (!email.endsWith('@vitstudent.ac.in') && hostedDomain !== 'vitstudent.ac.in') {
        const err = `Access Denied: "${email}" is not an official @vitstudent.ac.in Google account. Please choose your university student Google account.`;
        setErrorText(err);
        if (onError) onError(err);
        setIsLoading(false);
        return;
      }

      // Authenticate with backend
      const result = await loginWithGoogle({
        email,
        name: payload.name,
        picture: payload.picture,
        credential: response.credential,
      });

      if (result.success) {
        if (onSuccess) onSuccess(result.isNewUser);
      } else {
        const err = 'Failed to create or authenticate student account with Google.';
        setErrorText(err);
        if (onError) onError(err);
      }
    } catch (err: any) {
      const msg = err.message || 'Google Sign-In failed.';
      setErrorText(msg);
      if (onError) onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize official Google Identity Services & render the official button
  useEffect(() => {
    if (!isGsiLoaded || !clientId || !googleBtnContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        hosted_domain: 'vitstudent.ac.in',
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear previous renders
      googleBtnContainerRef.current.innerHTML = '';

      // Render official Google button
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 380,
      });
      setIsGsiButtonRendered(true);
    } catch (e) {
      console.warn('Error initializing Google Identity Services:', e);
      setIsGsiButtonRendered(false);
    }
  }, [isGsiLoaded, clientId]);

  // Direct click handler: opens Google OAuth Account Chooser popup
  const handleDirectGoogleClick = () => {
    setErrorText('');

    if (!clientId) {
      // Prompt user to provide their Google Client ID
      setTempClientId('');
      setIsConfigModalOpen(true);
      return;
    }

    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          hosted_domain: 'vitstudent.ac.in',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setIsLoading(true);
              try {
                // Fetch real userinfo from Google
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                const email = (profile.email || '').toLowerCase().trim();

                if (!email.endsWith('@vitstudent.ac.in')) {
                  const err = `Access Denied: "${email}" is not an official @vitstudent.ac.in Google account. Only university student accounts can sign in.`;
                  setErrorText(err);
                  if (onError) onError(err);
                  setIsLoading(false);
                  return;
                }

                const result = await loginWithGoogle({
                  email,
                  name: profile.name,
                  picture: profile.picture,
                });

                if (result.success && onSuccess) {
                  onSuccess(result.isNewUser);
                }
              } catch (fetchErr: any) {
                setErrorText(fetchErr.message || 'Failed to fetch Google profile info.');
              } finally {
                setIsLoading(false);
              }
            } else if (tokenResponse?.error) {
              setErrorText(`Google error: ${tokenResponse.error}`);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err: any) {
        console.warn('OAuth2 client init error, falling back to prompt:', err);
      }
    }

    // Fallback: trigger GIS prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempClientId.trim();
    if (!clean) {
      setErrorText('Please enter a valid Google OAuth Client ID.');
      return;
    }
    localStorage.setItem('vitos_google_client_id', clean);
    setClientId(clean);
    setIsConfigModalOpen(false);
    setErrorText('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {errorText && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorText}</span>
        </div>
      )}

      {/* Official Google Button Container */}
      <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
        {/* If official GIS rendered button is available */}
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center [&>div]:w-full ${!clientId || !isGsiButtonRendered ? 'hidden' : ''}`}
        />

        {/* Fallback button: rendered ONLY when official GIS button is not yet rendered or no client ID */}
        {(!clientId || !isGsiButtonRendered) && (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleDirectGoogleClick}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 font-medium text-sm rounded-xl border border-stone-300 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-stone-700">
              {isLoading ? 'Connecting to Google...' : 'Sign in with Google'}
            </span>
          </button>
        )}

        {/* Config button ONLY if client ID is missing */}
        {!clientId && (
          <div className="w-full flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setTempClientId(clientId);
                setIsConfigModalOpen(true);
              }}
              className="text-[10px] text-stone-400 hover:text-stone-600 underline"
            >
              Setup Google Client ID
            </button>
          </div>
        )}
      </div>

      {/* Google OAuth Client ID Setup Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Google Sign-In Configuration"
      >
        <div className="space-y-4 text-xs text-stone-600">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <ShieldCheck className="w-4 h-4 text-[#9D0208] shrink-0" />
            <span>
              Google Identity Services requires an authorized <strong>OAuth Client ID</strong> from Google Cloud to pop up the official account chooser (<code>accounts.google.com/v3/signin/accountchooser</code>).
            </span>
          </div>

          <form onSubmit={handleSaveClientId} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Google OAuth Client ID
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="e.g. 596123456789-abcdef.apps.googleusercontent.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                You can also configure this permanently in <code>frontend/.env</code> as <code>VITE_GOOGLE_CLIENT_ID</code>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#9D0208] hover:bg-[#6A040F] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Activate Google Sign-In</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
