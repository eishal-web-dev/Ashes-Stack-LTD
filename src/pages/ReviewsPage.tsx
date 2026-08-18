import { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useSEO } from '../useSEO';

type ReviewRow = { _id: string; clientName: string; company?: string; rating: number; comment?: string; createdAt: string };

export default function ReviewsPage() {
  useSEO({
    title: 'Client Reviews — Ashes Stack Software House, Islamabad',
    description: "See what clients say about working with Ashes Stack — real reviews from real projects, straight from our clients' portals.",
    path: '/reviews',
  });

  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);

  useEffect(() => {
    fetch('/api/reviews').then((r) => r.json()).then(setReviews);
  }, []);

  const avg = reviews && reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <>
      <Nav />
      <div className="standalone-page">
        <div className="page-kicker">CLIENT REVIEWS</div>
        <h1>WHAT CLIENTS<br/><span>ACTUALLY SAY.</span></h1>
        <p className="page-lede">
          {avg ? `${avg} average rating from ${reviews!.length} review${reviews!.length === 1 ? '' : 's'}.` : 'Real feedback from real ASHES clients.'}
        </p>

        <div className="page-body" style={{ maxWidth: 720 }}>
          {reviews === null && <p style={{ color: '#8e8a85' }}>Loading…</p>}
          {reviews !== null && reviews.length === 0 && <p style={{ color: '#8e8a85' }}>No reviews yet — check back soon.</p>}
          {reviews?.map((r) => (
            <div className="review-card" key={r._id}>
              <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
              <div className="review-meta">{r.clientName}{r.company ? ` · ${r.company}` : ''} · {new Date(r.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
