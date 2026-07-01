import { useEffect, useState } from 'react';

const VAPID_PUBLIC = 'BPK1ArKe9auD9PmUHEyqKDJv-Y_tucS3I73HCpGIIZSskw2_FnvxKqYxk2I4V9nVROtEtQbLDBdr63cAkMx1UnY';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function doSubscribe() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });
  await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub.toJSON(), action: 'subscribe' }),
  });
}

export function useAutoNotify() {
  // null = unknown, true = need to ask, false = done/not applicable
  const [needsBanner, setNeedsBanner] = useState(false);

  useEffect(() => {
    if (!isSupported()) return;
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') {
      // Already granted — just make sure we're subscribed
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription()
      ).then(existing => {
        if (!existing) doSubscribe().catch(() => {});
      });
      return;
    }
    // permission === 'default' — show banner
    setNeedsBanner(true);
  }, []);

  // Called when user taps the banner button (user gesture — required by Chrome)
  async function requestNow() {
    if (!isSupported()) return;
    setNeedsBanner(false);
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    await doSubscribe().catch(() => {});
  }

  return { needsBanner, requestNow };
}
