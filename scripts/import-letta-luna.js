const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourceDir = process.argv[2] || "D:\\Apparel Projekt\\BiG Bro Pdf Bilder";
const productsJsonPath = path.join(projectRoot, "data", "products.json");
const reportJsonPath = path.join(projectRoot, "data", "letta-luna-import-report.json");
const reportMdPath = path.join(projectRoot, "docs", "letta-luna-import-report.md");
const dataImageRoot = path.join(projectRoot, "data", "products", "letta-luna");
const publicImageRoot = path.join(projectRoot, "public", "products", "letta-luna");

const categories = {
  Baby: ["Baby", "Toddler", "New Arrivals"],
  Toddler: ["Toddler", "New Arrivals"],
  Girls: ["Girls", "Summer", "Winter", "New Arrivals"],
  Boys: ["Boys", "Summer", "Winter", "New Arrivals"],
  Unisex: ["Baby", "Toddler", "Girls", "Boys", "New Arrivals"]
};

const sizeMap = {
  Baby: ["56", "62", "68", "74", "80", "86"],
  Toddler: ["80", "86", "92", "98", "104"],
  Girls: ["98", "104", "110", "116", "122", "128", "134"],
  Boys: ["98", "104", "110", "116", "122", "128", "134"],
  Unisex: ["92", "98", "104", "110", "116", "122", "128"]
};

const materialByType = {
  Set: "Baumwoll-Mix",
  Sweatshirt: "Baumwoll-Fleece",
  Hoodie: "Baumwoll-Fleece",
  Jacket: "Gefuetterter Baumwoll-Mix",
  Dress: "Baumwoll-Mix",
  Top: "Baumwoll-Mix",
  "T-Shirt": "Baumwoll-Jersey",
  Pants: "Baumwoll-Mix",
  Shorts: "Baumwoll-Mix",
  Leggings: "Baumwoll-Stretch",
  Romper: "Weicher Baumwoll-Mix",
  Vest: "Gefuetterter Baumwoll-Mix"
};

