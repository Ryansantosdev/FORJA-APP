/** Payload enviado ao service worker via Web Push. */

import {
  fraseLembretePush,
  lembreteAguaPush,
  previewAguaPush,
  previewFrasePush,
} from "@/lib/push-reminders";
import { insightForPush } from "@/lib/insights-push";

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
export function pushPreview(kind: PushKind): PushPayload {
  switch (kind) {
    case "agua": {
      const msg = previewAguaPush("test-preview");
      return pushPayload("agua", msg.title, msg.body, "/dieta");
    }
    case "frase": {
      const insight = insightForPush("test-preview-frase");
      const msg = fraseLembretePush("test-preview", insight);
      return pushPayload("frase", msg.title, msg.body, "/motivacao");
    }
    default:
      return pushPayload(
        "teste",
        "FORJA · Teste",
        "Notificações funcionando! Se viu isso, está tudo certo.",
        "/"
      );
  }
}

export { lembreteAguaPush, fraseLembretePush };
