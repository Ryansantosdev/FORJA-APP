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

export type PushKeys = { p256dh: string; auth: string };

export function keysFromSubscription(sub: PushSubscription): PushKeys | null {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) return null;
  return { p256dh, auth };
}

/** Inscreve (ou reinscreve) com a VAPID pública atual — evita mismatch com o servidor. */
export async function subscribeForPush(vapidPublicKey: string): Promise<{
  endpoint: string;
  keys: PushKeys;
}> {
  await ensureServiceWorker();
  const reg = await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    await existing.unsubscribe();
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const keys = keysFromSubscription(sub);
  if (!keys) {
    throw new Error("Navegador não retornou chaves de push. Tente reiniciar o app.");
  }

  return { endpoint: sub.endpoint, keys };
}

export function formatPushError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("vapid") || m.includes("pkhash") || m.includes("credentials")) {
    return "Chaves VAPID não batem. Toque em Ativar notificações de novo.";
  }
  if (m.includes("410") || m.includes("expired") || m.includes("gone")) {
    return "Inscrição expirada. Toque em Ativar notificações de novo.";
  }
  if (m.includes("404") || m.includes("not found")) {
    return "Inscrição inválida. Reative as notificações.";
  }
  if (m.includes("unauthorized") || m.includes("401") || m.includes("403")) {
    return "Permissão recusada pelo servidor push. Reative as notificações.";
  }
  return raw;
}
