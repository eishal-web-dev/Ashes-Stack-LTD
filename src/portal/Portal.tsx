import { useEffect, useState, FormEvent, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout, Me } from './api';
import AccountSettings from './AccountSettings';
import NotificationBell from './NotificationBell';

const TYPE_LABELS: Record<string, string> = {
  welcome: 'Welcome Packet',
  contract: 'Service Agreement / Contract',
  invoice: 'Invoice',
  access_request: 'Access / Information Request',
  monthly_report: 'Monthly Progress Report',
  fulfillment: 'Fulfillment & Handover',
  feedback_request: 'Feedback Request',
  custom_file: 'File from ASHES',
};

type DocRow = {
  _id: string; title: string; type: string; status: string; createdAt: string;
  paymentStatus?: 'unpaid' | 'paid';
  signedAt?: string;
  signedByName?: string;
};
type Profile = { name: string; email: string; company?: string; project?: string; googleEmail?: string; phone?: string; age?: number; gender?: string };

export default function Portal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [myReview, setMyReview] = useState<{ rating: number; comment: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingDoc, setSigningDoc] = useState<string | null>(null);
  const [signName, setSignName] = useState('');
  const [signing, setSigning] = useState(false);

  async function refreshDocs() {
    const d = await fetch('/api/documents').then((r) => r.json());
    setDocs(d);
  }

  async function submitSignature(docId: string) {
    if (!signName.trim()) return;
    setSigning(true);
    const res = await fetch(`/api/documents/${docId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedByName: signName.trim() }),
    });
    setSigning(false);
    if (res.ok) {
      setSigningDoc(null);
      setSignName('');
      refreshDocs();
    }
  }

  useEffect(() => {
    getMe().then(async (u) => {
      if (!u) return navigate('/login');
      if (u.role === 'admin') return navigate('/admin');
      setUser(u);
      const [p, d, allReviews] = await Promise.all([
        fetch('/api/client/profile').then((r) => r.json()),
        fetch('/api/documents').then((r) => r.json()),
        fetch('/api/reviews').then((r) => r.json()),
      ]);
      setProfile(p);
      setDocs(d);
      const mine = Array.isArray(allReviews) ? allReviews.find((r: any) => r.client === u.id) : null;
      if (mine) {
        setMyReview({ rating: mine.rating, comment: mine.comment });
        setReviewRating(mine.rating);
        setReviewComment(mine.comment || '');
      }
      setLoading(false);
    });
  }, [navigate]);

  async function submitReview() {
    if (!reviewRating) return;
    setSubmittingReview(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment, clientName: user?.name, company: profile?.company }),
    });
    setSubmittingReview(false);
    if (res.ok) {
      setMyReview({ rating: reviewRating, comment: reviewComment });
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 3000);
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/client/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setProfile(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  if (loading || !profile) return <div className="portal-shell"><div className="portal-container">Loading…</div></div>;

  return (
    <div className="portal-shell">
      <div className="portal-topbar">
        <div className="portal-brand">ASHES <span>· Client Portal</span></div>
        <div className="portal-nav-actions">
          <NotificationBell />
          <span className="portal-user">{user?.name}</span>
          <button className="pill-btn tiny" onClick={onLogout}>Log out</button>
        </div>
      </div>

      <div className="portal-container">
        <div className="portal-eyebrow">YOUR PROJECT</div>
        <h1 className="portal-h1">Welcome, {user?.name}</h1>
        <p className="portal-sub">{profile.company} — {profile.project}</p>

        <div className="portal-card">
          <h2 className="portal-h2">Your details</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>We use this to book Google Meet calls and keep your file up to date.</p>
          {saved && <div className="portal-success">Saved.</div>}
          <form onSubmit={saveProfile}>
            <div className="portal-grid-2">
              <div className="portal-field">
                <label>Gmail (for Google Meet invites)</label>
                <input type="email" placeholder="you@gmail.com" value={profile.googleEmail || ''} onChange={(e) => setProfile({ ...profile, googleEmail: e.target.value })} />
              </div>
              <div className="portal-field">
                <label>Phone</label>
                <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <div className="portal-field">
                <label>Age</label>
                <input type="number" value={profile.age || ''} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
              </div>
              <div className="portal-field">
                <label>Gender</label>
                <select value={profile.gender || ''} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button className="pill-btn solid" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
          </form>
        </div>

        <AccountSettings profile={{ name: profile.name, email: (profile as any).email }} onUpdated={(p) => setProfile({ ...profile, ...p })} />

        <div className="portal-card">
          <h2 className="portal-h2">Documents from ASHES</h2>
          {docs.length === 0 ? (
            <div className="portal-empty">No documents yet — your admin will send your welcome packet, contract and invoices here.</div>
          ) : (
            <table className="portal-table">
              <thead><tr><th>Document</th><th>Type</th><th>Sent</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <Fragment key={d._id}>
                    <tr>
                      <td>{d.title}</td>
                      <td>{TYPE_LABELS[d.type] || d.type}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString('en-GB')}</td>
                      <td>
                        <span className={`portal-badge ${d.status}`}>{d.status}</span>
                        {d.type === 'invoice' && (
                          <span className={`portal-badge ${d.paymentStatus === 'paid' ? 'downloaded' : 'sent'}`} style={{ marginLeft: 6 }}>
                            {d.paymentStatus === 'paid' ? 'paid' : 'unpaid'}
                          </span>
                        )}
                        {d.type === 'contract' && d.signedAt && (
                          <span className="portal-badge downloaded" style={{ marginLeft: 6 }}>signed</span>
                        )}
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <a className="pill-btn tiny" href={`/api/documents/${d._id}/download`} target="_blank" rel="noreferrer">Download</a>
                        {d.type === 'contract' && !d.signedAt && (
                          <button className="pill-btn tiny solid" onClick={() => { setSigningDoc(d._id); setSignName(user?.name || ''); }}>
                            Sign &amp; approve
                          </button>
                        )}
                      </td>
                    </tr>
                    {signingDoc === d._id && (
                      <tr>
                        <td colSpan={5} style={{ background: 'rgba(255,98,199,.04)' }}>
                          <div style={{ padding: '12px 4px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '.72rem', color: '#8c8982' }}>Type your full name to sign this contract:</span>
                            <input
                              style={{ maxWidth: 220, padding: '9px 12px', borderRadius: 8, background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4', font: '400 .78rem "Courier New", monospace' }}
                              value={signName}
                              onChange={(e) => setSignName(e.target.value)}
                              placeholder="Your full name"
                            />
                            <button className="pill-btn tiny solid" disabled={signing} onClick={() => submitSignature(d._id)}>
                              {signing ? 'Signing…' : 'Confirm signature'}
                            </button>
                            <button className="pill-btn tiny" onClick={() => setSigningDoc(null)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {d.type === 'contract' && d.signedAt && (
                      <tr>
                        <td colSpan={5} style={{ fontSize: '.68rem', color: '#8c8982', paddingTop: 0 }}>
                          Signed by {d.signedByName} on {new Date(d.signedAt).toLocaleDateString('en-GB')}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="portal-card">
          <h2 className="portal-h2">{myReview ? 'Your review' : 'Rate your experience'}</h2>
          <p className="portal-sub" style={{ marginTop: -2 }}>
            {myReview ? 'You can update this anytime — it stays visible on our public Reviews page.' : "Tell us how it's going — this shows up on our public Reviews page."}
          </p>
          {reviewSaved && <div className="portal-success">Thanks — your review is live.</div>}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setReviewRating(n)}
                onMouseEnter={() => setHoverStar(n)}
                onMouseLeave={() => setHoverStar(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: '1.8rem', lineHeight: 1,
                  color: n <= (hoverStar || reviewRating) ? '#d8ff62' : 'rgba(255,255,255,.18)',
                  transition: 'color .15s',
                }}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <div className="portal-field">
            <label>Comment (optional)</label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What was it like working with ASHES?"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                background: '#0a0a0b', border: '1px solid rgba(214,209,198,.2)', color: '#eceae4',
                font: '400 .85rem "Courier New", monospace', resize: 'vertical',
              }}
            />
          </div>
          <button className="pill-btn solid" disabled={!reviewRating || submittingReview} onClick={submitReview}>
            {submittingReview ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}
