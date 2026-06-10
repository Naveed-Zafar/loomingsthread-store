const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "products.json");
const reportPath = path.join(root, "docs", "curated-fashion-brands-report.md");
const reportJsonPath = path.join(root, "data", "curated-fashion-brands-report.json");

const imageSlots = ["hero", "front", "back", "detail", "lifestyle"];

const brandConfig = {
  denim: {
    brand: "Custom Denim Studio",
    prefix: "CDS",
    folder: "denim",
    category: "Denim",
    publicRoot: path.join(root, "public", "products", "custom-denim-studio"),
    dataRoot: path.join(root, "data", "products", "custom-denim-studio"),
    color: "#17365d",
    accent: "#b38a52",
    tone: "denim heritage, urban, indigo, industrial"
  },
  apparel: {
    brand: "LoomingsThread Apparel",
    prefix: "LTA",
    folder: "apparel",
    category: "Apparel",
    publicRoot: path.join(root, "public", "products", "loomingsthread-apparel"),
    dataRoot: path.join(root, "data", "products", "loomingsthread-apparel"),
    color: "#2f302d",
    accent: "#d8c8ac",
    tone: "contemporary fashion, clean premium, minimalist"
  }
};

const denimProducts = [
  ...[
    ["Archive Straight Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Raw Indigo"], ["30/32", "31/32", "32/32", "33/32", "34/32"], 129],
    ["Selvedge Slim Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Dark Indigo"], ["29/32", "30/32", "31/32", "32/32", "33/32"], 139],
    ["Relaxed Taper Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Rinsed Indigo"], ["30/32", "31/32", "32/32", "34/32", "36/32"], 119],
    ["Urban Carpenter Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Washed Blue"], ["30", "32", "34", "36"], 139],
    ["Black Rinse Slim Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Black Rinse"], ["30/32", "31/32", "32/32", "34/32"], 109],
    ["Travel Stretch Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Deep Blue"], ["30/32", "31/32", "32/32", "34/32", "36/32"], 125],
    ["Worker Straight Jean", "Jeans", "Men's Denim", "Men", "Autumn Winter", ["Twill Blue"], ["30", "32", "34", "36"], 135],
    ["Five Pocket Raw Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Raw Indigo"], ["30/32", "31/32", "32/32", "34/32"], 149],
    ["Ecru Slim Jean", "Jeans", "Men's Denim", "Men", "Spring Summer", ["Ecru"], ["30/32", "31/32", "32/32", "34/32"], 109],
    ["Heritage Blue Trucker Jean", "Jeans", "Men's Denim", "Men", "All Season", ["Heritage Blue"], ["30/32", "31/32", "32/32", "34/32"], 125],
    ["High Rise Straight Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Mid Blue"], ["26", "27", "28", "29", "30", "31"], 119],
    ["Cropped Barrel Jean", "Jeans", "Women's Denim", "Women", "Spring Summer", ["Soft Ecru"], ["26", "27", "28", "29", "30"], 119],
    ["Pleated Denim Trouser Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Deep Indigo"], ["26", "27", "28", "29", "30"], 135],
    ["High Rise Wide Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Soft Black"], ["26", "27", "28", "29", "30"], 125],
    ["Soft Flare Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Deep Blue"], ["26", "27", "28", "29", "30"], 119],
    ["Relaxed White Denim Jean", "Jeans", "Women's Denim", "Women", "Spring Summer", ["White"], ["26", "27", "28", "29", "30"], 115],
    ["Washed Indigo Utility Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Washed Indigo"], ["26", "27", "28", "29", "30"], 129],
    ["Clean Black Wide Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Clean Black"], ["26", "27", "28", "29", "30"], 125],
    ["Vintage Blue Straight Jean", "Jeans", "Women's Denim", "Women", "Spring Summer", ["Vintage Blue"], ["26", "27", "28", "29", "30"], 119],
    ["Ink Blue Tailored Jean", "Jeans", "Women's Denim", "Women", "All Season", ["Ink Blue"], ["26", "27", "28", "29", "30"], 145]
  ],
  ...[
    ["Vintage Wash Denim Jacket", "Denim Jackets", "Jackets", "Unisex", "Spring Summer", ["Vintage Blue"], ["XS", "S", "M", "L", "XL"], 149],
    ["Raw Denim Trucker Jacket", "Denim Jackets", "Jackets", "Men", "All Season", ["Raw Indigo"], ["S", "M", "L", "XL"], 159],
    ["Ecru Chore Denim Jacket", "Denim Jackets", "Jackets", "Unisex", "Spring Summer", ["Ecru"], ["XS", "S", "M", "L", "XL"], 159],
    ["Indigo Field Denim Jacket", "Denim Jackets", "Jackets", "Men", "Autumn Winter", ["Dark Indigo"], ["S", "M", "L", "XL"], 179],
    ["Tailored Denim Blazer Jacket", "Denim Jackets", "Jackets", "Women", "All Season", ["Ink Blue"], ["XS", "S", "M", "L"], 189],
    ["Denim Coach Jacket", "Denim Jackets", "Jackets", "Unisex", "Spring Summer", ["Navy Denim"], ["S", "M", "L", "XL"], 149],
    ["Longline Denim Coat Jacket", "Denim Jackets", "Jackets", "Women", "Autumn Winter", ["Washed Black"], ["XS", "S", "M", "L"], 219],
    ["Clean Black Denim Jacket", "Denim Jackets", "Jackets", "Unisex", "All Season", ["Clean Black"], ["XS", "S", "M", "L", "XL"], 155],
    ["Patch Pocket Denim Vest Jacket", "Denim Jackets", "Jackets", "Unisex", "Spring Summer", ["Mid Blue"], ["XS", "S", "M", "L", "XL"], 119],
    ["Industrial Zip Denim Jacket", "Denim Jackets", "Jackets", "Men", "Autumn Winter", ["Blue Black"], ["S", "M", "L", "XL"], 169]
  ],
  ...[
    ["Utility Denim Shirt", "Denim Shirts", "Shirts", "Men", "All Season", ["Indigo"], ["S", "M", "L", "XL"], 99],
    ["Raw Denim Overshirt", "Denim Shirts", "Shirts", "Men", "Autumn Winter", ["Raw Indigo"], ["S", "M", "L", "XL"], 139],
    ["Soft Denim Shirt Dress", "Denim Shirts", "Shirts", "Women", "Spring Summer", ["Light Blue"], ["XS", "S", "M", "L"], 129],
    ["Indigo Popover Denim Shirt", "Denim Shirts", "Shirts", "Unisex", "Spring Summer", ["Indigo"], ["XS", "S", "M", "L", "XL"], 119],
    ["Structured Denim Overshirt", "Denim Shirts", "Shirts", "Women", "All Season", ["Blue Black"], ["XS", "S", "M", "L"], 139],
    ["Weekend Denim Overshirt", "Denim Shirts", "Shirts", "Men", "Autumn Winter", ["Rinsed Blue"], ["S", "M", "L", "XL"], 145],
    ["Cotton Denim Field Shirt", "Denim Shirts", "Shirts", "Unisex", "All Season", ["Light Indigo"], ["XS", "S", "M", "L", "XL"], 95],
    ["Washed Western Denim Shirt", "Denim Shirts", "Shirts", "Men", "All Season", ["Washed Blue"], ["S", "M", "L", "XL"], 109],
    ["Cropped Denim Shirt", "Denim Shirts", "Shirts", "Women", "Spring Summer", ["Mid Blue"], ["XS", "S", "M", "L"], 99],
    ["Minimal Denim Shirt Jacket", "Denim Shirts", "Shirts", "Unisex", "All Season", ["Black Indigo"], ["XS", "S", "M", "L", "XL"], 129]
  ]
];

