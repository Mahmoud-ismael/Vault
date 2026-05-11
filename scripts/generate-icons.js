const sharp = require('sharp');

const svgTemplate = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0D0D0F" />
  <text x="50%" y="50%" font-family="serif" font-size="${size * 0.6}px" font-style="italic" fill="#38bdf8" text-anchor="middle" dominant-baseline="central">V</text>
</svg>
`;

async function generate() {
  await sharp(Buffer.from(svgTemplate(192))).png().toFile('public/icon-192.png');
  await sharp(Buffer.from(svgTemplate(512))).png().toFile('public/icon-512.png');
  console.log('Icons generated!');
}

generate();
