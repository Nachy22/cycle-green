import { useState } from 'react';
import { signUp, signIn, resetPassword } from '../lib/auth';
import logo from '../assets/branding/cycle-green-logo.png';
import plantingHero from '../assets/branding/planting-hero.jpg';

function friendlyAuthError(err) {
  const msg = err?.message ?? '';
  if (/not confirmed/i.test(msg)) {
    return 'Email not confirmed yet. Check your inbox (and spam) for the confirmation link. If none arrived, Supabase free-tier email is rate-limited (~4/hour) — wait about an hour and retry, or disable "Confirm email" in Supabase Auth settings for demos.';
  }
  if (/rate limit|over email sending|too many requests/i.test(msg)) {
    return 'Supabase email rate limit reached (free tier sends ~4 emails/hour). Wait about an hour, or disable email confirmation in the Supabase dashboard.';
  }
  if (/invalid login|invalid credentials/i.test(msg)) {
    return 'Incorrect email or password.';
  }
  return msg;
}

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('community_member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSignUp = mode === 'signup';
  const isReset = mode === 'reset';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess('If that email has an account, a reset link is on its way. Check your inbox (and spam), then follow the link to set a new password.');
        return;
      }

      const data = isSignUp
        ? await signUp(email, password, role)
        : await signIn(email, password);

      if (isSignUp) {
        if (data.session) {
          onAuthSuccess?.(data.session.user);
          return;
        }
        if (data.user && (data.user.identities?.length ?? 1) === 0) {
          setError('An account with this email already exists. Try logging in instead.');
          return;
        }
        setSuccess('Registration sent. Check your email to confirm, then log in.');
        return;
      }

      onAuthSuccess?.(data.user);
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-hero" style={{ backgroundImage: `url(${plantingHero})` }}>
        <div className="auth-hero-overlay" />
        <div className="auth-brand">
          <img src={logo} alt="CycleGreen" />
          <span>Cycle Green</span>
        </div>

        <div className="auth-hero-copy">
          <p className="auth-eyebrow">Zambia climate accountability platform</p>
          <h1>Breaking the poverty <em>deforestation cycle,</em> one community at a time.</h1>
          <p>Linking verified tree-planting evidence to transparent, auditable community payouts — building trust through every seedling.</p>
        </div>
      </section>

      <section className="auth-panel" aria-label="Account access">
        <div className="auth-card">
          <img className="auth-panel-logo" src={logo} alt="CycleGreen" />
          <div className="auth-tabs" role="tablist" aria-label="Account option">
            <button className={!isSignUp ? '' : 'is-active'} type="button" onClick={() => switchMode('signup')} role="tab" aria-selected={isSignUp}>Create account</button>
            <button className={isSignUp ? '' : 'is-active'} type="button" onClick={() => switchMode('login')} role="tab" aria-selected={!isSignUp}>Log in</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-title">
              {isReset ? (
                <>
                  <h2>Reset your password</h2>
                  <p>Enter the email linked to your account and we&apos;ll send a reset link.</p>
                </>
              ) : (
                <>
                  <h2>{isSignUp ? 'Join the platform' : 'Welcome back'}</h2>
                  <p>{isSignUp ? 'Register to submit planting records or manage reviews.' : 'Sign in to your Cycle Green account.'}</p>
                </>
              )}
            </div>

            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" type="email" placeholder="you@example.zm" value={email} onChange={(event) => setEmail(event.target.value)} required />

            {!isReset && <>
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </>}

            {!isSignUp && !isReset && (
              <button className="forgot-link" type="button" onClick={() => switchMode('reset')}>Forgot password?</button>
            )}

            {isSignUp && <>
              <label htmlFor="auth-role">Role</label>
              <select id="auth-role" value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="community_member">Community Member</option>
                <option value="admin">Admin</option>
              </select>
            </>}

            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
            {success && <p className="auth-message auth-success">{success}</p>}

            <button className="auth-submit" type="submit">
              {isReset ? 'Send reset link' : isSignUp ? 'Create account' : 'Log in'}
            </button>
            {isReset && <p className="auth-terms"><button className="forgot-link" type="button" onClick={() => switchMode('login')}>← Back to log in</button></p>}
            {!isReset && <p className="auth-terms">By continuing you agree to Cycle Green&apos;s <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
