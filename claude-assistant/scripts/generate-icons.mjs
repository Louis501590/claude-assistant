// Generates all PWA / iOS icons from one SVG. Run: npm run icons
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const out = new URL("../public/icons/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(out, { recursive: true });

// `pad` shrinks the artwork to stay inside the maskable safe zone.
const svg = (pad = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="90%"><stop offset="0" stop-color="#0b1a3a"/><stop offset="1" stop-color="#050816"/></radialGradient>
    <radialGradient id="core" cx="35%" cy="25%" r="80%"><stop offset="0" stop-color="#1b3a66"/><stop offset="1" stop-color="#0a1128"/></radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${1 - pad}) translate(-256 -256)">
    <circle cx="256" cy="256" r="190" fill="none" stroke="#A8B2D1" stroke-opacity=".25" stroke-width="3"/>
    <circle cx="256" cy="256" r="150" fill="none" stroke="#00D4FF" stroke-width="5" stroke-linecap="round" stroke-dasharray="150 800" transform="rotate(-70 256 256)"/>
    <circle cx="256" cy="256" r="104" fill="url(#core)" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
    <g stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none">
      <rect x="236" y="206" width="40" height="66" rx="20"/>
      <path d="M214 258a42 42 0 0 0 84 0M256 300v22"/>
    </g>
  </g>
</svg>`;

const jobs = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["icon-maskable-512.png", 512, 0.2],
  ["apple-touch-icon.png", 180, 0],
];
for (const [name, size, pad] of jobs) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(out + name);
  console.log("wrote", name);
}
