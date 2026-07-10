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

/** Mensagens de preview — mesmas usadas no disparo real e nos testes. */
export function pushPreview(kind: PushKind, opts?: { faltaL?: string }): PushPayload {
  switch (kind) {
    case "agua":
      return pushPayload(
        "agua",
        "FORJA · Água",
        `Faltam ${opts?.faltaL ?? "1.0"}L para a meta. Abra a Dieta e marque.`,
        "/dieta"
      );
    case "frase":
      return pushPayload(
        "frase",
        "FORJA · Mente",
        "Disciplina vence motivação — Provérbios 12:24",
        "/motivacao"
      );
    default:
      return pushPayload(
        "teste",
        "FORJA · Teste",
        "Notificações funcionando! Se viu isso, está tudo certo.",
        "/"
      );
  }
}
