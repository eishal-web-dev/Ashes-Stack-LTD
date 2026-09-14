import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

type ReviewRow = { _id: string; clientName: string; company?: string; rating: number; comment?: string; createdAt: string };

export default function ReviewsPage() {
  useSEO({
    title: 'Verified Client Reviews | Ashes Stack',
    description: "Read verified feedback submitted by Ashes Stack clients and learn how reviews are collected, checked and displayed.",
    path: '/reviews',
  });

  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/reviews', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Reviews request failed (${r.status})`);
        return r.json() as Promise<ReviewRow[]>;
      })
      .then((rows) => setReviews(Array.isArray(rows) ? rows : []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(true);
        setReviews([]);
      });
    return () => controller.abort();
  }, []);

  const avg = reviews && reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">CLIENT REVIEWS</div>
        <h1>WHAT CLIENTS<br/><span>ACTUALLY SAY.</span></h1>
        <p className="page-lede">
          {avg ? `${avg} average rating from ${reviews!.length} verified review${reviews!.length === 1 ? '' : 's'}.` : 'Feedback submitted by clients who have worked with Ashes Stack.'}
        </p>

        <div className="page-body" style={{ maxWidth: 720 }}>
          <section style={{ marginBottom: 36 }}>
            <h2>How reviews work</h2>
            <p style={{ color: '#aaa', lineHeight: 1.8 }}>Reviews on this page come from authenticated client portals after project work has started. Ashes Stack does not invent testimonials or publish anonymous marketing quotes as client feedback. A review may be removed if it contains private project information, abuse or content unrelated to the service.</p>
          </section>
          {reviews === null && <p role="status" style={{ color: '#8e8a85' }}>Checking for published client reviews…</p>}
          {loadError && <p role="status" style={{ color: '#c8a98f' }}>Client reviews are temporarily unavailable. Please check again later.</p>}
          {!loadError && reviews !== null && reviews.length === 0 && <p style={{ color: '#8e8a85' }}>No client has chosen to publish a review yet.</p>}
          {reviews?.map((r) => (
            <div className="review-card" key={r._id}>
              <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
              <div className="review-meta">{r.clientName}{r.company ? ` · ${r.company}` : ''} · {new Date(r.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
            </div>
          ))}
          <section style={{ marginTop: 40, paddingTop: 28, borderTop: '1px solid #272727' }}>
            <h2>What clients can review</h2>
            <p style={{ color: '#aaa', lineHeight: 1.8 }}>Clients can comment on communication, design decisions, engineering quality and delivery. Ratings reflect an individual client’s experience and are not edited to change their meaning.</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
