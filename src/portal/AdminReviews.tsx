import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, Me } from './api';
import { BlobLoaderCentered } from '../components/BlobLoader';
import AdminLayout from './AdminLayout';

type ReviewRow = { _id: string; clientName: string; company?: string; rating: number; comment?: string; createdAt: string };

export default function AdminReviews() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch('/api/reviews').then((r) => r.json());
    setReviews(r);
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'team') return navigate('/team');
      if (u.role !== 'admin') return navigate('/portal');
      setUser(u);
      await load();
      setLoading(false);
    });
  }, [navigate]);

  async function deleteReview(id: string) {
    if (!confirm('Remove this review? This is permanent.')) return;
    await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <AdminLayout user={user}><BlobLoaderCentered /></AdminLayout>;

  const avg = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <AdminLayout user={user}>
      <div className="portal-page-head">
        <div className="portal-eyebrow">CLIENT REVIEWS</div>
        <h1 className="portal-h1">Reviews</h1>
        <p className="portal-sub">
          {avg ? `${avg} average from ${reviews.length} review${reviews.length === 1 ? '' : 's'}. ` : ''}
          These show publicly on your <a href="/reviews" target="_blank" rel="noreferrer" style={{ color: '#ff62c7' }}>/reviews</a> page. Delete anything inappropriate here.
        </p>
      </div>

      <div className="portal-card">
        {reviews.length === 0 ? (
          <div className="portal-empty">No reviews yet.</div>
        ) : (
          <table className="portal-table">
            <thead><tr><th>Client</th><th>Rating</th><th>Comment</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.clientName}{r.company ? ` · ${r.company}` : ''}</td>
                  <td style={{ color: '#d8ff62' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                  <td style={{ maxWidth: 320 }}>{r.comment || '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <button className="pill-btn tiny" style={{ color: '#ff8fa3', borderColor: 'rgba(255,73,108,.4)' }} onClick={() => deleteReview(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
