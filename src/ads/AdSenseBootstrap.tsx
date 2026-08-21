import { useEffect } from 'react';

const ADSENSE_CLIENT = 'ca-pub-9749846832027432';

export default function AdSenseBootstrap() {
  useEffect(() => {
    const id = 'ashes-adsense-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(script);
  }, []);

  return null;
}
