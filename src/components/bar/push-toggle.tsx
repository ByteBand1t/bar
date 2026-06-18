"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushToggle() {
  const [supported] = useState(() =>
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => setMessage("Push konnte nicht initialisiert werden."));
  }, [supported]);

  if (!supported) return null;

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Benachrichtigungen wurden nicht erlaubt.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const nextSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
      });

      const res = await fetch("/api/bar/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSubscription),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      setSubscription(nextSubscription);
      setMessage("Push ist aktiv.");
    } catch {
      setMessage("Push-Aktivierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!subscription) return;
    setBusy(true);
    setMessage(null);
    try {
      await fetch("/api/bar/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage("Push ist deaktiviert.");
    } catch {
      setMessage("Push-Deaktivierung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hidden xl:flex max-w-xs flex-col text-xs text-bar-muted">
      <button
        onClick={subscription ? disable : enable}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-bar-border px-3 py-1.5 text-sm text-bar-muted transition-colors hover:bg-bar-soft hover:text-white disabled:opacity-60"
        title="Push-Benachrichtigungen"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : subscription ? <Bell size={16} /> : <BellOff size={16} />}
        <span>{subscription ? "Push aktiv" : "Push aktivieren"}</span>
      </button>
      <span className="mt-1 leading-snug">
        iPhone: erst zum Home-Bildschirm hinzufügen (Teilen → Zum Home-Bildschirm).
      </span>
      {message && <span className="mt-1 text-amber-300">{message}</span>}
    </div>
  );
}
