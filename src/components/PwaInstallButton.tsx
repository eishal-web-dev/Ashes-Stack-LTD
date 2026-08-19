import { useEffect, useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { isAshesInstalled } from '../pwa';

function getFallbackLabel() {
  const ua = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  if (isIos) return 'SHARE → ADD TO HOME';
  if (ua.includes('firefox')) return 'MENU → INSTALL APP';
  return 'BROWSER MENU → INSTALL';
}

export default function PwaInstallButton() {
  const [installed, setInstalled] = useState(() => isAshesInstalled());
  const [ready, setReady] = useState(() => Boolean(window.__ashesInstallPrompt));
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const onReady = () => { setReady(true); setFallback(false); };
    const onInstalled = () => { setInstalled(true); setReady(false); setFallback(false); };
    window.addEventListener('ashes-install-ready', onReady);
    window.addEventListener('ashes-app-installed', onInstalled);
    return () => {
      window.removeEventListener('ashes-install-ready', onReady);
      window.removeEventListener('ashes-app-installed', onInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;
    const prompt = window.__ashesInstallPrompt;
    if (!prompt) {
      setFallback(true);
      return;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    window.__ashesInstallPrompt = undefined;
    setReady(false);
    if (choice.outcome === 'accepted') setInstalled(true);
  }

  const label = installed
    ? 'APP INSTALLED'
    : fallback && !ready
      ? getFallbackLabel()
      : 'DOWNLOAD APP';

  return (
    <button
      type="button"
      className={`footer-install-btn${installed ? ' installed' : ''}`}
      onClick={install}
      aria-label={installed ? 'ASHES app is installed' : 'Install ASHES as an app'}
      title={!ready && !installed ? 'If your browser cannot open the install prompt automatically, use its Install app or Add to Home Screen option.' : undefined}
    >
      {installed ? <CheckCircle2 size={13} /> : <Download size={13} />}
      <span>{label}</span>
    </button>
  );
}
