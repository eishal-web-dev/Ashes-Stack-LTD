import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

type NotificationRow = { _id: string; type: string; title: string; message?: string; read: boolean; link?: string; createdAt: string };
type DeviceAlertState = 'unsupported' | 'default' | 'enabled' | 'off' | 'blocked';

const DEVICE_ALERT_PREF = 'ashes-device-notifications';

function playRing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1108, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Audio not available/blocked — silently skip, the visual badge still works.
  }
}

function readDeviceAlertState(): DeviceAlertState {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission === 'granted') {
    return localStorage.getItem(DEVICE_ALERT_PREF) === 'off' ? 'off' : 'enabled';
  }
  return 'default';
}

async function showDeviceNotification(notification: NotificationRow) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (localStorage.getItem(DEVICE_ALERT_PREF) === 'off') return;

  const options: NotificationOptions = {
    body: notification.message || 'You have a new ASHES update.',
    icon: '/pwa-icon-192.svg',
    badge: '/pwa-icon-192.svg',
    tag: `ashes-${notification._id}`,
    data: { url: notification.link || window.location.pathname || '/portal' },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (registration) {
        await registration.showNotification(notification.title || 'ASHES', options);
        return;
      }
    }
    new Notification(notification.title || 'ASHES', options);
  } catch {
    // The in-app notification remains available even if the OS notification is blocked.
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ringing, setRinging] = useState(false);
  const [deviceAlerts, setDeviceAlerts] = useState<DeviceAlertState>(() => readDeviceAlertState());
  const knownIds = useRef<Set<string>>(new Set());
  const hasLoaded = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function load(isPoll = false) {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const nextItems: NotificationRow[] = Array.isArray(data.notifications) ? data.notifications : [];
    const nextUnread = Number(data.unreadCount || 0);

    if (hasLoaded.current && isPoll) {
      const newUnread = nextItems.filter((item) => !knownIds.current.has(item._id) && !item.read);
      if (newUnread.length > 0) {
        playRing();
        setRinging(true);
        window.setTimeout(() => setRinging(false), 700);
        await showDeviceNotification(newUnread[0]);
      }
    }

    knownIds.current = new Set(nextItems.map((item) => item._id));
    hasLoaded.current = true;
    setItems(nextItems);
    setUnreadCount(nextUnread);
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(true), 20000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function enableDeviceAlerts() {
    if (!('Notification' in window)) {
      setDeviceAlerts('unsupported');
      return;
    }

    const permission = Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission === 'granted') {
      localStorage.setItem(DEVICE_ALERT_PREF, 'on');
      setDeviceAlerts('enabled');
      await showDeviceNotification({
        _id: 'enabled',
        type: 'system',
        title: 'ASHES notifications are on',
        message: 'New portal updates can now appear on this device.',
        read: false,
        link: window.location.pathname,
        createdAt: new Date().toISOString(),
      });
    } else if (permission === 'denied') {
      setDeviceAlerts('blocked');
    }
  }

  function disableDeviceAlerts() {
    localStorage.setItem(DEVICE_ALERT_PREF, 'off');
    setDeviceAlerts('off');
  }

  async function onItemClick(n: NotificationRow) {
    if (!n.read) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', id: n._id }),
      });
      load();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' }),
    });
    load();
  }

  const deviceCopy = deviceAlerts === 'enabled'
    ? ['Device alerts on', 'New portal updates can appear as notifications.']
    : deviceAlerts === 'blocked'
      ? ['Device alerts blocked', 'Allow notifications in your browser/site settings.']
      : deviceAlerts === 'unsupported'
        ? ['Device alerts unavailable', 'This browser does not expose notification permission.']
        : deviceAlerts === 'off'
          ? ['Device alerts off', 'Turn them back on whenever you want.']
          : ['Enable device alerts', 'Allow ASHES to show new client updates on this device.'];

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen((v) => !v); setDeviceAlerts(readDeviceAlertState()); }}
        aria-label="Notifications"
        style={{
          position: 'relative', background: 'transparent', border: '1px solid rgba(255,255,255,.14)',
          borderRadius: 999, width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer',
          color: '#c9c7c1', animation: ringing ? 'bellRing .6s ease' : 'none',
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 4px',
            borderRadius: 999, background: '#ff62c7', color: '#0a0a0b', fontSize: 9, fontWeight: 800,
            display: 'grid', placeItems: 'center', lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, width: 'min(320px, calc(100vw - 28px))', maxHeight: 440, overflowY: 'auto',
          background: '#0c0c0e', border: '1px solid rgba(214,209,198,.18)', borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0,0,0,.5)', zIndex: 50,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(214,209,198,.1)' }}>
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#eceae4' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#ff62c7', fontSize: '.6rem', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-device-row">
            <div className="notification-device-copy">
              <b>{deviceCopy[0]}</b>
              <small>{deviceCopy[1]}</small>
            </div>
            {deviceAlerts === 'enabled' ? (
              <button className="notification-device-action on" type="button" onClick={disableDeviceAlerts}>ON</button>
            ) : deviceAlerts === 'blocked' || deviceAlerts === 'unsupported' ? (
              <button className="notification-device-action" type="button" disabled>{deviceAlerts === 'blocked' ? 'BLOCKED' : 'N/A'}</button>
            ) : (
              <button className="notification-device-action" type="button" onClick={enableDeviceAlerts}>TURN ON</button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#66625b', fontSize: '.7rem' }}>Nothing yet.</div>
          ) : (
            items.map((n) => (
              <button
                key={n._id}
                onClick={() => onItemClick(n)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: n.read ? 'transparent' : 'rgba(255,98,199,.06)', border: 'none',
                  borderBottom: '1px solid rgba(214,209,198,.08)', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#eceae4' }}>{n.title}</div>
                {n.message && <div style={{ fontSize: '.68rem', color: '#8c8982', marginTop: 3 }}>{n.message}</div>}
                <div style={{ fontSize: '.6rem', color: '#66625b', marginTop: 5 }}>{new Date(n.createdAt).toLocaleString('en-GB')}</div>
              </button>
            ))
          )}
        </div>
      )}
      <style>{`@keyframes bellRing { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-14deg); } 40% { transform: rotate(12deg); } 60% { transform: rotate(-8deg); } 80% { transform: rotate(6deg); } }`}</style>
    </div>
  );
}
