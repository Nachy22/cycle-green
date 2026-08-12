import { useUserRole } from '../lib/useUserRole';

export default function ProtectedRoute({ allowedRoles, children, fallback = null }) {
  const { role, loading } = useUserRole();

  if (loading) return <p style={{ padding: 24 }}>Checking access…</p>;

  if (!role || !allowedRoles.includes(role)) {
    return fallback ?? (
      <div style={{ padding: 24 }}>
        <h2>Not authorized</h2>
        <p>This page is only available to: {allowedRoles.join(', ')}.</p>
      </div>
    );
  }

  return children;
}