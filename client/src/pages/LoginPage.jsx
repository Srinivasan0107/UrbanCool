import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasRealGoogleId = Boolean(googleClientId && googleClientId.includes('.apps.googleusercontent.com'));

  React.useEffect(() => {
    if (user) navigate(user.role === 'planner' ? '/dashboard' : '/citizen');
  }, [user, navigate]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/login', form);
      const { token, role, ward } = res.data.data;
      login(token, role, ward);
      navigate(role === 'planner' ? '/dashboard' : '/citizen');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/google', {
        credential: credentialResponse.credential,
        role: 'planner',
      });
      const { token, role, ward } = res.data.data;
      login(token, role, ward);
      navigate(role === 'planner' ? '/dashboard' : '/citizen');
    } catch (err) {
      setError(err.response?.data?.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateGoogleLogin = async (role = 'planner') => {
    setError(null);
    setLoading(true);
    try {
      // Base64 header and payload to form a mock Google ID token structure
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'google-oauth-' + Date.now(),
          email: `${role}.google@urbancool.dev`,
          name: role === 'planner' ? 'Google Urban Planner' : 'Google Citizen Resident',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&q=80',
          iss: 'https://accounts.google.com',
        })
      );
      const mockCredential = `${header}.${payload}.signature`;

      const res = await api.post('/api/v1/auth/google', {
        credential: mockCredential,
        role,
        ward: role === 'citizen' ? 'Ward-2' : undefined,
      });
      const { token, role: userRole, ward } = res.data.data;
      login(token, userRole, ward);
      setShowConfigModal(false);
      navigate(userRole === 'planner' ? '/dashboard' : '/citizen');
    } catch (err) {
      setError(err.response?.data?.error || 'Simulated Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
            UrbanCool
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Urban Heat Island Monitoring & Telemetry Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-low/80 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl p-space-xl shadow-2xl">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-6">
            Sign In to Telemetry Hub
          </h2>

          {error && (
            <div
              className="mb-4 p-space-sm rounded-xl bg-error-container/30 border border-error/40 text-error font-body-sm text-body-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Google Sign In Section */}
          <div className="mb-6">
            {hasRealGoogleId ? (
              <div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in was canceled or origin not authorized. Check origins in Google Console.')}
                    theme="filled_black"
                    shape="pill"
                    text="signin_with"
                  />
                </div>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="text-[11px] text-outline hover:text-primary transition-colors underline cursor-pointer"
                  >
                    OAuth options & troubleshooting
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-high/60 hover:bg-surface-container-highest transition-all flex items-center justify-center gap-3 font-medium text-body-sm text-on-surface shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                Sign in with Google
              </button>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-outline-variant/30" />
              <span className="flex-shrink mx-4 text-xs font-label-caps uppercase text-outline">
                Or password sign in
              </span>
              <div className="flex-grow border-t border-outline-variant/30" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1 font-semibold"
              >
                Operator / Citizen Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-space-md py-space-xs rounded-xl border border-outline-variant/40 text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
                placeholder="planner@urbancool.dev"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-1 font-semibold"
              >
                Security Key / Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-space-md py-space-xs rounded-xl border border-outline-variant/40 text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-headline-sm text-body-sm font-bold hover:bg-primary-container disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md mt-2"
            >
              {loading ? 'Authenticating…' : 'Access Telemetry Grid'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-outline-variant/20">
            <p className="font-label-caps text-label-caps uppercase text-outline mb-2 font-bold tracking-wider">
              Demo Operator Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm({ email: 'planner@urbancool.dev', password: 'planner123' })
                }
                className="px-space-sm py-2 rounded-lg border border-outline-variant/30 hover:border-primary hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-on-surface text-center"
              >
                🏙️ City Planner
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({ email: 'citizen@urbancool.dev', password: 'citizen123' })
                }
                className="px-space-sm py-2 rounded-lg border border-outline-variant/30 hover:border-secondary hover:bg-surface-container-high transition-colors font-body-sm text-body-sm text-on-surface text-center"
              >
                👤 Citizen User
              </button>
            </div>
          </div>

          {/* Link to Register */}
          <div className="mt-5 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Google Sign In Setup & Quick Test Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl border border-outline-variant/50 max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl">
                🔑
              </div>
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface">
                  Google OAuth Configuration
                </h3>
                <p className="text-xs text-on-surface-variant">
                  OAuth Client Secret is configured in backend
                </p>
              </div>
            </div>

            <div className="space-y-3 text-body-sm text-on-surface-variant mb-6">
              <p>
                <b>Google Client ID:</b> <code className="text-secondary font-mono text-[11px] block mt-1 break-all bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/30">{googleClientId || 'Configured in client/.env'}</code>
              </p>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs text-on-surface">
                <span className="font-bold text-primary">⚠️ Google Cloud Console Setup Note:</span>
                <p className="mt-1 leading-relaxed">
                  In Google Cloud Console under <b>APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs</b>, make sure to add:
                  <code className="text-primary font-mono block mt-1">http://localhost:5173</code>
                  under <b>Authorized JavaScript origins</b> so Google allows your browser to sign in.
                </p>
              </div>
              <p className="text-xs text-outline">
                You can also test the entire Google OAuth authentication flow against MongoDB Atlas right now:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSimulateGoogleLogin('planner')}
                className="py-2.5 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all"
              >
                ⚡ Sign in as Google Planner
              </button>
              <button
                type="button"
                onClick={() => handleSimulateGoogleLogin('citizen')}
                className="py-2.5 px-3 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface font-bold text-xs hover:border-primary transition-all"
              >
                👤 Sign in as Google Citizen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
