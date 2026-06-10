const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(projectRoot, "public");
const outputPath = path.join(projectRoot, "data", "local-image-manifest.json");
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const placeholderPattern = /\b(ai image slot|image slot|placeholder|missing image|demo image|concept image)\b/i;
const placeholderPathPattern = /(?:^|[\/_-])(placeholder|missing-image|demo-image|concept-image|image-slot)(?:[\/_.-]|$)/i;

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

function publicPath(absolutePath) {
  return `/${path.relative(publicRoot, absolutePath).split(path.sep).join("/")}`;
}

function isPlaceholderFile(absolutePath) {
  const relative = publicPath(absolutePath);
  if (placeholderPathPattern.test(relative)) return true;
  if (path.extname(absolutePath).toLowerCase() !== ".svg") return false;
  return placeholderPattern.test(fs.readFileSync(absolutePath, "utf8"));
}

const allImages = walk(publicRoot);
const placeholderImages = allImages.filter(isPlaceholderFile).map(publicPath).sort();
const placeholderSet = new Set(placeholderImages);
const validImages = allImages.map(publicPath).filter(image => !placeholderSet.has(image)).sort();

fs.writeFileSync(outputPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  validImages,
  placeholderImages,
  counts: {
    scanned: allImages.length,
    valid: validImages.length,
    placeholder: placeholderImages.length
  }
}, null, 2)}\n`);

console.log(`Image manifest written: ${validImages.length} valid, ${placeholderImages.length} placeholder images.`);
