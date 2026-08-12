import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Submission from './pages/Submission';
import AdminReview from './pages/AdminReview';
import Ledger from './pages/Ledger';
import MyRecords from './pages/MyRecords';
import PayoutSimulator from './pages/PayoutSimulator';
import ResetPassword from './pages/ResetPassword';
import 'leaflet/dist/leaflet.css';
import AuthForm from './components/AuthForm';
import ProtectedRoute from './components/ProtectedRoute';
import { getCurrentUser, signOut } from './lib/auth';
import { useUserRole } from './lib/useUserRole';
import logoImage from './assets/branding/cycle-green-logo.png';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    getCurrentUser().then((currentUser) => { setUser(currentUser); setCheckedAuth(true); });
  }, []);

  if (!checkedAuth) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="*"
          element={user
            ? <AppShell user={user} onLogout={() => setUser(null)} />
            : <AuthForm onAuthSuccess={setUser} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell({ user, onLogout }) {
  const { role, loading } = useUserRole();
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="logo" to="/" end aria-label="Cycle Green home"><img src={logoImage} alt="" /><span className="logo-wordmark">CycleGreen</span></NavLink>
        <nav className="app-nav">
          <NavLink to="/" end>Submission</NavLink>
          <NavLink to="/my-records">My Records</NavLink>
          <NavLink to="/payouts">Payout Simulator</NavLink>
          {!loading && role === 'admin' && <NavLink to="/admin">Admin Review</NavLink>}
          <NavLink to="/ledger">Ledger</NavLink>
        </nav>
        <div className="user-section">
          <p className="user-role">{role === 'admin' ? 'Administrator' : 'Community Member'}</p>
          <button className="logout-button" onClick={() => signOut().then(onLogout)} title={`Signed in as ${user.email}`}>Sign out</button>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Submission />} />
          <Route path="/my-records" element={<MyRecords />} />
          <Route path="/payouts" element={<PayoutSimulator />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminReview /></ProtectedRoute>} />
          <Route path="/ledger" element={<Ledger />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
