import { useEffect, useState } from 'react';
import { getPendingRecords, verifyRecord, rejectRecord } from '../lib/records';

export default function AdminReview() {
  const [notes, setNotes] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setSubmissions(await getPendingRecords());
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (err) {
        alert('Failed to load: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNoteChange = (id, value) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  };

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await verifyRecord(id, notes[id] || null);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Approve failed: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    try {
      await rejectRecord(id, notes[id] || null);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Reject failed: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Admin Review</h1>
      <p className="page-subtitle">Verify submissions before credits are released.</p>

      <table className="review-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Community / Site</th>
            <th>Trees Logged</th>
            <th>Photo</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>No pending submissions.</td></tr>
          )}
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>{s.id.slice(0, 8)}</td>
              <td>{s.community}</td>
              <td>{s.tree_count}</td>
              <td><a href={s.photo_url} target="_blank" rel="noreferrer">View</a></td>
              <td><span className="status-badge">{s.status}</span></td>
              <td>
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={notes[s.id] || ''}
                  onChange={(e) => handleNoteChange(s.id, e.target.value)}
                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid #b6c9b8', width: '140px' }}
                />
              </td>
              <td>
                <button className="btn-small" disabled={busyId === s.id} onClick={() => handleApprove(s.id)}>
                  {busyId === s.id ? '…' : 'Approve'}
                </button>
                <button className="btn-small btn-reject" disabled={busyId === s.id} onClick={() => handleReject(s.id)}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
