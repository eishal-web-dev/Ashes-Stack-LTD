import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function GoogleSignInButton({ onError }: { onError: (msg: string) => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    async function handleCredential(response: any) {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || 'Google sign-in failed.');
        return;
      }
      window.location.href = data.role === 'admin' ? '/admin' : '/portal';
    }

    function init() {
      if (!window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredential });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black', size: 'large', width: 320, shape: 'pill', text: 'signin_with',
      });
      setReady(true);
    }

    if (window.google) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [onError]);

  if (!CLIENT_ID) return null;

  return (
    <div style={{ margin: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
        <span style={{ fontSize: '.62rem', color: '#66625b', letterSpacing: '.08em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
      </div>
      <div ref={btnRef} style={{ minHeight: 44 }} />
      {!ready && <span style={{ fontSize: '.6rem', color: '#66625b' }}>Loading Google Sign-In…</span>}
    </div>
  );
}
