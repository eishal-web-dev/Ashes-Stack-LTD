import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type BillingStatus = {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'team';
  planName: string;
  limits: { projects: number; memoriesPerProject: number };
  billing: { provider?: string; variantId?: string; status?: string; renewsAt?: string | null; endsAt?: string | null; portalUrl?: string };
  checkoutConfigured: boolean;
};

type PaddleCheckout = {
  Environment: { set(environment: 'sandbox' | 'production'): void };
  Initialize(options: { token: string }): void;
  Checkout: {
    open(options: {
      items: Array<{ priceId: string; quantity: number }>;
      customer?: { email: string };
      customData?: Record<string, string>;
      settings?: { displayMode?: 'overlay'; theme?: 'dark' | 'light'; successUrl?: string };
    }): void;
  };
};

declare global {
  interface Window { Paddle?: PaddleCheckout }
}

const PADDLE_CLIENT_TOKEN = 'live_f8b13262c350230b6319f964af0';
const PADDLE_PRO_PRICE_ID = 'pri_01m0sh3kxyft7dq28b8s810e9k';

let paddlePromise: Promise<PaddleCheckout> | null = null;

function loadPaddle() {
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (paddlePromise) return paddlePromise;
  paddlePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ashes-paddle]');
    const script = existing || document.createElement('script');
    if (!existing) {
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      script.dataset.ashesPaddle = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => window.Paddle ? resolve(window.Paddle) : reject(new Error('Paddle did not load')));
    script.addEventListener('error', () => reject(new Error('Paddle checkout could not load')));
  }).then((paddle) => {
    paddle.Environment.set('production');
    paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
    return paddle;
  });
  return paddlePromise;
}

const card: React.CSSProperties = {
  border: '1px solid #242424', borderRadius: 24, background: '#0d0d0d', padding: 28,
  display: 'flex', flexDirection: 'column', minHeight: 390,
};

