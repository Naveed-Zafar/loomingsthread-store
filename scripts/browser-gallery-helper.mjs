import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("C:/Users/R2G/Documents/Codex/2026-06-04/build-a-branded-ecommerce-website-for/work/New Leather Product Website");
const PRODUCT_ROOT = path.join(ROOT, "public", "products");
const DATA_PATH = path.join(ROOT, "data", "products.json");
const REPORT_PATH = path.join(ROOT, "data", "import-report.json");

const folderPrefixes = {
  wallets: "TLA-WAL",
  cardholders: "TLA-CRD",
  belts: "TLA-BLT",
  "laptop-bags": "TLA-BAG",
  "ladies-bags": "TLA-LAD",
  "duffle-bags": "TLA-DUF",
  other: "TLA-OTH"
};

function titleCase(value) {
  return String(value || "").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function fullImage(url) {
  if (!url) return null;
  let clean = String(url).trim();
  try { clean = decodeURIComponent(clean); } catch {}
  const imageOnly = clean.match(/^(.*?\.(?:jpe?g|png|webp))/i)?.[1];
  if (imageOnly) clean = imageOnly;
  try { clean = new URL(clean, "https://hjleather.com").href; } catch { return null; }
  return clean.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp))/i, "");
}

function imageExt(url) {
  return (new URL(url).pathname.match(/\.(jpe?g|png|webp)$/i)?.[0] || ".jpg").toLowerCase().replace(".jpeg", ".jpg");
}

function inferColors(text) {
  const value = String(text || "").toLowerCase();
  const colors = [];
  if (value.includes("black")) colors.push("Black");
  if (/brown|crunch|camel|cognac|tan|tiger/.test(value)) colors.push("Brown");
  if (value.includes("green")) colors.push("Green");
  return colors.length ? colors : ["Brown", "Black"];
}

function inferSizes(product) {
  if (product.folder === "belts") return ["90 cm", "100 cm", "110 cm"];
  if (product.folder === "laptop-bags") return ["13 inch", "15 inch"];
  if (product.folder === "duffle-bags") return ["Weekend"];
  if (/long|dollar/i.test(product.name)) return ["Long"];
  return ["Standard"];
}

function leatherType(text) {
  const value = String(text || "").toLowerCase();
  if (/veg|vegetable/.test(value)) return ["Pflanzlich gegerbtes Leder", "Vegetable-tanned leather"];
  if (/wax|pull.?up/.test(value)) return ["Wax Pull-up Leder", "Wax pull-up leather"];
  if (/glace|shine/.test(value)) return ["Glace Lederfinish", "Glace leather finish"];
  if (/croc/.test(value)) return ["Gepraegtes Leder", "Embossed leather"];
  return ["Echtes Leder", "Genuine leather"];
}

function dimensionsFrom(text) {
  const match = String(text || "").match(/\b\d+(?:\.\d+)?\s*(?:x|×)\s*\d+(?:\.\d+)?(?:\s*(?:x|×)\s*\d+(?:\.\d+)?)?\s*(?:cm|inch|inches|mm)?\b/i);
  return match ? match[0] : "Nicht angegeben";
}

function customerDescription(title, bullets, category) {
  const useful = bullets.filter(item => !/^(description|reviews|add to cart|category|sale|home|free shipping)$/i.test(item)).slice(0, 4);
  if (useful.length) return `${titleCase(title)} ist ein handgefertigtes Lederaccessoire aus der ${titleCase(category)} Kollektion. ${useful.join(" ")}`;
  return `${titleCase(title)} ist ein handgefertigtes Lederaccessoire der The Leather Atelier Kollektion, kuratiert fuer Alltag, Business und Reisen.`;
}

async function download(url, filePath) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0", "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await fs.writeFile(filePath, Buffer.from(await res.arrayBuffer()));
}

async function ensureBrowser() {
  if (!globalThis.agent) {
    const { setupBrowserRuntime } = await import("file:///C:/Users/R2G/.codex/plugins/cache/openai-bundled/browser/26.527.31326/scripts/browser-client.mjs");
    await setupBrowserRuntime({ globals: globalThis });
  }
  if (!globalThis.browser) globalThis.browser = await agent.browsers.get("iab");
  await browser.nameSession("HJ browser gallery import");
  if (!globalThis.importTab) globalThis.importTab = await browser.tabs.new();
}

