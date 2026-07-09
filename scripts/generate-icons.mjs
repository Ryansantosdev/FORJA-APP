// Gera ícones PWA a partir de assets/forja-icon-source.png
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";

const source = "assets/forja-icon-source.png";
if (!existsSync(source)) {
  console.error(`Arquivo não encontrado: ${source}`);
  process.exit(1);
}

mkdirSync("public/icons", { recursive: true });

await sharp(source).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(source).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(source).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(source).resize(32, 32).png().toFile("app/icon.png");
console.log("Ícones gerados em public/icons/ e app/icon.png");
