// Gera os ícones do PWA a partir de um SVG (chama de raiz: node scripts/generate-icons.mjs)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0a0e17"/>
  <g transform="translate(256 276)">
    <path d="M0 -150
      C 55 -95, 88 -50, 88 15
      C 88 82, 46 132, 0 132
      C -46 132, -88 82, -88 15
      C -88 -25, -70 -60, -45 -85
      C -45 -50, -28 -32, -10 -28
      C -30 -70, -22 -115, 0 -150 Z"
      fill="#4f7cff"/>
    <path d="M0 -60
      C 28 -30, 44 -8, 44 30
      C 44 68, 24 96, 0 96
      C -24 96, -44 68, -44 30
      C -44 8, -34 -8, -22 -22
      C -22 -2, -12 8, -2 10
      C -14 -14, -10 -38, 0 -60 Z"
      fill="#0a0e17"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const buf = Buffer.from(svg);

await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(buf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(buf).resize(32, 32).png().toFile("app/icon.png");
console.log("Ícones gerados em public/icons/ e app/icon.png");
