import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, updatePassword } from '../lib/auth';
import logo from '../assets/branding/cycle-green-logo.png';

export default function ResetPassword() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then((user) => setAuthed(Boolean(user)))
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await updatePassword(password);
      setSuccess('Password updated. Redirecting…');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err?.message ?? 'Failed to update password. Please try again.');
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-label="Reset password">
        <div className="auth-card">
          <img className="auth-panel-logo" src={logo} alt="CycleGreen" />

          {loading ? (
            <p className="auth-message">Checking your reset link…</p>
          ) : authed ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-title">
                <h2>Choose a new password</h2>
                <p>Set a new password for your Cycle Green account.</p>
              </div>

              <label htmlFor="reset-password">New password</label>
              <input
                id="reset-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <label htmlFor="reset-confirm">Confirm new password</label>
              <input
                id="reset-confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
              />

              {error && <p className="auth-message auth-error" role="alert">{error}</p>}
              {success && <p className="auth-message auth-success">{success}</p>}

              <button className="auth-submit" type="submit">Update password</button>
            </form>
          ) : (
            <div className="auth-title">
              <h2>Link invalid or expired</h2>
              <p>This password reset link is invalid or has expired. Request a new one from the login screen.</p>
              <Link className="auth-submit reset-login-link" to="/">Go to log in</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
