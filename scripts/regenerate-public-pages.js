const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "data", "products.json");
let products = JSON.parse(fs.readFileSync(dataPath, "utf8"));

function sanitizeTitle(value) {
  return String(value || "").replace(/\bHJ\b\s*/gi, "").replace(/\s+/g, " ").trim() || "Leather Product";
}

function titleCase(value) {
  return sanitizeTitle(value).toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function cleanText(value) {
  return String(value || "")
    .replace(/\bHJ\b/gi, "")
    .replace(/supplier/gi, "atelier")
    .replace(/manufacturer/gi, "atelier")
    .replace(/PKR\s*[\d,.]*/gi, "")
    .replace(/to be confirmed with supplier/gi, "wird final geprueft")
    .replace(/to be confirmed/gi, "wird final geprueft")
    .replace(/\s+/g, " ")
    .trim();
}

function productPage(product) {
  const image = product.mainImage || (product.images && product.images[0]) || "";
  const thumbs = (product.images || []).map((src, index) => `<button class="gallery-thumb${index === 0 ? " active" : ""}" onclick="document.querySelector('.static-main-image').src='${src}';document.querySelectorAll('.gallery-thumb').forEach(b=>b.classList.remove('active'));this.classList.add('active');"><img src="${src}" alt="${product.titleDe} image ${index + 1}"></button>`).join("");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.titleDe,
    brand: { "@type": "Brand", name: "The Leather Atelier" },
    sku: product.articleNumber,
    image: product.images || [],
    description: product.descriptionDe,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.priceEur || product.retailPriceEUR,
      availability: "https://schema.org/InStock"
    }
  };
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${product.titleDe} | The Leather Atelier</title>
  <meta name="description" content="${product.descriptionDe.replace(/"/g, "&quot;")}">
  <link rel="canonical" href="/product/${product.slug}/">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <header class="site-header"><a class="brand" href="/"><span class="brand-mark">LA</span><span><strong>The Leather Atelier</strong><small>by Looming Threads</small></span></a><nav class="nav"><a href="/#/shop">Shop</a><a href="/#/about">Atelier</a><a href="/#/contact">Kontakt</a></nav></header>
  <main>
    <section class="detail static-detail">
      <div class="product-gallery">
        <button class="gallery-zoom" onclick="document.body.insertAdjacentHTML('beforeend', '<div class=&quot;zoom-modal&quot; onclick=&quot;this.remove()&quot;><img src=&quot;'+document.querySelector('.static-main-image').src+'&quot;></div>')">Zoom</button>
        <img class="static-main-image gallery-main-image" src="${image}" alt="${product.titleDe}">
        <div class="thumbnail-row">${thumbs}</div>
      </div>
      <div class="detail-copy">
        <p class="eyebrow">${product.categoryLabel || product.category}</p>
        <h1>${product.titleDe}</h1>
        <p class="price">EUR ${product.priceEur || product.retailPriceEUR}</p>
        <p>${product.descriptionDe}</p>
        <p><strong>Leather type:</strong> ${product.leatherTypeDe}</p>
        <p><strong>Material:</strong> ${product.materialDe}</p>
        <p><strong>Artikelnummer:</strong> ${product.articleNumber}</p>
        <p><strong>Masse:</strong> ${product.dimensions}</p>
        <a class="button wide" href="/#/product/${product.slug}">Im Shop ansehen</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

products = products.map(product => {
  const publicTitle = sanitizeTitle(product.name || product.productName);
  const descriptionDe = cleanText(product.descriptionDe) || `${titleCase(publicTitle)} ist ein handgefertigtes Lederaccessoire der The Leather Atelier Kollektion.`;
  const descriptionEn = cleanText(product.descriptionEn) || `${titleCase(publicTitle)} is a handmade leather piece from The Leather Atelier collection.`;
  return {
    ...product,
    productName: publicTitle,
    name: publicTitle,
    titleDe: titleCase(publicTitle),
    titleEn: titleCase(publicTitle),
    descriptionDe,
    descriptionEn,
    description: descriptionDe,
    shortDescription: cleanText(product.shortDescription) || `${titleCase(publicTitle)} ist ein handgefertigtes Lederaccessoire.`,
    bulletPoints: (product.bulletPoints || []).map(cleanText).filter(Boolean),
    materialDe: cleanText(product.materialDe) || "Leder",
    materialEn: cleanText(product.materialEn) || "Leather",
    material: cleanText(product.materialDe) || "Leder",
    leatherTypeDe: cleanText(product.leatherTypeDe) || "Echtes Leder",
    leatherTypeEn: cleanText(product.leatherTypeEn) || "Genuine leather",
    leatherType: cleanText(product.leatherTypeDe) || "Echtes Leder",
    categoryLabel: cleanText(product.categoryLabel)
  };
});

fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
fs.rmSync(path.join(root, "pages", "product"), { recursive: true, force: true });
for (const product of products) {
  const dir = path.join(root, "pages", "product", product.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), productPage(product));
}

console.log(JSON.stringify({ products: products.length, pages: products.length }, null, 2));
