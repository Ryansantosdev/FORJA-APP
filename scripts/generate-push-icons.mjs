/**
 * Ícones push no estilo bento do FORJA (bento-blue / bento-violet + logo).
 * Cores = app/globals.css (--color-water, --color-violet, --color-primary).
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";

const source = "assets/forja-icon-source.png";
if (!existsSync(source)) {
  console.error(`Arquivo não encontrado: ${source}`);
  process.exit(1);
}

mkdirSync("public/icons", { recursive: true });

const COLORS = {
  water: "#5eb8ff",
  violet: "#a78bfa",
  primary: "#6b8cff",
  ink: "#f5f5f7",
  muted: "#8e8e9a",
  bg: "#0a0a0c",
};

function bentoBlueBg(w, h, rx = 44) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="0%" r="90%">
        <stop offset="0%" stop-color="${COLORS.water}" stop-opacity="0.45"/>
        <stop offset="55%" stop-color="${COLORS.water}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0c1520"/>
        <stop offset="100%" stop-color="#08080a"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="${rx}" fill="url(#base)"/>
    <rect width="${w}" height="${h}" rx="${rx}" fill="url(#glow)"/>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  </svg>`;
}

function bentoVioletBg(w, h, rx = 44) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="-10%" r="100%">
        <stop offset="0%" stop-color="${COLORS.violet}" stop-opacity="0.5"/>
        <stop offset="50%" stop-color="${COLORS.violet}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#15101f"/>
        <stop offset="100%" stop-color="#08080a"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="${rx}" fill="url(#base)"/>
    <rect width="${w}" height="${h}" rx="${rx}" fill="url(#glow)"/>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  </svg>`;
}

const waterGlyph = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <path d="M96 54 C96 54 70 96 70 118 a26 26 0 0 0 52 0 C122 96 96 54 96 54z" fill="${COLORS.water}"/>
  <ellipse cx="88" cy="106" rx="7" ry="11" fill="#ffffff28"/>
</svg>`;

const fraseGlyph = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <text x="58" y="128" fill="${COLORS.violet}" font-family="Georgia,serif" font-size="72" font-weight="700">"</text>
  <text x="108" y="128" fill="${COLORS.violet}" font-family="Georgia,serif" font-size="72" font-weight="700" opacity="0.75">"</text>
</svg>`;

function bannerSvg(kind) {
  const isAgua = kind === "agua";
  const bg = isAgua ? bentoBlueBg(512, 256, 28) : bentoVioletBg(512, 256, 28);
  const accent = isAgua ? COLORS.water : COLORS.violet;
  const label = isAgua ? "ÁGUA" : "MENTE";
  const sub = isAgua ? "Hora de hidratar" : "Frase motivacional";
  const glyph = isAgua
    ? `<path d="M72 128 C72 128 52 160 52 182 a20 20 0 0 0 40 0 C92 160 72 128 72 128z" fill="${accent}"/>`
    : `<text x="56" y="142" fill="${accent}" font-family="Georgia,serif" font-size="48">"</text>`;

  return `${bg.replace("</svg>", "")}
    ${glyph}
    <text x="120" y="108" fill="${accent}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" letter-spacing="3">FORJA</text>
    <text x="120" y="142" fill="${COLORS.ink}" font-family="system-ui,sans-serif" font-size="32" font-weight="800">${label}</text>
    <text x="120" y="174" fill="${COLORS.muted}" font-family="system-ui,sans-serif" font-size="18">${sub}</text>
  </svg>`;
}

async function composeIcon(name, bgSvg, glyphSvg, logoSize = 44) {
  const bg = await sharp(Buffer.from(bgSvg)).resize(192, 192).png().toBuffer();
  const glyph = await sharp(Buffer.from(glyphSvg)).resize(192, 192).png().toBuffer();
  const logo = await sharp(source).resize(logoSize, logoSize).png().toBuffer();
  const margin = 192 - logoSize - 14;
  await sharp(bg)
    .composite([
      { input: glyph, blend: "over" },
      { input: logo, top: margin, left: margin },
    ])
    .png()
    .toFile(`public/icons/${name}`);
}

async function writeBanner(name, svg) {
  await sharp(Buffer.from(svg)).resize(512, 256).png().toFile(`public/icons/${name}`);
}

await composeIcon("push-agua.png", bentoBlueBg(192, 192), waterGlyph);
await composeIcon("push-frase.png", bentoVioletBg(192, 192), fraseGlyph);
await writeBanner("push-banner-agua.png", bannerSvg("agua"));
await writeBanner("push-banner-frase.png", bannerSvg("frase"));

console.log("Ícones push FORJA gerados (bento-blue / bento-violet).");
