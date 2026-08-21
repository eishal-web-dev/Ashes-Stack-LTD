import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'ashes-analytics-session-v1';

function id() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const SESSION_ID = id();

function cleanPath(pathname: string) {
  if (pathname.startsWith('/workspace/share/')) return '/workspace/share/:token';
  return pathname || '/';
}

function privateSurface(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/portal') || pathname.startsWith('/team');
}

function sourceFor(search: string) {
  const params = new URLSearchParams(search);
  const utm = params.get('utm_source');
  if (utm) return utm.slice(0, 160);
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== location.hostname) return host.slice(0, 160);
    }
  } catch { /* ignore */ }
  return 'direct';
}

function referrer() {
  try { return document.referrer ? new URL(document.referrer).hostname.slice(0, 500) : ''; }
  catch { return ''; }
}

export function trackAshes(event: 'page_view' | 'link_click', payload: Record<string, unknown> = {}) {
  if (navigator.doNotTrack === '1') return;
  const body = {
    event,
    sessionId: SESSION_ID,
    path: cleanPath(location.pathname),
    source: sourceFor(location.search),
    referrer: referrer(),
    meta: payload,
  };
  fetch('/api/workspace?analytics=track', {
    method: 'POST',
    credentials: 'omit',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

export default function AnalyticsTracker() {
  const locationState = useLocation();

  useEffect(() => {
    if (privateSurface(locationState.pathname)) return;
    trackAshes('page_view', { title: document.title.slice(0, 160) });
  }, [locationState.pathname, locationState.search]);

  useEffect(() => {
    if (privateSurface(locationState.pathname)) return;
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const label = (target.textContent || target.getAttribute('aria-label') || 'link').trim().replace(/\s+/g, ' ').slice(0, 120);
      let destination = target.getAttribute('href') || '';
      try {
        const url = new URL(target.href, location.origin);
        destination = url.origin === location.origin ? cleanPath(url.pathname) : `${url.protocol}//${url.hostname}${url.pathname}`;
      } catch { /* keep raw destination */ }
      trackAshes('link_click', { label, destination: destination.slice(0, 500) });
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [locationState.pathname]);

  return null;
}
