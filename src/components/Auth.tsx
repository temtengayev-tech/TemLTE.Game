import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  initialMode?: 'signin' | 'signup';
  onBack: () => void;
  onSuccess: () => void;
};

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

export function Auth({ initialMode = 'signin', onBack, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleGoogleSignIn() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    if (mode === 'signup' && !strongPassword.test(password)) {
      setMessage('Use 10+ characters with uppercase, lowercase, and a number.');
      setBusy(false);
      return;
    }
    try {
      const fn =
        mode === 'signup'
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await fn;
      if (error) setMessage(error.message);
      else if (mode === 'signup') setMessage('Fighter unlocked! Check your email to confirm your account. 🥊');
      else if (data.session) onSuccess();
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <button className="auth-back" onClick={onBack}>← BACK TO GAME</button>
      <div className="auth-card">
      <div className="auth-fighters" aria-hidden="true"><span>🥷</span><b>VS</b><span>🥊</span></div>
      <span className="auth-kicker">{mode === 'signin' ? 'RETURNING CHAMPION' : 'NEW CHALLENGER'}</span>
      <h1>{mode === 'signin' ? 'Welcome back!' : 'Enter Fightron'}</h1>
      <p>{mode === 'signin' ? 'Your next battle is waiting.' : 'Create your fighter account and step into the arena.'}</p>
      <button className="google-button" type="button" disabled={busy} onClick={handleGoogleSignIn}>
        <span aria-hidden="true">G</span> CONTINUE WITH GOOGLE
      </button>
      <div className="auth-divider"><span>OR USE EMAIL</span></div>
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="email">📨 YOUR EMAIL</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">🔐 SECRET MOVE</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder={mode === 'signup' ? '10+ characters, Aa and 0–9' : 'Your password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === 'signup' ? 10 : 6}
          required
        />
        {mode === 'signup' && <small className="password-hint">10+ characters · uppercase · lowercase · number</small>}
        <button type="submit" disabled={busy}>
          {busy ? 'GETTING READY…' : mode === 'signin' ? 'ENTER THE ARENA →' : 'CREATE MY FIGHTER →'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
      <button
        className="ghost"
        onClick={() => {
          setMessage('');
          setMode(mode === 'signin' ? 'signup' : 'signin');
        }}
      >
        {mode === 'signin' ? 'No account? Create one' : 'Already have an account? Sign in'}
      </button>
      </div>
    </section>
  );
}
