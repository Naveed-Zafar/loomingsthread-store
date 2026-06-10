const fs = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUPPLIER = "https://hjleather.com";
const PRODUCT_ROOT = path.join(ROOT, "public", "products");
const REQUIRED_FOLDERS = ["wallets", "cardholders", "belts", "laptop-bags", "duffle-bags", "ladies-bags", "other"];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const SAFE_DESCRIPTION = "Handmade leather product. Final material, size and price to be confirmed with supplier.";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const decode = value => String(value || "")
  .replace(/&amp;|&#038;/g, "&")
  .replace(/&#039;|&apos;/g, "'")
  .replace(/&quot;|&#8220;|&#8221;|&ldquo;|&rdquo;/g, "\"")
  .replace(/&#8217;|&rsquo;/g, "'")
  .replace(/&nbsp;/g, " ")
  .replace(/&#8360;/g, "Rs ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function slugify(value) {
  return decode(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "product";
}

function absoluteUrl(url) {
  if (!url) return null;
  let clean = decode(url).trim();
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Keep the original candidate if it is not URI-encoded cleanly.
  }
  const imageOnly = clean.match(/^(.*?\.(?:jpe?g|png|webp))/i)?.[1];
  if (imageOnly) clean = imageOnly;
  if (!clean || clean.startsWith("data:")) return null;
  try {
    return new URL(clean, SUPPLIER).href;
  } catch {
    return null;
  }
}

function fullImage(url) {
  const absolute = absoluteUrl(url);
  if (!absolute) return null;
  return absolute.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, "");
}

function imageExt(url) {
  return (new URL(url).pathname.match(/\.(jpe?g|png|webp)$/i)?.[0] || ".jpg").toLowerCase().replace(".jpeg", ".jpg");
}

function addImage(images, url) {
  const full = fullImage(url);
  if (!full || !/\.(jpe?g|png|webp)(?:\?|$)/i.test(full)) return;
  if (!images.includes(full)) images.push(full);
}

function collectImageUrls(html) {
  const images = [];
  for (const match of html.matchAll(/\b(?:src|href|data-src|data-large_image|data-thumb|content)=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi)) {
    addImage(images, match[1]);
  }
  for (const srcset of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    let value = srcset[1];
    try {
      value = decodeURIComponent(value);
    } catch {
      // srcset may already be decoded.
    }
    for (const candidate of value.split(",")) {
      addImage(images, candidate.trim().split(/\s+/)[0]);
    }
  }
  for (const escaped of html.matchAll(/https?:\\?\/\\?\/[^"'\\]+\.(?:jpe?g|png|webp)/gi)) {
    addImage(images, escaped[0].replace(/\\\//g, "/"));
  }
  return images.filter(url => /\/wp-content\/uploads\//i.test(url));
}

function supplierPrice(html) {
  const prices = [
    ...html.matchAll(/(?:&#8360;|₨|â‚¨)(?:<\/span>)?\s*([0-9,.]+)/g),
    ...decode(html).matchAll(/Rs\s*([0-9,.]+)/g)
  ].map(match => Number(match[1].replace(/,/g, ""))).filter(Boolean);
  return prices.length ? prices[prices.length - 1] : null;
}

function euroFromPkr(pkr, category, title) {
  if (!pkr) {
    if (/bag|laptop|office/i.test(`${category} ${title}`)) return 289;
    if (/holder|clip/i.test(title)) return 69;
    return 119;
  }
  return Math.max(39, Math.round((pkr / 300) + 49));
}

function folderFor(product) {
  const text = `${product.name} ${product.category}`.toLowerCase();
  if (/lad(y|ies)|women|queen|purse|hand.?bag/.test(text)) return "ladies-bags";
  if (/duffle|duffel|travel/.test(text)) return "duffle-bags";
  if (/belt/.test(text)) return "belts";
  if (/laptop|office|file|bag/.test(text)) return "laptop-bags";
  if (/card|holder|clip/.test(text)) return "cardholders";
  if (/wallet|pouch|passport|money|vegtan|wax|pullup|leather/i.test(text)) return "wallets";
  return "other";
}

function leatherType(product) {
  const text = `${product.name} ${product.category}`.toLowerCase();
  if (/veg|vegetable/.test(text)) return "Veg tan / to be confirmed";
  if (/wax|pull.?up/.test(text)) return "Wax pull-up / to be confirmed";
  if (/glace|shine/.test(text)) return "Glace finish / to be confirmed";
  if (/croc/.test(text)) return "Embossed leather / to be confirmed";
  return "To be confirmed with supplier";
}

function tagsFor(product, folder) {
  return [...new Set([
    folder.replace("-", " "),
    product.category,
    leatherType(product),
    /black/i.test(product.name) ? "black" : "",
    /brown|tan|chief|tiger|cognac/i.test(product.name) ? "brown leather" : "",
    "HJ Leather supplier reference",
    "The Leather Atelier"
  ].filter(Boolean))];
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html,application/xhtml+xml" } });
  const text = await res.text();
  return { status: res.status, text };
}

function productBlocks(html) {
  return [...html.matchAll(/<li class="[^"]*\bproduct\b[\s\S]*?<\/li>/g)].map(match => match[0]);
}

function parseProductBlock(block) {
  const link = block.match(/<a href="([^"]+)" class="woocommerce-LoopProduct-link/)?.[1]
    || block.match(/<a href="([^"]+)" class="ast-loop-product__link/)?.[1];
  const image = block.match(/<img[^>]+src="([^"]+)"/)?.[1];
  const alt = block.match(/<img[^>]+alt="([^"]*)"/)?.[1];
  const title = block.match(/woocommerce-loop-product__title">([\s\S]*?)<\/h2>/)?.[1] || alt;
  const category = block.match(/ast-woo-product-category">\s*([\s\S]*?)\s*<\/span>/)?.[1] || "Leather Goods";
  const productId = block.match(/data-product_id="([^"]+)"/)?.[1] || block.match(/post-(\d+)/)?.[1];
  if (!link || !image || !title) return null;
  const listingImages = collectImageUrls(block);
  addImage(listingImages, image);
  return {
    sourceUrl: absoluteUrl(link),
    sourceImage: fullImage(image),
    sourceImages: listingImages,
    name: decode(title),
    category: decode(category),
    supplierPrice: supplierPrice(block),
    supplierCurrency: "PKR",
    supplierProductId: productId || null
  };
}

function parseCategoryLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a href="([^"]*product-category[^"]+)">([\s\S]*?)<\/a>/g)) {
    links.push({ url: absoluteUrl(match[1]), name: decode(match[2]) });
  }
  return links.filter(link => link.url);
}

async function downloadImage(url, filePath) {
  const res = await fetch(url, { headers: { "user-agent": UA, "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await fs.writeFile(filePath, Buffer.from(await res.arrayBuffer()));
}

function productPage(product) {
  const title = `${product.name} | The Leather Atelier`;
  const image = product.mainImage || "/products/placeholder.jpg";
  const thumbs = product.images.map((src, index) => `<button class="gallery-thumb${index === 0 ? " active" : ""}" onclick="document.querySelector('.static-main-image').src='${src}'; document.querySelectorAll('.gallery-thumb').forEach(b=>b.classList.remove('active')); this.classList.add('active');"><img src="${src}" alt="${product.name} image ${index + 1}"></button>`).join("");
  const description = product.description.replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="/product/${product.slug}/">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: "The Leather Atelier" },
    sku: product.sku,
    image: product.images,
    description: product.description,
    offers: { "@type": "Offer", priceCurrency: "EUR", price: product.retailPriceEUR, availability: "https://schema.org/InStock" }
  })}</script>
</head>
<body>
  <header class="site-header"><a class="brand" href="/"><span class="brand-mark">LA</span><span><strong>The Leather Atelier</strong><small>by Looming Threads</small></span></a><nav class="nav"><a href="/#/shop">Shop</a><a href="/#/about">Atelier</a><a href="/#/contact">Kontakt</a></nav></header>
  <main>
    <section class="detail static-detail">
      <div class="product-gallery"><img class="static-main-image gallery-main-image" src="${image}" alt="${product.name}"><div class="thumbnail-row">${thumbs}</div></div>
      <div class="detail-copy">
        <p class="eyebrow">${product.category}</p>
        <h1>${product.name}</h1>
        <p class="price">EUR ${product.retailPriceEUR}</p>
        <p>${product.description}</p>
        <p><strong>Leather type:</strong> ${product.leatherType}</p>
        <p><strong>Material:</strong> ${product.material}</p>
        <p><strong>SKU:</strong> ${product.sku}</p>
        <a class="button wide" href="/#/product/${product.slug}">Im Shop ansehen</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

async function main() {
  for (const folder of REQUIRED_FOLDERS) {
    await fs.rm(path.join(PRODUCT_ROOT, folder), { recursive: true, force: true });
    await fs.mkdir(path.join(PRODUCT_ROOT, folder), { recursive: true });
  }
  await fs.rm(path.join(ROOT, "pages", "product"), { recursive: true, force: true });
  await fs.mkdir(path.join(ROOT, "pages", "product"), { recursive: true });

  const discovered = new Map();
  const categories = new Map();
  const brokenLinks = [];
  const failedImages = [];
  const manualReview = [];
  const blockedDetailPages = [];

  for (let page = 1; page <= 40; page++) {
    const url = page === 1 ? `${SUPPLIER}/store/` : `${SUPPLIER}/store/page/${page}/`;
    const { status, text } = await fetchText(url);
    if (status !== 200 || !text.includes("product type-product")) break;
    parseCategoryLinks(text).forEach(cat => categories.set(cat.url, cat.name));
    for (const block of productBlocks(text)) {
      const product = parseProductBlock(block);
      if (!product) continue;
      const existing = discovered.get(product.sourceUrl);
      if (existing) existing.sourceImages = [...new Set([...existing.sourceImages, ...product.sourceImages])];
      else discovered.set(product.sourceUrl, product);
    }
    await wait(120);
  }

  for (const url of categories.keys()) {
    const { status, text } = await fetchText(url);
    if (status !== 200) {
      brokenLinks.push({ url, status, type: "category" });
      continue;
    }
    for (const block of productBlocks(text)) {
      const product = parseProductBlock(block);
      if (!product) continue;
      const existing = discovered.get(product.sourceUrl);
      if (existing) existing.sourceImages = [...new Set([...existing.sourceImages, ...product.sourceImages])];
      else discovered.set(product.sourceUrl, product);
    }
    await wait(120);
  }

  const products = [];
  const slugCounts = new Map();
  let imageCount = 0;
  let index = 1;

  for (const raw of discovered.values()) {
    const baseSlug = slugify(raw.name);
    const nextCount = (slugCounts.get(baseSlug) || 0) + 1;
    slugCounts.set(baseSlug, nextCount);
    const slug = nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
    const folder = folderFor(raw);
    const material = "To be confirmed with supplier";
    const productDir = path.join(PRODUCT_ROOT, folder, slug);
    await fs.mkdir(productDir, { recursive: true });

    const detail = await fetchText(raw.sourceUrl);
    const detailPageBlocked = detail.status !== 200 || /Not Acceptable|Mod_Security|challenge-platform/i.test(detail.text);
    if (detailPageBlocked) {
      const blocked = { url: raw.sourceUrl, reason: `Supplier detail page returned a blocking/challenge response (HTTP ${detail.status})` };
      blockedDetailPages.push(blocked);
      manualReview.push(blocked);
    } else {
      raw.sourceImages = [...new Set([...raw.sourceImages, ...collectImageUrls(detail.text)])];
    }
    if (!raw.supplierPrice) {
      manualReview.push({ url: raw.sourceUrl, reason: "Supplier price was not visible on crawled listing page" });
    }

    const localImages = [];
    let imageIndex = 1;
    for (const sourceImage of raw.sourceImages) {
      const fileName = `image-${imageIndex}${imageExt(sourceImage)}`;
      const relPath = `/products/${folder}/${slug}/${fileName}`;
      const absPath = path.join(productDir, fileName);
      try {
        await downloadImage(sourceImage, absPath);
        localImages.push(relPath);
        imageCount++;
        imageIndex++;
      } catch (error) {
        failedImages.push({ product: raw.name, image: sourceImage, error: error.message });
      }
    }

    const product = {
      productName: raw.name,
      name: raw.name,
      slug,
      category: raw.category,
      folder,
      description: SAFE_DESCRIPTION,
      shortDescription: "Handmade leather product awaiting final supplier confirmation.",
      material,
      leatherType: leatherType(raw),
      supplierPrice: raw.supplierPrice,
      supplierCurrency: raw.supplierPrice ? raw.supplierCurrency : null,
      retailPriceEUR: euroFromPkr(raw.supplierPrice, raw.category, raw.name),
      images: localImages,
      imagePaths: localImages,
      mainImage: localImages[0] || "",
      image: localImages[0] || "",
      galleryImages: localImages.slice(1),
      imageCount: localImages.length,
      needsGalleryReview: localImages.length <= 1,
      sku: `TLA-HJ-${raw.supplierProductId || String(index).padStart(4, "0")}`,
      tags: tagsFor(raw, folder),
      sourceUrl: raw.sourceUrl,
      sourceImages: raw.sourceImages,
      needsManualReview: true,
      requiresManualReview: true,
      detailPageBlocked
    };
    products.push(product);
    index++;
  }

  await fs.writeFile(path.join(ROOT, "data", "products.json"), JSON.stringify(products, null, 2));

  const categoryData = REQUIRED_FOLDERS.map(folder => ({
    slug: folder,
    name: folder.split("-").map(part => part[0].toUpperCase() + part.slice(1)).join(" "),
    productCount: products.filter(product => product.folder === folder).length
  }));
  await fs.writeFile(path.join(ROOT, "data", "categories.json"), JSON.stringify(categoryData, null, 2));

  for (const product of products) {
    const dir = path.join(ROOT, "pages", "product", product.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), productPage(product));
  }

  const productsWithMultipleImages = products.filter(product => product.imageCount > 1);
  const productsWithOnlyOneImage = products.filter(product => product.imageCount <= 1);
  const report = {
    generatedAt: new Date().toISOString(),
    supplier: SUPPLIER,
    totalProducts: products.length,
    productsImported: products.length,
    totalImagesDownloaded: imageCount,
    imagesDownloaded: imageCount,
    productsWithMultipleImages: productsWithMultipleImages.length,
    productsWithOnlyOneImage: productsWithOnlyOneImage.length,
    failedImageDownloads: failedImages.length,
    failedImageCount: failedImages.length,
    failedImages,
    brokenLinks,
    blockedDetailPageCount: blockedDetailPages.length,
    blockedDetailPages,
    productsNeedingManualReviewCount: products.filter(product => product.needsManualReview).length,
    productsNeedingGalleryReview: productsWithOnlyOneImage.map(product => ({ slug: product.slug, name: product.name, sourceUrl: product.sourceUrl })),
    productsRequiringManualReview: manualReview,
    categoryFolders: Object.fromEntries(REQUIRED_FOLDERS.map(folder => [folder, products.filter(product => product.folder === folder).length])),
    notes: [
      "Product catalog was imported from publicly accessible WooCommerce store/category listing pages.",
      "Gallery extraction uses listing image URLs, srcset, WooCommerce image attributes, thumbnail links, og:image, and product detail HTML when accessible.",
      "Descriptions and material fields use safe placeholders because detail-page data is not required for this listing/category import.",
      "Images are downloaded locally into /public/products/[category]/[product-slug]/."
    ]
  };
  await fs.writeFile(path.join(ROOT, "data", "import-report.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(ROOT, "docs", "import-report.md"), `# HJ Leather Import Report

- Total products: ${report.totalProducts}
- Total images downloaded: ${report.totalImagesDownloaded}
- Products with multiple images: ${report.productsWithMultipleImages}
- Products with only one image: ${report.productsWithOnlyOneImage}
- Failed image downloads: ${report.failedImageDownloads}
- Blocked detail pages: ${report.blockedDetailPageCount}
- Products needing manual review: ${report.productsNeedingManualReviewCount}

## Category Folders

${Object.entries(report.categoryFolders).map(([folder, count]) => `- ${folder}: ${count}`).join("\n")}

## Notes

${report.notes.map(note => `- ${note}`).join("\n")}
`);
  console.log(JSON.stringify(report, null, 2));
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error);
  process.exit(1);
});
