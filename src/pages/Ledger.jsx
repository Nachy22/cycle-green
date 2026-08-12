import { useEffect, useState } from 'react';
import { getLedger } from '../lib/records';

export default function Ledger() {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLedgerEntries(await getLedger());
      } catch (err) {
        alert('Failed to load ledger: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Carbon Credit Ledger</h1>
      <p className="page-subtitle">Auditable trail of verified credits and payouts.</p>

      <table className="review-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Community / Site</th>
            <th>Amount (ZMW)</th>
            <th>Transaction Ref</th>
            <th>Paid On</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ledgerEntries.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>No ledger entries yet.</td></tr>
          )}
          {ledgerEntries.map((row) => (
            <tr key={row.id}>
              <td>{row.id.slice(0, 8)}</td>
              <td>{row.planting_records?.community ?? '—'}</td>
              <td>{row.amount_zmw}</td>
              <td>{row.transaction_ref || '—'}</td>
              <td>{row.paid_at ? new Date(row.paid_at).toLocaleDateString() : '—'}</td>
              <td><span className="status-badge">{row.payment_status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