const products = [
  ["Boys Printed Sweatshirt Duo", "Boys", "Sweatshirt", ["B.webp"], ["Blue", "Cream"], "Winter"],
  ["Boys Striped Knit Sweater", "Boys", "Sweatshirt", ["1.jpg"], ["Red", "Navy"], "Winter"],
  ["Boys Number 5 Layered Top", "Boys", "Top", ["2.jpg"], ["Blue"], "Winter"],
  ["Baby Bear Romper", "Baby", "Romper", ["3.jpg"], ["Cream"], "Winter"],
  ["Boys Young Wild Free Long Sleeve", "Boys", "Top", ["4.jpg"], ["Green"], "Winter"],
  ["Toddler Teddy Hooded Vest", "Toddler", "Vest", ["5.jpg"], ["Beige"], "Winter"],
  ["Boys Hooded Sweat Jacket", "Boys", "Jacket", ["6.jpg"], ["Navy", "Red"], "Winter"],
  ["Boys Navy Jogger Pants", "Boys", "Pants", ["7.jpg"], ["Navy"], "Winter"],
  ["Boys Denim Pants Gallery", "Boys", "Pants", ["8.jpg", "9.jpg", "10.jpg"], ["Blue Denim"], "Winter"],
  ["Girls Purple Bicycle Tunic", "Girls", "Top", ["11.jpg"], ["Purple"], "Winter"],
  ["Boys Galaxy Sweatshirt", "Boys", "Sweatshirt", ["12.jpg"], ["Blue", "Grey"], "Winter"],
  ["Kids Yellow Graphic Hoodie", "Unisex", "Hoodie", ["13.jpg"], ["Yellow"], "Winter"],
  ["Girls Cream Butterfly Hoodie", "Girls", "Hoodie", ["14.jpg"], ["Cream"], "Winter"],
  ["Girls Smile Tracksuit", "Girls", "Set", ["15.jpg"], ["Pink", "Navy"], "Winter"],
  ["Girls Red Floral Tunic Set", "Girls", "Set", ["16.jpg"], ["Red", "White"], "Winter"],
  ["Girls Butterfly Long Sleeve Top", "Girls", "Top", ["17.jpg"], ["Red", "White"], "Winter"],
  ["Girls Grey Love Hooded Dress", "Girls", "Dress", ["18.jpg"], ["Grey"], "Winter"],
  ["Boys Navy Dino Hoodie", "Boys", "Hoodie", ["19.jpg"], ["Navy", "Multi"], "Winter"],
  ["Girls Pink Character Sweatshirt", "Girls", "Sweatshirt", ["20.jpg"], ["Pink"], "Winter"],
  ["Girls Purple Floral Sweatshirt", "Girls", "Sweatshirt", ["21.jpg"], ["Purple"], "Winter"],
  ["Kids Basic Tops Color Pack", "Unisex", "Top", ["22.jpg", "42.jpg", "43.png"], ["Multi"], "Summer"],
  ["Baby Yellow Play Set", "Baby", "Set", ["25.png"], ["Yellow"], "Summer"],
  ["Kids Colorful Clothing Rail", "Unisex", "Set", ["26.png"], ["Multi"], "Summer", true],
  ["Girls Leggings Color Set", "Girls", "Leggings", ["27.png", "45.jpg", "46.jpg"], ["Pink", "Grey", "Navy"], "All Season"],
  ["Girls Pink Sweat Set", "Girls", "Set", ["28.jpg", "29.jpg"], ["Pink"], "Winter"],
  ["Boys Bear Sailor T-Shirt", "Boys", "T-Shirt", ["30.jpg"], ["White"], "Summer"],
  ["Girls Blue Embroidered Dress", "Girls", "Dress", ["31.jpg", "35.jpg"], ["Light Blue"], "Summer"],
  ["Boys Bike Graphic T-Shirt", "Boys", "T-Shirt", ["32.jpg", "36.jpg"], ["Grey"], "Summer"],
  ["Boys Orange Bicycle T-Shirt", "Boys", "T-Shirt", ["33.jpg"], ["Orange"], "Summer"],
  ["Boys Striped Dinosaur T-Shirt", "Boys", "T-Shirt", ["34.jpg", "38.jpg"], ["Blue", "White"], "Summer"],
  ["Boys USA Sleeveless Top", "Boys", "Top", ["37.jpg"], ["Navy", "White"], "Summer"],
  ["Boys Striped Pocket T-Shirt", "Boys", "T-Shirt", ["39.jpg"], ["White", "Blue"], "Summer"],
  ["Kids Summer Shorts Set", "Unisex", "Shorts", ["40.jpg", "41.jpg"], ["Black", "Grey"], "Summer"],
  ["Kids Olive Tracksuit", "Unisex", "Set", ["43.jpg"], ["Olive"], "Winter"],
  ["Boys Car T-Shirt", "Boys", "T-Shirt", ["44.jpg"], ["Navy"], "Summer"],
  ["Kids Polo Color Pack", "Unisex", "Top", ["44.png"], ["Multi"], "Summer"],
  ["Toddler Bodysuit Multipack", "Baby", "Romper", ["46.png"], ["Multi"], "Summer"],
  ["Boys Airplane T-Shirt Set", "Boys", "T-Shirt", ["47.jpg", "48.jpg", "49.jpg"], ["Purple", "Navy", "Orange"], "Summer"],
  ["Kids Yellow Lounge Set", "Unisex", "Set", ["47.png"], ["Yellow"], "Winter"],
  ["Kids Hoodie Color Collection", "Unisex", "Hoodie", ["48.png", "60.jpg"], ["Multi"], "Winter"],
  ["Girls Ruffle Flower Dress Set", "Girls", "Dress", ["50.jpg", "51.jpg", "52.jpg"], ["Green", "Orange", "Turquoise"], "Summer"],
  ["Girls Fresh Graphic Tops", "Girls", "Top", ["53.jpg", "54.jpg"], ["Green", "Pink"], "Summer"],
  ["Kids Denim Hoodie", "Unisex", "Hoodie", ["55.jpg"], ["Blue Denim"], "Winter"],
  ["Kids Navy Basic T-Shirt", "Unisex", "T-Shirt", ["59.jpg"], ["Navy"], "Summer"],
  ["Kids Navy Tracksuit", "Unisex", "Set", ["94.avif", "110.avif", "111.avif"], ["Navy", "White"], "Winter"],
  ["Toddler Pink Jogger Pants", "Toddler", "Pants", ["95.avif"], ["Pink"], "Winter"],
  ["Boys Green Hero Tracksuit", "Boys", "Set", ["96.avif", "106.avif", "116.avif", "145.avif"], ["Black", "Red", "Yellow", "Grey"], "Winter", true],
  ["Boys Yellow Pocket T-Shirt", "Boys", "T-Shirt", ["97.avif"], ["Yellow", "White"], "Summer"],
  ["Baby Red Tank Shorts Set", "Baby", "Set", ["98.avif"], ["Red", "Grey"], "Summer", true],
  ["Kids Pastel Colorblock Set", "Unisex", "Set", ["101.avif", "104.avif", "138.avif"], ["Pastel", "Green", "Multi"], "Winter"],
  ["Kids Be Kind T-Shirt", "Unisex", "T-Shirt", ["102.avif"], ["Navy"], "Summer"],
  ["Girls Unicorn Legging Set", "Girls", "Set", ["103.webp", "137.webp"], ["Grey", "Pink"], "Winter"],
  ["Girls Pink Hoodie Jogger Set", "Girls", "Set", ["105.webp"], ["Pink"], "Winter"],
  ["Girls Pink Hoodie", "Girls", "Hoodie", ["107.webp", "144.webp"], ["Pink", "Red"], "Winter", true],
  ["Boys Red Hoodie Outfit", "Boys", "Hoodie", ["108.webp", "132.avif"], ["Red"], "Winter"],
  ["Boys Red Graphic T-Shirt", "Boys", "T-Shirt", ["109.webp", "92.avif"], ["Red"], "Summer"],
  ["Kids White Colorblock Tracksuit", "Unisex", "Set", ["112.avif"], ["White", "Grey", "Black"], "Winter"],
  ["Baby Lion Summer Set", "Baby", "Set", ["113.avif", "125.avif"], ["Yellow"], "Summer"],
  ["Toddler Snowsuit Gallery", "Toddler", "Jacket", ["114.webp", "119.webp", "124.webp", "136.avif"], ["Orange", "Green", "Navy"], "Winter"],
  ["Girls Blue Cat Dress", "Girls", "Dress", ["115.avif"], ["Blue"], "Winter"],
  ["Toddler Brown Jogger Pants", "Toddler", "Pants", ["117.avif"], ["Brown"], "Winter"],
  ["Toddler Denim Sherpa Jacket", "Toddler", "Jacket", ["118.avif"], ["Blue Denim"], "Winter"],
  ["Kids Varsity Jacket Gallery", "Unisex", "Jacket", ["120.avif", "135.avif", "143.avif"], ["Navy", "Cream", "Brown"], "Winter"],
  ["Girls Printed Leggings Duo", "Girls", "Leggings", ["121.webp", "126.webp", "163.webp", "172.webp", "177.webp"], ["Navy", "Pink", "Grey", "Blue"], "All Season"],
  ["Girls White Floral Top Set", "Girls", "Set", ["122.webp"], ["White", "Black"], "Summer"],
  ["Boys White Pocket T-Shirt", "Boys", "T-Shirt", ["123.webp"], ["White"], "Summer"],
  ["Boys Green Adventure T-Shirt", "Boys", "T-Shirt", ["128.avif"], ["Green"], "Summer"],
  ["Kids Green Camo Tracksuit", "Unisex", "Set", ["129.avif", "142.avif"], ["Green", "Black"], "Winter"],
  ["Girls Pink Star Tracksuit", "Girls", "Set", ["130.webp"], ["Pink"], "Winter"],
  ["Kids Beige Logo Tracksuit", "Unisex", "Set", ["133.webp"], ["Beige"], "Winter", true],
  ["Kids Colorblock Jogger Outfit", "Unisex", "Set", ["134.avif"], ["Navy", "Yellow", "Green"], "Winter"],
  ["Girls Pink Raincoat", "Girls", "Jacket", ["139.avif"], ["Pink"], "Winter"],
  ["Girls Coral Layered Outfit", "Girls", "Set", ["140.avif"], ["Coral", "Orange"], "Winter"],
  ["Kids Cream Lounge Outfit", "Unisex", "Set", ["141.webp"], ["Cream"], "All Season"],
  ["Boys Shark T-Shirt", "Boys", "T-Shirt", ["146.avif"], ["Grey"], "Summer"],
  ["Boys Cool Dude T-Shirt", "Boys", "T-Shirt", ["147.avif"], ["Yellow"], "Summer"],
  ["Girls Bow Legging Set", "Girls", "Set", ["148.webp", "156.webp"], ["White", "Navy"], "Winter"],
  ["Girls Pink Unicorn Legging Set", "Girls", "Set", ["149.webp", "159.webp"], ["Pink", "Navy"], "Winter"],
  ["Baby Floral Bodysuit Set", "Baby", "Set", ["150.avif", "185.avif"], ["White", "Pink"], "Summer"],
  ["Girls Pink Top Skirt Set", "Girls", "Set", ["151.avif"], ["Pink", "Black"], "Summer"],
  ["Boys Dino Summer Outfit", "Boys", "Set", ["152.jpg"], ["Grey", "Blue"], "Summer"],
  ["Girls Lavender Summer Set", "Girls", "Set", ["153.jpg"], ["Lavender"], "Summer"],
  ["Boys Navy Hope Pajama Set", "Boys", "Set", ["154.jpg"], ["Navy", "Plaid"], "Winter"],
  ["Kids Motivational T-Shirt Pack", "Unisex", "T-Shirt", ["155.jpg"], ["Black", "Cream", "White"], "Summer"],
  ["Girls Pink Hoodie Jogger Set", "Girls", "Set", ["157.avif"], ["Pink"], "Winter"],
  ["Girls Black Character T-Shirt", "Girls", "T-Shirt", ["158.webp"], ["Black"], "Summer"],
  ["Boys Daddy Little Girl Tracksuit", "Toddler", "Set", ["160.avif", "170.avif", "174.avif"], ["Beige", "Pink", "Lavender"], "Winter"],
  ["Toddler Boston Sweatshirt Set", "Toddler", "Set", ["161.avif"], ["Charcoal", "Brown"], "Winter"],
  ["Boys Red Vehicle Long Sleeve", "Boys", "Top", ["162.webp", "175.webp"], ["Red", "Blue"], "Winter"],
  ["Girls Turquoise Ruffle Sweatshirt", "Girls", "Sweatshirt", ["164.webp"], ["Turquoise"], "Winter"],
  ["Boys Yellow Sport Tracksuit", "Boys", "Set", ["165.avif"], ["Yellow", "Navy"], "Winter"],
  ["Boys Grey Racing Tracksuit", "Boys", "Set", ["166.webp", "173.webp"], ["Grey", "Red"], "Winter"],
  ["Boys Colorblock Sweater Collection", "Boys", "Top", ["167.webp", "171.avif"], ["Red", "Navy", "Cream"], "Winter"],
  ["Kids Number 23 Hoodie Set", "Unisex", "Hoodie", ["169.webp"], ["Black", "Grey", "Navy"], "Winter"],
  ["Girls Heart Leggings", "Girls", "Leggings", ["172.webp"], ["Blue"], "All Season"],
  ["Girls Tie Dye Hoodie", "Girls", "Hoodie", ["178.jpg"], ["Pastel"], "Winter"],
  ["Boys Sports Long Sleeve", "Boys", "Top", ["176.webp", "179.webp"], ["Navy"], "Winter"],
  ["Boys Lion Tracksuit", "Boys", "Set", ["181.webp", "186.webp", "189.webp"], ["Orange", "Green", "Red"], "Winter"],
  ["Kids Ribbed Turtleneck", "Unisex", "Top", ["182.avif"], ["Sage"], "Winter"],
  ["Girls Burgundy Unicorn Tracksuit", "Girls", "Set", ["183.webp"], ["Burgundy"], "Winter"],
  ["Girls Navy Cat Long Sleeve", "Girls", "Top", ["187.avif"], ["Navy"], "Winter"],
  ["Baby Mustard Trouser Set", "Baby", "Set", ["190.avif"], ["White", "Mustard"], "Summer"],
  ["Boys Navy Space Tracksuit", "Boys", "Set", ["190.webp"], ["Navy"], "Winter"],
  ["Kids Varsity Tracksuit", "Unisex", "Set", ["191.avif"], ["White", "Green", "Red"], "Winter"],
  ["Baby Pink Wrap Top", "Baby", "Top", ["191.webp"], ["Pink"], "All Season"],
  ["Girls Mint Unicorn Sweatshirt", "Girls", "Sweatshirt", ["192.webp"], ["Mint"], "Winter"],
  ["Boys Lion Animal T-Shirt", "Boys", "T-Shirt", ["200.jpg"], ["Navy"], "Summer"],
  ["Boys Sea Otter T-Shirt", "Boys", "T-Shirt", ["201.jpg"], ["Aqua"], "Summer"],
  ["Girls Elephant T-Shirt", "Girls", "T-Shirt", ["202.jpg"], ["Pink"], "Summer"],
  ["Boys Toucan T-Shirt", "Boys", "T-Shirt", ["203.jpg"], ["Cream"], "Summer"],
  ["Boys Leopard T-Shirt", "Boys", "T-Shirt", ["204.jpg"], ["Aqua"], "Summer"],
  ["Boys Lobster T-Shirt", "Boys", "T-Shirt", ["205.jpg"], ["Navy"], "Summer"],
  ["Girls Floral T-Shirt", "Girls", "T-Shirt", ["206.jpg"], ["Multi"], "Summer"],
  ["Girls Blue Floral T-Shirt", "Girls", "T-Shirt", ["207.jpg", "211.jpg"], ["Blue"], "Summer"],
  ["Girls Purple Daisy T-Shirt", "Girls", "T-Shirt", ["208.jpg"], ["Purple"], "Summer"],
  ["Girls Mint Stripe T-Shirt", "Girls", "T-Shirt", ["209.jpg"], ["Mint"], "Summer"],
  ["Girls White Bloom T-Shirt", "Girls", "T-Shirt", ["210.jpg"], ["White"], "Summer"],
  ["Toddler Striped Hoodie Outfit", "Toddler", "Set", ["24.png"], ["Green", "Navy"], "Winter"],
  ["Kids Sweatshirt Color Pack", "Unisex", "Sweatshirt", ["45.png"], ["Multi"], "Winter"],
  ["Kids Beige Hoodie Jogger Set", "Unisex", "Set", ["80.jpg"], ["Beige"], "Winter"],
  ["Girls Lavender Hoodie Jogger Set", "Girls", "Set", ["81.jpg"], ["Lavender"], "Winter"],
  ["Boys Tiger Sweatshirt", "Boys", "Sweatshirt", ["82.jpg"], ["Yellow"], "Winter"],
  ["Kids Washed Graphic T-Shirt Set", "Unisex", "T-Shirt", ["83.jpg", "84.jpg"], ["Black", "Navy"], "Summer"],
  ["Kids Classic Varsity Jacket", "Unisex", "Jacket", ["85.jpg", "86.jpg", "87.jpg"], ["Navy", "Cream"], "Winter"],
  ["Girls Elephant Skirt Set", "Girls", "Set", ["89.avif"], ["Yellow", "White"], "Summer"],
  ["Girls Pink Top Leggings Set", "Girls", "Set", ["90.webp"], ["Pink", "Black"], "Summer"],
  ["Boys Colorblock Pocket T-Shirt", "Boys", "T-Shirt", ["93.webp"], ["Green", "White"], "Summer"],
  ["Boys Black Side Stripe Jogger", "Boys", "Pants", ["127.webp"], ["Black"], "Winter"],
  ["Kids Green Future Sweatshirt", "Unisex", "Sweatshirt", ["212.avif"], ["Green"], "Winter"],
  ["Boys Rocket Sweatshirt", "Boys", "Sweatshirt", ["213.avif"], ["Navy"], "Winter"],
  ["Boys Yellow Car Sweatshirt", "Boys", "Sweatshirt", ["214.avif"], ["Yellow"], "Winter"],
  ["Boys Dinosaur Hoodie", "Boys", "Hoodie", ["215.avif"], ["Black", "Multi"], "Winter"],
  ["Kids Neutral Colorblock Sweatshirt", "Unisex", "Sweatshirt", ["216.avif"], ["Neutral"], "Winter"],
  ["Boys Guitar Hoodie", "Boys", "Hoodie", ["217.avif"], ["Navy"], "Winter"],
  ["Boys Dinosaur Sweatshirt Duo", "Boys", "Sweatshirt", ["218.avif"], ["Blue", "Grey"], "Winter"],
  ["Kids Pastel Sweatshirt Collection", "Unisex", "Sweatshirt", ["219.avif"], ["Pink", "Yellow", "Purple"], "Winter"]
];

