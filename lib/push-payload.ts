/** Payload enviado ao service worker via Web Push. */

export type PushKind = "agua" | "frase" | "teste";

export type PushPayload = {
  type: PushKind;
  title: string;
  body: string;
  url: string;
};

export function pushPayload(
  type: PushKind,
  title: string,
  body: string,
  url: string
): PushPayload {
  return { type, title, body, url };
}