const apparelProducts = [
  ...Array.from({ length: 20 }, (_, index) => {
    const names = ["Brushed Fleece Hoodie", "Premium Zip Hoodie", "Boxy Studio Hoodie", "Travel Tech Hoodie", "Heavyweight Loopback Hoodie", "Minimal Logo Hoodie", "Relaxed Sunday Hoodie", "Clean Rib Hem Hoodie", "Soft Modal Hoodie", "Urban Layer Hoodie", "Compact Cotton Hoodie", "Double Face Hoodie", "Essential Oversized Hoodie", "Warm Core Hoodie", "Modern Drawcord Hoodie", "Quiet Luxury Hoodie", "Interlock Jersey Hoodie", "Washed Cotton Hoodie", "Athletic Rib Hoodie", "Signature Capsule Hoodie"];
    return [names[index], "Hoodies", index % 3 === 0 ? "Women" : index % 3 === 1 ? "Men" : "Unisex", index % 4 < 2 ? "Autumn Winter" : "All Season", ["Black", "Navy", "Oatmeal", "Grey Melange", "Stone"][index % 5], ["XS", "S", "M", "L", "XL"], 79 + (index % 5) * 5];
  }),
  ...Array.from({ length: 20 }, (_, index) => {
    const names = ["Relaxed Fleece Sweatshirt", "Quiet Logo Sweatshirt", "Structured Milano Sweatshirt", "Soft Crew Sweatshirt", "Compact Rib Sweatshirt", "Heavy Cotton Sweatshirt", "Minimal Studio Sweatshirt", "Travel Crew Sweatshirt", "Everyday Loopback Sweatshirt", "Boxy Crop Sweatshirt", "Refined Raglan Sweatshirt", "Clean Athletic Sweatshirt", "Warm Brushed Sweatshirt", "Premium Jersey Sweatshirt", "Modern Mock Neck Sweatshirt", "Signature Crew Sweatshirt", "Washed Black Sweatshirt", "Layering Sweatshirt", "Soft Volume Sweatshirt", "Capsule Sweatshirt"];
    return [names[index], "Sweatshirts", index % 4 === 0 ? "Women" : index % 4 === 1 ? "Men" : "Unisex", index % 3 === 0 ? "Autumn Winter" : "All Season", ["Heather Grey", "Black", "Cream", "Graphite", "Taupe"][index % 5], ["XS", "S", "M", "L", "XL"], 69 + (index % 5) * 5];
  }),
  ...Array.from({ length: 20 }, (_, index) => {
    const names = ["Compact Cotton T-Shirt", "Premium Heavyweight T-Shirt", "Essential Long Sleeve T-Shirt", "Mercerized Jersey T-Shirt", "Relaxed Crew T-Shirt", "Fine Rib T-Shirt", "Washed Cotton T-Shirt", "Clean V-Neck T-Shirt", "Soft Modal T-Shirt", "Boxy Studio T-Shirt", "Travel Jersey T-Shirt", "Minimal Stripe T-Shirt", "Tailored Fit T-Shirt", "Organic Touch T-Shirt", "Compact Pocket T-Shirt", "Refined Pique T-Shirt", "Layering Long Sleeve T-Shirt", "Airy Summer T-Shirt", "Structured Cotton T-Shirt", "Signature Capsule T-Shirt"];
    return [names[index], "T-Shirts", index % 3 === 0 ? "Women" : index % 3 === 1 ? "Men" : "Unisex", index % 4 === 0 ? "Spring Summer" : "All Season", ["White", "Black", "Stone", "Navy", "Off White"][index % 5], ["XS", "S", "M", "L", "XL"], 35 + (index % 5) * 5];
  }),
  ...[
    ["Tailored Jersey Blazer", "Women's Collection", "Women", "All Season", "Black", ["XS", "S", "M", "L"], 159],
    ["Soft Rib Tank", "Women's Collection", "Women", "Spring Summer", "Ivory", ["XS", "S", "M", "L"], 35],
    ["Oversized Oxford Shirt", "Women's Collection", "Women", "All Season", "Blue Stripe", ["XS", "S", "M", "L"], 95],
    ["Wide Leg Tailored Trouser", "Women's Collection", "Women", "All Season", "Stone", ["34", "36", "38", "40", "42"], 129],
    ["Cotton Cashmere Cardigan", "Women's Collection", "Women", "Autumn Winter", "Cream", ["XS", "S", "M", "L"], 139],
    ["Soft Modal Top", "Women's Collection", "Women", "All Season", "Ivory", ["XS", "S", "M", "L"], 59],
    ["Pleated Midi Skirt", "Women's Collection", "Women", "All Season", "Black", ["34", "36", "38", "40"], 119],
    ["Fluid Satin Shirt", "Women's Collection", "Women", "All Season", "Champagne", ["XS", "S", "M", "L"], 105],
    ["Compact Knit Dress", "Women's Collection", "Women", "Autumn Winter", "Chocolate", ["XS", "S", "M", "L"], 149],
    ["Tailored Bermuda Short", "Women's Collection", "Women", "Spring Summer", "Sand", ["34", "36", "38", "40"], 79],
    ["Soft Column Dress", "Women's Collection", "Women", "Spring Summer", "Ecru", ["XS", "S", "M", "L"], 119],
    ["Soft Wide Sweatpant", "Women's Collection", "Women", "Autumn Winter", "Oatmeal", ["XS", "S", "M", "L"], 89],
    ["Draped Jersey Blouse", "Women's Collection", "Women", "All Season", "Ivory", ["XS", "S", "M", "L"], 85],
    ["Minimal Travel Parka", "Women's Collection", "Women", "Autumn Winter", "Olive", ["XS", "S", "M", "L"], 229],
    ["Ribbed Merino Turtleneck", "Women's Collection", "Women", "Autumn Winter", "Cream", ["XS", "S", "M", "L"], 119],
    ["Tailored Utility Vest", "Women's Collection", "Women", "All Season", "Sand", ["XS", "S", "M", "L"], 139],
    ["Fine Gauge Knit Polo", "Women's Collection", "Women", "All Season", "Charcoal", ["XS", "S", "M", "L"], 99],
    ["Double Face Zip Jacket", "Women's Collection", "Women", "Autumn Winter", "Stone", ["XS", "S", "M", "L"], 169],
    ["Linen Blend Overshirt", "Women's Collection", "Women", "Spring Summer", "Natural", ["XS", "S", "M", "L"], 115],
    ["Signature Capsule Set", "Women's Collection", "Women", "All Season", "Black", ["XS", "S", "M", "L"], 199]
  ].map(row => [row[0], row[1], row[2], row[3], [row[4]], row[5], row[6]])
];