export default function PricingPage() {
  const [account, setAccount] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/notifications?billing=status', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<BillingStatus>;
      })
      .then((data) => { if (alive) setAccount(data); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  async function upgrade() {
    if (!account) {
      window.location.assign('/workspace/login?next=/pricing');
      return;
    }
    const hasLivePaddleSubscription = account.billing?.provider === 'paddle' && account.billing?.variantId === PADDLE_PRO_PRICE_ID;
    if (account.plan === 'pro' && hasLivePaddleSubscription) {
      setBusy(true); setMessage('');
      try {
        const res = await fetch('/api/notifications?billing=paddle-portal', {
          method: 'POST',
          credentials: 'include',
        });
        const data = await res.json() as { portalUrl?: string; error?: string };
        if (!res.ok || !data.portalUrl) throw new Error(data.error || 'Subscription management unavailable');
        window.location.assign(data.portalUrl);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Subscription management unavailable');
        setBusy(false);
      }
      return;
    }

    setBusy(true); setMessage('');
    try {
      const paddle = await loadPaddle();
      paddle.Checkout.open({
        items: [{ priceId: PADDLE_PRO_PRICE_ID, quantity: 1 }],
        customer: { email: account.email },
        customData: { user_id: account.id, plan: 'pro' },
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          successUrl: `${window.location.origin}/workspace?payment=success`,
        },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout unavailable');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070707', color: '#f5f5f1', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '42px 24px 100px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900, letterSpacing: '.12em' }}>ASHES</Link>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Link to="/workspace" style={{ color: '#aaa', textDecoration: 'none' }}>Brain</Link>
            <Link to="/workspace/login" style={{ color: '#fff', textDecoration: 'none' }}>{account ? account.planName : 'Sign in'}</Link>
          </div>
        </nav>

        <section style={{ maxWidth: 820, padding: '92px 0 52px' }}>
          <p style={{ color: '#ff6a2a', fontSize: 12, letterSpacing: '.18em', fontWeight: 800 }}>ASHES BRAIN PRICING</p>
          <h1 style={{ margin: '14px 0 18px', fontSize: 'clamp(48px,8vw,92px)', lineHeight: .94, letterSpacing: '-.055em' }}>One brain.<br/>Every AI.</h1>
          <p style={{ color: '#aaa69f', fontSize: 19, lineHeight: 1.75, maxWidth: 700 }}>Start free. Upgrade when your shared AI workspace becomes part of your daily work. No ads inside Brain.</p>
          {account && <p style={{ marginTop: 18, color: '#d0cdc6' }}>Current plan: <strong>{account.planName}</strong></p>}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 18 }}>
          <div style={card}>
            <div><span style={{ color: '#888', fontSize: 12, letterSpacing: '.14em' }}>FREE</span><h2 style={{ fontSize: 34, margin: '10px 0 2px' }}>$0</h2><p style={{ color: '#888', marginTop: 4 }}>forever</p></div>
            <div style={{ color: '#b8b4ad', lineHeight: 2, marginTop: 24 }}>
              <div>✓ Up to 2 Brain chats</div><div>✓ Up to 10 messages per chat</div><div>✓ MCP connection</div><div>✓ Share Brain links</div>
            </div>
            <Link to="/workspace" style={{ marginTop: 'auto', padding: '14px 18px', border: '1px solid #333', borderRadius: 12, color: '#fff', textDecoration: 'none', textAlign: 'center', fontWeight: 800 }}>USE FREE</Link>
          </div>

          <div style={{ ...card, borderColor: '#6b321b', boxShadow: '0 0 0 1px rgba(255,106,42,.08),0 20px 80px rgba(255,80,20,.08)' }}>
            <div><span style={{ color: '#ff6a2a', fontSize: 12, letterSpacing: '.14em', fontWeight: 900 }}>PRO</span><h2 style={{ fontSize: 34, margin: '10px 0 2px' }}>$12</h2><p style={{ color: '#888', marginTop: 4 }}>per month</p></div>
            <div style={{ color: '#d0ccc4', lineHeight: 2, marginTop: 24 }}>
              <div>✓ Up to 25 Brain chats</div><div>✓ Up to 250 messages per chat</div><div>✓ Shared AI handoffs</div><div>✓ Priority new Brain features</div><div>✓ Manage subscription anytime</div>
            </div>
            <button onClick={upgrade} disabled={busy || loading} style={{ marginTop: 'auto', padding: '15px 18px', border: 0, borderRadius: 12, background: '#ff6425', color: '#090909', fontWeight: 950, cursor: 'pointer', opacity: busy || loading ? .65 : 1 }}>
              {busy ? 'OPENING CHECKOUT…' : account?.plan === 'pro' && account.billing?.provider === 'paddle' && account.billing?.variantId === PADDLE_PRO_PRICE_ID ? 'MANAGE PRO' : account?.plan === 'pro' ? 'CONNECT PADDLE LIVE' : 'UPGRADE TO PRO'}
            </button>
          </div>

          <div style={{ ...card, opacity: .8 }}>
            <div><span style={{ color: '#999', fontSize: 12, letterSpacing: '.14em' }}>TEAM · COMING SOON</span><h2 style={{ fontSize: 34, margin: '10px 0 2px' }}>$29</h2><p style={{ color: '#888', marginTop: 4 }}>planned monthly price</p></div>
            <div style={{ color: '#aaa', lineHeight: 2, marginTop: 24 }}>
              <div>• Shared company Brain</div><div>• Multiple members</div><div>• Team projects</div><div>• Admin controls</div>
            </div>
            <div style={{ marginTop: 'auto', padding: '14px 18px', border: '1px solid #2c2c2c', borderRadius: 12, color: '#777', textAlign: 'center', fontWeight: 800 }}>NOT SELLING THIS YET</div>
          </div>
        </section>

        {message && <p style={{ marginTop: 22, color: '#ff9b72' }}>{message}</p>}
        {!account && !loading && <p style={{ marginTop: 22, color: '#aaa' }}>Sign in to Ashes Brain before upgrading so the subscription is attached to the correct Brain account.</p>}

        <section style={{ marginTop: 72, paddingTop: 28, borderTop: '1px solid #222', color: '#777', lineHeight: 1.7 }}>
          Payments are securely processed by Paddle. Ashes does not store your card details. Paddle acts as merchant of record and handles payment processing and applicable sales tax.
        </section>
      </div>
    </main>
  );
}