async function extractProduct(url) {
  await importTab.goto(url);
  await importTab.playwright.waitForLoadState({ state: "load", timeoutMs: 20000 });
  await importTab.playwright.waitForTimeout(1200);
  return importTab.playwright.evaluate(() => {
    const abs = value => { try { return new URL(value, location.href).href; } catch { return null; } };
    const urls = [];
    const add = value => {
      if (!value) return;
      const url = abs(value);
      if (url && /\.(jpe?g|png|webp)(\?|$)/i.test(url)) urls.push(url);
    };
    document.querySelectorAll(".woocommerce-product-gallery__image a[href]").forEach(node => add(node.getAttribute("href")));
    document.querySelectorAll("img[data-large_image]").forEach(node => add(node.getAttribute("data-large_image")));
    document.querySelectorAll("img[data-src]").forEach(node => add(node.getAttribute("data-src")));
    document.querySelectorAll(".flex-control-thumbs img, .woocommerce-product-gallery img").forEach(node => add(node.getAttribute("src")));
    document.querySelectorAll(".woocommerce-product-gallery img[srcset], .flex-control-thumbs img[srcset], img.wp-post-image[srcset]").forEach(node => {
      String(node.getAttribute("srcset") || "").split(",").forEach(part => add(part.trim().split(/\s+/)[0]));
    });
    const descEl = document.querySelector("#tab-description, .woocommerce-product-details__short-description");
    const descText = (descEl?.innerText || "").trim();
    const bodyText = document.body.innerText || "";
    return {
      title: document.querySelector("h1.product_title, h1.entry-title, h1")?.textContent?.trim() || document.title.replace(/\s*-\s*$/, "").trim(),
      category: [...document.querySelectorAll(".posted_in a, nav.woocommerce-breadcrumb a")].map(node => node.textContent.trim()).filter(Boolean).pop() || "",
      descText,
      bodyText,
      bullets: descText.split(/\n+/).map(item => item.trim()).filter(item => item.length > 2 && item.length < 180),
      attrs: [...document.querySelectorAll(".woocommerce-product-attributes tr")].map(row => ({ name: row.querySelector("th")?.innerText.trim(), value: row.querySelector("td")?.innerText.trim() })).filter(item => item.name || item.value),
      imageUrls: [...new Set(urls)],
      blocked: /not acceptable|mod_security|challenge|checking your browser|access denied/i.test(bodyText)
    };
  });
}

function nextArticleNumber(products, current) {
  const prefix = folderPrefixes[current.folder] || "TLA-OTH";
  const used = products.filter(item => item.articleNumber?.startsWith(prefix)).length + 1;
  return `${prefix}-${String(used).padStart(4, "0")}`;
}