function slugify(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" }[char]));
}

function productKind(collection) {
  if (collection === "Jeans") return "Jeans";
  if (collection === "Denim Jackets") return "Denim Jacket";
  if (collection === "Denim Shirts") return "Denim Shirt";
  if (collection === "Hoodies") return "Hoodie";
  if (collection === "Sweatshirts") return "Sweatshirt";
  if (collection === "T-Shirts") return "T-Shirt";
  return "Women's Apparel";
}

function brandPath(brand) {
  return brand.folder === "denim" ? "custom-denim-studio" : "loomingsthread-apparel";
}

function placeholderSvg(product, brand, slot, index) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#f5f1ea"/>
  <rect x="92" y="110" width="1016" height="1280" rx="18" fill="#fffaf4" stroke="${brand.accent}" stroke-width="4"/>
  <rect x="168" y="210" width="864" height="840" rx="28" fill="${brand.color}" opacity="0.96"/>
  <path d="M360 344h480l88 178-90 48-58-86v480H420V484l-58 86-90-48 88-178z" fill="#fffaf4" opacity="${brand.folder === "denim" ? "0.82" : "0.9"}"/>
  <path d="M430 486h340" stroke="${brand.accent}" stroke-width="${index === 3 ? "24" : "14"}" stroke-linecap="round"/>
  <path d="M430 572h340" stroke="${brand.accent}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>
  <circle cx="600" cy="790" r="${index === 4 ? "150" : "112"}" fill="${brand.accent}" opacity="0.2"/>
  <text x="600" y="1160" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#201812">${escapeXml(product.name)}</text>
  <text x="600" y="1235" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" letter-spacing="5" fill="#6b5b50">${escapeXml(brand.brand)}</text>
  <text x="600" y="1300" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#8a796d">AI image slot: ${escapeXml(slot)}</text>
