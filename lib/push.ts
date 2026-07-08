/** Utilitários de Web Push (PWA instalado + VAPID). */

export type PushBlockReason =
  | "ok"
  | "no_browser"
  | "no_vapid"
  | "needs_install"
  | "denied";

export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function isPushApiAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getPushBlockReason(): PushBlockReason {
  if (!isPushApiAvailable()) return "no_browser";
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return "no_vapid";
  if (!isStandalonePWA()) return "needs_install";
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}
