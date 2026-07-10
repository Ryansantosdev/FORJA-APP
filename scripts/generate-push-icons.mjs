/** Ícones temáticos para notificações push (água azul, frases âmbar). */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const aguaIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1520"/>
      <stop offset="100%" stop-color="#12304a"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bg)"/>
  <circle cx="96" cy="96" r="56" fill="#5eb8ff18"/>
  <path d="M96 48 C96 48 68 92 68 114 a28 28 0 0 0 56 0 C124 92 96 48 96 48z" fill="#5eb8ff"/>
  <ellipse cx="88" cy="102" rx="8" ry="12" fill="#ffffff33"/>
</svg>`;

const fraseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1408"/>
      <stop offset="100%" stop-color="#2a1f0a"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="44" fill="url(#bg)"/>
  <circle cx="96" cy="96" r="56" fill="#f5a62318"/>
  <path d="M72 118 V74 h16 c14 0 22 7 22 18 0 8-4 14-11 16 l14 22 h-18 l-12-20 h-11 v20 z M88 74 v12 h8 c6 0 9-3 9-8 s-3-8-9-8 z" fill="#f5a623"/>
  <path d="M108 118 V74 h16 c14 0 22 7 22 18 0 8-4 14-11 16 l14 22 h-18 l-12-20 h-11 v20 z M124 74 v12 h8 c6 0 9-3 9-8 s-3-8-9-8 z" fill="#f5a623" opacity="0.85"/>
</svg>`;

const aguaBanner = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256" viewBox="0 0 512 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0c1520"/>
      <stop offset="100%" stop-color="#1a4a72"/>
    </linearGradient>
  </defs>
  <rect width="512" height="256" fill="url(#bg)"/>
  <path d="M96 128 C96 128 64 176 64 204 a32 32 0 0 0 64 0 C128 176 96 128 96 128z" fill="#5eb8ff"/>
  <text x="168" y="118" fill="#5eb8ff" font-family="system-ui,sans-serif" font-size="36" font-weight="700">Água</text>
  <text x="168" y="162" fill="#8ecfff" font-family="system-ui,sans-serif" font-size="22">Hora de hidratar</text>
</svg>`;

const fraseBanner = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="256" viewBox="0 0 512 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1a1408"/>
      <stop offset="100%" stop-color="#3d2a0a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="256" fill="url(#bg)"/>
  <circle cx="96" cy="128" r="40" fill="#f5a62322"/>
  <text x="72" y="140" fill="#f5a623" font-family="Georgia,serif" font-size="52">"</text>
  <text x="168" y="118" fill="#f5a623" font-family="system-ui,sans-serif" font-size="36" font-weight="700">Mente</text>
  <text x="168" y="162" fill="#ffc96a" font-family="system-ui,sans-serif" font-size="22">Frase motivacional</text>
</svg>`;

async function writePng(name, svg, width, height) {
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(`public/icons/${name}`);
}

await writePng("push-agua.png", aguaIcon, 192, 192);
await writePng("push-frase.png", fraseIcon, 192, 192);
await writePng("push-banner-agua.png", aguaBanner, 512, 256);
await writePng("push-banner-frase.png", fraseBanner, 512, 256);

console.log("Ícones push gerados em public/icons/push-*.png");
