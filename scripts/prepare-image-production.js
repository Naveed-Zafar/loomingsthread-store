const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const productsPath = path.join(projectRoot, "data", "products.json");
const queuePath = path.join(projectRoot, "data", "image-production-queue.json");
const requiredViews = ["front", "back", "side", "detail", "lifestyle"];
const affectedBrands = new Set(["Custom Denim Studio", "LoomingsThread Apparel"]);
const expectedQueue = {
  "Custom Denim Studio": {
    Jeans: 20,
    "Denim Jackets": 10,
    "Denim Shirts": 10
  },
  "LoomingsThread Apparel": {
    Hoodies: 20,
    Sweatshirts: 20,
    "T-Shirts": 20,
    "Women's Collection": 20
  }
};

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const queue = [];

const updated = products.map(product => {
  if (!affectedBrands.has(product.brand)) return product;

  const isBoardExtraction = product.sourceType === "catalog-board";
  const expectedCount = expectedQueue[product.brand]?.[product.collection];
  const readyForGeneration = !isBoardExtraction && Boolean(expectedCount);
  const gallery = Object.fromEntries(requiredViews.map(view => [view, null]));
  const next = {
    ...product,
    imageQuality: "needs-regeneration",
    imageStatus: readyForGeneration ? "queued" : "board-source-disabled",
    readyForGeneration,
    requiredGalleryViews: requiredViews,
    missingViews: requiredViews,
    gallery,
    publicImageStatus: "Image pending",
    internalImageNotes: isBoardExtraction
      ? "Catalog-board extraction disabled from storefront. Retained for internal reference only."
      : "Queued for Shopify-quality photography generation."
  };

  if (readyForGeneration) {
    queue.push({
      productId: product.slug,
      articleNumber: product.articleNumber || product.sku || "",
      product: product.titleEn || product.name,
      brand: product.brand,
      category: product.collection,
      requiredViews,
      missingViews: requiredViews,
      imageStatus: "queued",
      imageQuality: "needs-regeneration",
      readyForGeneration: true,
      outputFolder: `/products/${product.brand === "Custom Denim Studio" ? "custom-denim-studio" : "loomingsthread-apparel"}/${product.slug}/`
    });
  }
  return next;
});

for (const [brand, categories] of Object.entries(expectedQueue)) {
  for (const [category, expected] of Object.entries(categories)) {
    const actual = queue.filter(item => item.brand === brand && item.category === category).length;
    if (actual !== expected) {
      throw new Error(`${brand} / ${category}: expected ${expected} queue items, found ${actual}.`);
    }
  }
}

fs.writeFileSync(productsPath, `${JSON.stringify(updated, null, 2)}\n`);
fs.writeFileSync(queuePath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  requiredViews,
  total: queue.length,
  byBrand: {
    "Custom Denim Studio": queue.filter(item => item.brand === "Custom Denim Studio").length,
    "LoomingsThread Apparel": queue.filter(item => item.brand === "LoomingsThread Apparel").length
  },
  products: queue
}, null, 2)}\n`);

console.log(`Prepared ${queue.length} products for image generation. Marked ${updated.filter(product => affectedBrands.has(product.brand)).length} affected products as needs-regeneration.`);