</svg>`;
}

function writeGallery(product, brand) {
  const publicDir = path.join(brand.publicRoot, product.slug);
  const dataDir = path.join(brand.dataRoot, product.slug);
  ensureDir(publicDir);
  ensureDir(dataDir);
  return imageSlots.map((slot, index) => {
    const filename = `${slot}.svg`;
    const svg = placeholderSvg(product, brand, slot, index);
    fs.writeFileSync(path.join(publicDir, filename), svg);
    fs.writeFileSync(path.join(dataDir, filename), svg);
    return `/products/${brandPath(brand)}/${product.slug}/${filename}`;
  });
}

function descriptionDe(brand, product) {
  if (brand.folder === "denim") {
    return `${product.name} aus der Custom Denim Studio Kollektion. Ein AI-ready Denim-Produkt mit klarer Silhouette, urbaner Indigo-Aesthetik und vorbereiteten Bildslots fuer Hero, Front, Back, Detail und Lifestyle.`;
  }
  return `${product.name} aus der LoomingsThread Apparel Kollektion. Ein AI-ready Premium-Fashion-Produkt mit cleanem Look, moderner Passform und vorbereiteten Bildslots fuer Hero, Front, Back, Detail und Lifestyle.`;
}

function descriptionEn(brand, product) {
  if (brand.folder === "denim") {
    return `${product.name} from Custom Denim Studio. An AI-ready denim product with a clean silhouette, urban indigo mood and prepared image slots for hero, front, back, detail and lifestyle views.`;
  }
  return `${product.name} from LoomingsThread Apparel. An AI-ready premium fashion product with a clean look, modern fit and prepared image slots for hero, front, back, detail and lifestyle views.`;
}

function record(row, brand, index) {
  let name;
  let collection;
  let subCollection;
  let gender;
  let season;
  let colors;
  let sizes;
  let price;

  if (row.length === 7) {
    [name, collection, gender, season, colors, sizes, price] = row;
    subCollection = collection;
  } else {
    [name, collection, subCollection, gender, season, colors, sizes, price] = row;
  }

  colors = Array.isArray(colors) ? colors : [colors];
  sizes = Array.isArray(sizes) ? sizes : [sizes];
  const slug = `${brand.prefix.toLowerCase()}-${slugify(name)}`;
  const kind = productKind(collection);
  const articleNumber = `${brand.prefix}-${kind.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3)}-${String(index + 1).padStart(4, "0")}`;
  const shell = { name, slug };
  const images = writeGallery(shell, brand);
  const collections = [...new Set(["New Arrivals", collection, subCollection, gender === "Women" ? "Women's Collection" : "Men's Collection", season])].filter(Boolean);
  return {
    articleNumber,
    sku: articleNumber,
    productName: name,
    name,
    titleDe: name,
    titleEn: name,
    slug,
    brand: brand.brand,
    category: collection,
    categoryLabel: `${brand.brand} ${collection}`,
    folder: brand.folder,
    collection,
    collections,
    gender,
    ageGroup: "Adult",
    season,
    productType: kind,
    colorOptions: colors,
    sizeOptions: sizes,
    materialDe: brand.folder === "denim" ? "Denim-Materialmix" : "Premium Materialmix",
    materialEn: brand.folder === "denim" ? "Denim fabric blend" : "Premium fabric blend",
    material: brand.folder === "denim" ? "Denim-Materialmix" : "Premium Materialmix",
    leatherTypeDe: "Nicht zutreffend",
    leatherTypeEn: "Not applicable",
    leatherType: "Not applicable",
    dimensions: "Groesse nach Auswahl",
    careInstructionsDe: "Schonend waschen, auf links drehen, aehnliche Farben zusammen waschen und lufttrocknen.",
    careInstructionsEn: "Wash gently inside out with similar colors and air dry.",
    descriptionDe: descriptionDe(brand, { name }),
    descriptionEn: descriptionEn(brand, { name }),
    description: descriptionDe(brand, { name }),
    shortDescription: brand.folder === "denim" ? `${name} mit urbaner Denim-Aesthetik und AI-ready Bildstruktur.` : `${name} mit cleaner Premium-Aesthetik und AI-ready Bildstruktur.`,
    bulletPoints: ["AI-ready Produktstruktur", "Hero, Front, Back, Detail und Lifestyle Bildslots", "Launch-Preis als Platzhalter"],
    priceEur: price,
    retailPriceEUR: price,
    images,
    mainImage: images[0],
    heroImage: images[0],
    frontImage: images[1],
    backImage: images[2],
    detailImages: [images[3]],
    lifestyleImage: images[4],
    galleryImages: images.slice(1),
    thumbnailImages: images,
    imageSlots: {
      hero: images[0],
      front: images[1],
      back: images[2],
      detail: images[3],
      lifestyle: images[4]
    },
    imageCount: images.length,
    needsGalleryReview: true,
    needsManualReview: false,
    active: true,
    inStock: true,
    stockQty: 10,
    featured: index < 8,
    bestseller: index % 9 === 0,
    newArrival: index < 16,
    styleTags: [brand.tone, collection, subCollection, gender, season, kind].filter(Boolean),
    tags: [brand.brand, brand.category, collection, subCollection, gender, season, kind, ...colors].filter(Boolean),
    seoTitle: `${name} kaufen | ${brand.brand}`,
    seoDescription: `${name} aus der ${brand.brand} Kollektion. AI-ready Premium ${collection} mit vorbereiteten Bildslots und Launch-Preis.`,
    openGraphTitle: `${name} | ${brand.brand}`,
    openGraphDescription: `${name} from ${brand.brand}. AI-ready premium fashion product prepared for future generated or studio imagery.`,
    openGraphImage: images[0],
    internalNotes: ["AI-ready starter catalog product. Replace placeholder SVG slots with generated or studio imagery before launch."]
  };
}

function main() {
  const original = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const preserved = original.filter(product => !["Custom Denim Studio", "LoomingsThread Apparel"].includes(product.brand));
  const denim = denimProducts.map((row, index) => record(row, brandConfig.denim, index));
  const apparel = apparelProducts.map((row, index) => record(row, brandConfig.apparel, index));
  const updated = [...preserved, ...denim, ...apparel];
  fs.writeFileSync(productsPath, JSON.stringify(updated, null, 2));
  const summary = {
    generatedAt: new Date().toISOString(),
    totalProducts: updated.length,
    preservedLeatherAtelierProducts: preserved.filter(product => product.brand !== "Letta & Luna").length,
    preservedLettaLunaProducts: preserved.filter(product => product.brand === "Letta & Luna").length,
    customDenimStudioProducts: denim.length,
    customDenimStructure: {
      jeans: denim.filter(product => product.collection === "Jeans").length,
      denimJackets: denim.filter(product => product.collection === "Denim Jackets").length,
      denimShirts: denim.filter(product => product.collection === "Denim Shirts").length
    },
    loomingsthreadApparelProducts: apparel.length,
    apparelStructure: {
      hoodies: apparel.filter(product => product.collection === "Hoodies").length,
      sweatshirts: apparel.filter(product => product.collection === "Sweatshirts").length,
      tShirts: apparel.filter(product => product.collection === "T-Shirts").length,
      womensApparel: apparel.filter(product => product.collection === "Women's Collection").length
    },
    galleryPlaceholderImages: (denim.length + apparel.length) * imageSlots.length,
    imageSlots
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2));
  fs.writeFileSync(reportPath, `# Curated Fashion Brands Expansion Report