const excludedManualReviewFiles = [
  "23.jpg", "56.jpg", "57.jpg", "58.jpg", "61.jpg", "62.jpg", "63.jpg", "64.jpg", "65.jpg", "66.jpg", "67.jpg", "68.jpg",
  "69.jpg", "70.jpg", "71.jpg", "72.jpg", "73.jpg", "74.jpg", "75.jpg", "76.jpg", "77.jpg", "78.jpg", "79.jpg", "88.avif",
  "91.avif", "99.avif", "100.avif", "131.webp", "168.webp", "180.webp", "184.webp", "188.webp",
  "191.jpg", "192.jpg", "193.jpg", "194.jpg", "195.jpg", "196.jpg", "197.jpg", "198.jpg", "199.jpg", "220.avif", "221.webp", "222.webp"
];

function slugify(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyImage(file, slug, index) {
  const ext = path.extname(file).toLowerCase() || ".jpg";
  const safeName = `image-${String(index + 1).padStart(2, "0")}${ext}`;
  const src = path.join(sourceDir, file);
  const dataDestDir = path.join(dataImageRoot, slug);
  const publicDestDir = path.join(publicImageRoot, slug);
  ensureDir(dataDestDir);
  ensureDir(publicDestDir);
  fs.copyFileSync(src, path.join(dataDestDir, safeName));
  fs.copyFileSync(src, path.join(publicDestDir, safeName));
  return `/products/letta-luna/${slug}/${safeName}`;
}

function priceFor(type) {
  return {
    Romper: 29, Top: 24, "T-Shirt": 19, Pants: 24, Shorts: 19, Leggings: 19,
    Sweatshirt: 34, Hoodie: 39, Jacket: 59, Dress: 34, Set: 49, Vest: 39
  }[type] || 29;
}

function titleDe(name) {
  return name
    .replace(/^Baby /, "Baby ")
    .replace(/^Toddler /, "Kleinkind ")
    .replace(/^Girls /, "Maedchen ")
    .replace(/^Boys /, "Jungen ")
    .replace(/^Kids /, "Kinder ");
}

function productRecord(entry, index) {
  const [name, ageGroup, productType, files, colors, season, needsManualReview = false] = entry;
  const slug = `ll-${slugify(name)}`;
  const images = files.map((file, imageIndex) => copyImage(file, slug, imageIndex));
  const collectionList = [...new Set([...(categories[ageGroup] || categories.Unisex), season === "Summer" ? "Summer" : null, season === "Winter" ? "Winter" : null].filter(Boolean))];
  const category = ageGroup === "Unisex" ? "Kids" : ageGroup;
  const material = materialByType[productType] || "Baumwoll-Mix";
  const articleNumber = `LL-${String(index + 1).padStart(4, "0")}`;
  const de = `${titleDe(name)} aus der Letta & Luna Kinderkollektion. Ein bequemes, liebevoll gestaltetes Kleidungsstueck fuer Alltag, Kita, Schule und Familienmomente.`;
  const en = `${name} from the Letta & Luna childrenswear collection. A comfortable, thoughtfully styled piece for everyday wear, nursery, school and family moments.`;
  return {
    articleNumber,
    productName: name,
    name,
    titleDe: titleDe(name),
    titleEn: name,
    slug,
    brand: "Letta & Luna",
    category,
    categoryLabel: "Letta & Luna Kidswear",
    folder: "kidswear",
    collection: collectionList[0],
    collections: collectionList,
    ageGroup,
    gender: ageGroup === "Girls" ? "Girls" : ageGroup === "Boys" ? "Boys" : "Kids",
    season,
    productType,
    colorOptions: colors,
    sizeOptions: sizeMap[ageGroup] || sizeMap.Unisex,
    materialDe: material,
    materialEn: material.replace("Baumwoll", "Cotton").replace("Weicher", "Soft").replace("Gefuetterter", "Lined"),
    material,
    leatherTypeDe: "Nicht zutreffend",
    leatherTypeEn: "Not applicable",
    leatherType: "Not applicable",
    dimensions: "Groessen nach Auswahl",
    careInstructionsDe: "Schonwaschgang bei 30 Grad. Auf links waschen, nicht bleichen und nicht im Trockner trocknen. Drucke und Applikationen schonend behandeln.",
    careInstructionsEn: "Gentle wash at 30 degrees. Wash inside out, do not bleach and do not tumble dry. Treat prints and appliques with care.",
    descriptionDe: de,
    descriptionEn: en,
    description: de,
    shortDescription: `${category} ${productType.toLowerCase()} fuer Alltag, Kita und Familienmomente.`,
    bulletPoints: [
      "Geeignet fuer komfortable Kinder-Outfits",
      "Weiche Haptik und praktische Silhouette",
      "Teil der Letta & Luna Kidswear Kollektion"
    ],
    priceEur: priceFor(productType),
    retailPriceEUR: priceFor(productType),
    images,
    mainImage: images[0],
    galleryImages: images.slice(1),
    imageCount: images.length,
    needsGalleryReview: images.length < 2,
    needsManualReview,
    active: !needsManualReview,
    inStock: !needsManualReview,
    stockQty: needsManualReview ? 0 : 12,
    featured: index < 12 && !needsManualReview,
    bestseller: [0, 8, 24, 38, 57, 62, 75].includes(index) && !needsManualReview,
    newArrival: index < 36 && !needsManualReview,
    tags: ["Letta & Luna", "Kidswear", ageGroup, productType, season, ...collectionList],
    internalNotes: needsManualReview ? ["Manual review required before activating product."] : [],
    seoTitle: `${titleDe(name)} kaufen | Letta & Luna`,
    seoDescription: `${titleDe(name)} von Letta & Luna. Kinderbekleidung fuer Baby, Maedchen und Jungen mit lokal gespeicherten Produktbildern.`,
    openGraphTitle: `${name} | Letta & Luna`,
    openGraphDescription: `${name} from the Letta & Luna childrenswear catalog.`,
    openGraphImage: images[0]
  };
}

function main() {
  if (!fs.existsSync(sourceDir)) throw new Error(`Source folder not found: ${sourceDir}`);
  ensureDir(dataImageRoot);
  ensureDir(publicImageRoot);

  const existing = JSON.parse(fs.readFileSync(productsJsonPath, "utf8"));
  const leatherProducts = existing.filter(product => product.brand !== "Letta & Luna" && !String(product.articleNumber || "").startsWith("LL-"));
  const created = products.map(productRecord);
  fs.writeFileSync(productsJsonPath, JSON.stringify([...leatherProducts, ...created], null, 2));

  const manualDir = path.join(dataImageRoot, "_manual-review");
  ensureDir(manualDir);
  const copiedManual = [];
  for (const file of excludedManualReviewFiles) {
    const src = path.join(sourceDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(manualDir, file));
      copiedManual.push(file);
    }
  }

  const usedFiles = new Set(products.flatMap(entry => entry[3]));
  const sourceFiles = fs.readdirSync(sourceDir).filter(file => fs.statSync(path.join(sourceDir, file)).isFile());
  const unusedFiles = sourceFiles.filter(file => !usedFiles.has(file) && !excludedManualReviewFiles.includes(file));
  const collectionsCreated = ["Baby", "Toddler", "Girls", "Boys", "Summer", "Winter", "New Arrivals"];
  const report = {
    generatedAt: new Date().toISOString(),
    sourceFolder: sourceDir,
    productsCreated: created.length,
    activeProducts: created.filter(product => product.active).length,
    collectionsCreated,
    imagesImported: products.reduce((sum, entry) => sum + entry[3].length, 0),
    manualReviewImagesCopied: copiedManual.length,
    productsRequiringManualReview: created.filter(product => product.needsManualReview).map(product => product.articleNumber),
    productsWithGalleries: created.filter(product => product.imageCount > 1).length,
    productsWithSingleImage: created.filter(product => product.imageCount === 1).length,
    unusedFilesForManualReview: unusedFiles,
    notes: [
      "Leather Atelier products were preserved unchanged.",
      "Unclear, licensed-looking, detail-only, adult/model mockup, or private-label placeholder files were not activated as customer products.",
      "Images were copied to data/products/letta-luna and public/products/letta-luna so product pages work from local files."
    ]
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(reportMdPath, `# Letta & Luna Import Report

- Generated: ${report.generatedAt}
- Source folder: ${report.sourceFolder}
- Products created: ${report.productsCreated}
- Active customer products: ${report.activeProducts}
- Collections created: ${report.collectionsCreated.join(", ")}
- Images imported into product galleries: ${report.imagesImported}
- Manual review images copied: ${report.manualReviewImagesCopied}
- Products requiring manual review: ${report.productsRequiringManualReview.length}
- Products with galleries: ${report.productsWithGalleries}
- Products with one image: ${report.productsWithSingleImage}

## Manual Review

The following files were copied to \`data/products/letta-luna/_manual-review\` or left out of active products because they appear unclear, licensed-looking, detail-only, private-label mockup oriented, adult/model oriented, or otherwise need business approval before sale.

${[...copiedManual, ...unusedFiles].map(file => `- ${file}`).join("\n")}

## Notes

${report.notes.map(note => `- ${note}`).join("\n")}
`);
  console.log(JSON.stringify(report, null, 2));
}

main();
