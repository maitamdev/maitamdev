import fs from "node:fs";

const target = process.argv[2];
if (!target) {
  throw new Error("Usage: node balance-profile-radar.mjs <profile-svg>");
}

const source = fs.readFileSync(target, "utf8");
const radarTag = source.match(
  /<polygon(?: data-scale="balanced-visual")? class="radar" points="([^"]+)">[\s\S]*?<\/polygon>/
);

if (!radarTag) {
  throw new Error(`Radar polygon was not found in ${target}`);
}

const originalPoints = radarTag[1];
const alreadyBalanced = radarTag[0].includes('data-scale="balanced-visual"');
const points = originalPoints.split(/\s+/).map((point) => {
  const [x, y] = point.split(",").map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Invalid radar point: ${point}`);
  }
  return { x, y, radius: Math.hypot(x, y) };
});

const largestRadius = Math.max(...points.map((point) => point.radius));
const innerRadius = 78;
const outerRadius = 145;
const balancedPoints = alreadyBalanced
  ? originalPoints
  : points
      .map(({ x, y, radius }) => {
        const balancedRadius =
          innerRadius + (radius / largestRadius) * (outerRadius - innerRadius);
        const scale = balancedRadius / radius;
        return `${(x * scale).toFixed(2)},${(y * scale).toFixed(2)}`;
      })
      .join(" ");

const balancedTag = radarTag[0]
  .replaceAll(originalPoints, balancedPoints)
  .replace(/<animate attributeName="points"[\s\S]*?<\/animate>/, "")
  .replace(
    '<polygon class="radar"',
    '<polygon data-scale="balanced-visual" class="radar"'
  );

const output = source.replace(radarTag[0], balancedTag);
fs.writeFileSync(target, output);
console.log(`Balanced radar chart in ${target}`);
