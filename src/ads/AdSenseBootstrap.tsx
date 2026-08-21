import { useEffect } from 'react';

export default function AdSenseBootstrap() {
  const client = String(import.meta.env.VITE_ADSENSE_CLIENT || '').trim();

  useEffect(() => {
    if (!client || !client.startsWith('ca-pub-')) return;
    const id = 'ashes-adsense-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    document.head.appendChild(script);
  }, [client]);

  return null;
}