- Generated: ${summary.generatedAt}
- Total products after expansion: ${summary.totalProducts}
- The Leather Atelier products preserved: ${summary.preservedLeatherAtelierProducts}
- Letta & Luna products preserved: ${summary.preservedLettaLunaProducts}
- Custom Denim Studio products created: ${summary.customDenimStudioProducts}
  - Jeans: ${summary.customDenimStructure.jeans}
  - Denim Jackets: ${summary.customDenimStructure.denimJackets}
  - Denim Shirts: ${summary.customDenimStructure.denimShirts}
- LoomingsThread Apparel products created: ${summary.loomingsthreadApparelProducts}
  - Hoodies: ${summary.apparelStructure.hoodies}
  - Sweatshirts: ${summary.apparelStructure.sweatshirts}
  - T-Shirts: ${summary.apparelStructure.tShirts}
  - Women's Apparel: ${summary.apparelStructure.womensApparel}
- Gallery placeholder images created: ${summary.galleryPlaceholderImages}
- AI image slots per product: ${summary.imageSlots.join(", ")}

## Collection Structure

Custom Denim Studio:
- New Arrivals
- Jeans
- Denim Jackets
- Denim Shirts
- Men's Denim
- Women's Denim

LoomingsThread Apparel:
- Hoodies
- Sweatshirts
- T-Shirts
- Women's Collection
- Men's Collection
- New Arrivals
- Bestsellers

## Notes

- Products are AI-ready starter records with stable image slots.
- Placeholder galleries are local SVG files.
- Replace placeholder slots with generated/studio images later without changing product JSON structure.
`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
