import { Link } from 'react-router-dom';

export default function RefundPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#f3f3ef', padding: '72px 24px', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <article style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 12 }}>← ASHES</Link>
        <p style={{ marginTop: 54, color: '#777', fontSize: 11, letterSpacing: '.16em' }}>REFUND POLICY · UPDATED AUGUST 24, 2026</p>
        <h1 style={{ fontSize: 'clamp(42px,8vw,76px)', lineHeight: .95, letterSpacing: '-.05em', margin: '14px 0 28px' }}>Straightforward refunds for Ashes Brain.</h1>
        <p style={{ color: '#aaa', lineHeight: 1.75 }}>This policy applies to paid Ashes Brain subscriptions purchased through our checkout. Paddle acts as the merchant of record and processes subscription payments and approved refunds.</p>

        <h2>First subscription payment</h2>
        <p>You may request a refund of your first subscription payment within 14 days of purchase. Contact us using the email address below and include the email used for your Ashes Brain account and your Paddle transaction or receipt number.</p>

        <h2>Renewal payments</h2>
        <p>You may request a refund of a renewal payment within 7 days of the renewal date if you have not materially used the paid service after renewal. Requests outside this period are normally not eligible unless the service was defective, unavailable for a substantial period, or applicable law requires otherwise.</p>

        <h2>Cancellation</h2>
        <p>You can cancel at any time through subscription management. Cancellation prevents future renewal charges. Unless a refund is issued, paid access remains available until the end of the current billing period.</p>

        <h2>Duplicate or incorrect charges</h2>
        <p>If you believe you were charged more than once or charged an incorrect amount, contact us promptly. We will investigate the payment record and correct confirmed billing errors.</p>

        <h2>How refunds are paid</h2>
        <p>Approved refunds are returned through Paddle to the original payment method. Bank and card processing times vary and are outside Ashes Stack's control. This policy does not limit any mandatory consumer rights that apply to you.</p>

        <h2>Request a refund</h2>
        <p>Email <a href="mailto:hello@ashes.studio" style={{ color: '#fff' }}>hello@ashes.studio</a> with your account email, Paddle transaction or receipt number, purchase date and a short explanation of the request.</p>

        <div style={{ borderTop: '1px solid #222', marginTop: 48, paddingTop: 22, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: '#fff' }}>Terms</Link><Link to="/privacy" style={{ color: '#fff' }}>Privacy</Link><Link to="/pricing" style={{ color: '#fff' }}>Pricing</Link><Link to="/" style={{ color: '#fff' }}>Home</Link>
        </div>
      </article>
    </main>
  );
}