export async function runChunk(limit = 20) {
  await ensureBrowser();
  const products = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const start = products.findIndex(product => !product.articleNumber);
  if (start === -1) return { done: true, processed: 0, remaining: 0 };
  let processed = 0;
  for (let index = start; index < products.length && processed < limit; index++) {
    const old = products[index];
    const url = old.sourceUrl || old.internalSupplierSource;
    const folder = old.folder || old.category || "other";
    const slug = old.slug;
    let pageData = null;
    let extractionError = null;
    try {
      pageData = await extractProduct(url);
    } catch (error) {
      extractionError = error.message;
    }
    let sourceImages = [...new Set((pageData?.imageUrls || []).map(fullImage).filter(Boolean))];
    if (!sourceImages.length && old.sourceImage) sourceImages = [fullImage(old.sourceImage)].filter(Boolean);
    if (!sourceImages.length && old.mainImage?.startsWith("http")) sourceImages = [fullImage(old.mainImage)].filter(Boolean);
    const productDir = path.join(PRODUCT_ROOT, folder, slug);
    await fs.rm(productDir, { recursive: true, force: true });
    await fs.mkdir(productDir, { recursive: true });
    const images = [];
    const failedImages = [];
    let imageNumber = 1;
    for (const sourceImage of sourceImages) {
      const localPath = `/products/${folder}/${slug}/image-${imageNumber}${imageExt(sourceImage)}`;
      try {
        await download(sourceImage, path.join(productDir, path.basename(localPath)));
        images.push(localPath);
        imageNumber++;
      } catch (error) {
        failedImages.push({ image: sourceImage, error: error.message });
      }
    }
    const title = pageData?.title || old.name;
    const rawText = `${title} ${pageData?.category || old.category || ""} ${pageData?.descText || ""} ${(pageData?.bullets || []).join(" ")}`;
    const [leatherTypeDe, leatherTypeEn] = leatherType(rawText);
    const dimensions = dimensionsFrom(rawText);
    products[index] = {
      articleNumber: old.articleNumber || nextArticleNumber(products, { folder }),
      productName: title,
      name: title,
      titleDe: titleCase(title),
      titleEn: titleCase(title),
      slug,
      category: folder,
      categoryLabel: pageData?.category || old.categoryLabel || old.category || folder,
      folder,
      descriptionDe: customerDescription(title, pageData?.bullets || [], pageData?.category || old.category || folder),
      descriptionEn: `${titleCase(title)} is a handmade leather piece from The Leather Atelier collection, curated for everyday use, business and travel.`,
      description: customerDescription(title, pageData?.bullets || [], pageData?.category || old.category || folder),
      shortDescription: customerDescription(title, pageData?.bullets || [], pageData?.category || old.category || folder).split(".")[0] + ".",
      bulletPoints: pageData?.bullets || [],
      materialDe: "Leder",
      materialEn: "Leather",
      material: "Leder",
      leatherTypeDe,
      leatherTypeEn,
      leatherType: leatherTypeDe,
      dimensions,
      colorOptions: inferColors(rawText),
      sizeOptions: inferSizes({ ...old, folder, name: title }),
      careInstructionsDe: "Mit einem weichen, trockenen Tuch reinigen. Vor dauerhafter Naesse, Hitze und direkter Sonneneinstrahlung schuetzen. Lederpflege sparsam verwenden.",
      careInstructionsEn: "Clean with a soft dry cloth. Protect from prolonged moisture, heat and direct sunlight. Use leather care products sparingly.",
      priceEur: old.retailPriceEUR || old.priceEur || 119,
      retailPriceEUR: old.retailPriceEUR || old.priceEur || 119,
      images,
      imagePaths: images,
      mainImage: images[0] || "",
      image: images[0] || "",
      galleryImages: images.slice(1),
      imageCount: images.length,
      needsGalleryReview: images.length <= 1,
      needsManualReview: !!extractionError || pageData?.blocked || images.length <= 1 || dimensions === "Nicht angegeben",
      detailPageBlocked: !!extractionError || pageData?.blocked || false,
      attributes: pageData?.attrs || [],
      internalSupplierSource: url,
      internalSupplierPricePkr: old.internalSupplierPricePkr ?? old.supplierPrice ?? null,
      internalNotes: [extractionError ? `Browser detail extraction failed: ${extractionError}` : "", images.length <= 1 ? "Only one gallery image found" : "", dimensions === "Nicht angegeben" ? "Dimensions missing" : "", failedImages.length ? `${failedImages.length} gallery downloads failed` : ""].filter(Boolean),
      failedImages
    };
    processed++;
  }
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2));
  const remaining = products.filter(product => !product.articleNumber).length;
  return { done: remaining === 0, processed, remaining, completed: products.length - remaining };
}

export async function finalizeReport() {
  const products = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const report = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalImagesDownloaded: products.reduce((sum, product) => sum + (product.images?.length || 0), 0),
    productsWithMultipleImages: products.filter(product => (product.images?.length || 0) > 1).length,
    productsWithOnlyOneImage: products.filter(product => (product.images?.length || 0) === 1).length,
    failedDownloads: products.reduce((sum, product) => sum + (product.failedImages?.length || 0), 0),
    failedImageDownloads: products.reduce((sum, product) => sum + (product.failedImages?.length || 0), 0),
    blockedPages: products.filter(product => product.detailPageBlocked).length,
    missingDescriptions: products.filter(product => !product.descriptionDe || !product.descriptionEn).length,
    missingDimensions: products.filter(product => !product.dimensions || product.dimensions === "Nicht angegeben").length,
    missingMaterials: products.filter(product => !product.materialDe || !product.materialEn).length,
    productsNeedingManualReview: products.filter(product => product.needsManualReview).length,
    productsNeedingGalleryReview: products.filter(product => product.needsGalleryReview).length
  };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(ROOT, "docs", "import-report.md"), `# Import Report\n\n- Total products: ${report.totalProducts}\n- Total images downloaded: ${report.totalImagesDownloaded}\n- Products with multiple gallery images: ${report.productsWithMultipleImages}\n- Products with only one image: ${report.productsWithOnlyOneImage}\n- Failed downloads: ${report.failedDownloads}\n- Blocked pages: ${report.blockedPages}\n- Missing descriptions: ${report.missingDescriptions}\n- Missing dimensions: ${report.missingDimensions}\n- Missing materials: ${report.missingMaterials}\n- Products needing manual review: ${report.productsNeedingManualReview}\n`);
  return report;
}
