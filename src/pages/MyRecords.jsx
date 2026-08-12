import { useEffect, useState } from 'react';
import { getMyRecords } from '../lib/records';

export default function MyRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRecords(await getMyRecords());
      } catch (err) {
        alert('Failed to load your records: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>My Records</h1>
      <p className="page-subtitle">Track your planting submissions and review status.</p>

      {records.length === 0 ? (
        <div className="placeholder-box">You have not submitted any records yet.</div>
      ) : (
        <table className="review-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Community</th>
              <th>Trees</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id.slice(0, 8)}</td>
                <td>{record.community}</td>
                <td>{record.tree_count}</td>
                <td><span className="status-badge">{record.status}</span></td>
                <td>{new Date(record.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
