export type AshesInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Window {
    __ashesInstallPrompt?: AshesInstallPromptEvent;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export function isAshesInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function setupAshesPwa() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    window.__ashesInstallPrompt = event as AshesInstallPromptEvent;
    window.dispatchEvent(new Event('ashes-install-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__ashesInstallPrompt = undefined;
    window.dispatchEvent(new Event('ashes-app-installed'));
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        console.error('ASHES service worker registration failed:', error);
      });
    }, { once: true });
  }
}
