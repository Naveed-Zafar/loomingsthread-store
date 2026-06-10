const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "products.json");
const reportPath = path.join(root, "docs", "letta-luna-cleanup-report.md");
const reportJsonPath = path.join(root, "data", "letta-luna-cleanup-report.json");

const productTypeDe = {
  Set: "Set",
  Sweatshirt: "Sweatshirt",
  Hoodie: "Hoodie",
  Jacket: "Jacke",
  Dress: "Kleid",
  Top: "Oberteil",
  "T-Shirt": "T-Shirt",
  Pants: "Hose",
  Shorts: "Shorts",
  Leggings: "Leggings",
  Romper: "Strampler",
  Vest: "Weste"
};

const ageDe = {
  Baby: "Baby",
  Toddler: "Kleinkind",
  Girls: "Maedchen",
  Boys: "Jungen",
  Unisex: "Kinder",
  Kids: "Kinder"
};

const ageEn = {
  Baby: "Baby",
  Toddler: "Toddler",
  Girls: "Girls",
  Boys: "Boys",
  Unisex: "Kids",
  Kids: "Kids"
};

const motifDe = [
  ["Printed", "bedrucktes"],
  ["Striped", "gestreiftes"],
  ["Knit", "Strick"],
  ["Number 5", "Nummer-5"],
  ["Layered", "Lagenlook"],
  ["Bear", "Baerchen"],
  ["Young Wild Free", "Young-Wild-Free"],
  ["Teddy", "Teddy"],
  ["Hooded", "Kapuzen"],
  ["Navy", "dunkelblaues"],
  ["Jogger", "Jogger"],
  ["Denim", "Denim"],
  ["Purple", "lilafarbenes"],
  ["Bicycle", "Fahrrad"],
  ["Galaxy", "Galaxy"],
  ["Yellow", "gelbes"],
  ["Graphic", "Motiv"],
  ["Cream", "cremefarbenes"],
  ["Butterfly", "Schmetterlings"],
  ["Smile", "Smile"],
  ["Red", "rotes"],
  ["Floral", "florales"],
  ["Tunic", "Tunika"],
  ["Grey", "graues"],
  ["Love", "Love"],
  ["Dino", "Dino"],
  ["Pink", "rosa"],
  ["Character", "Motiv"],
  ["Basic", "Basic"],
  ["Colorful", "buntes"],
  ["Olive", "olivfarbenes"],
  ["Car", "Auto"],
  ["Polo", "Polo"],
  ["Bodysuit", "Body"],
  ["Airplane", "Flugzeug"],
  ["Ruffle", "Volant"],
  ["Flower", "Blumen"],
  ["Fresh", "Fresh"],
  ["Pastel", "pastellfarbenes"],
  ["Be Kind", "Be-Kind"],
  ["Unicorn", "Einhorn"],
  ["Summer", "Sommer"],
  ["Lion", "Loewen"],
  ["Snowsuit", "Winteranzug"],
  ["Sherpa", "Sherpa"],
  ["Varsity", "College"],
  ["Heart", "Herz"],
  ["Camo", "Camo"],
  ["Star", "Stern"],
  ["Raincoat", "Regen"],
  ["Coral", "korallfarbenes"],
  ["Lounge", "Lounge"],
  ["Bow", "Schleifen"],
  ["Shark", "Hai"],
  ["Cool Dude", "Cool-Dude"],
  ["Wrap", "Wickel"],
  ["Skirt", "Rock"],
  ["Hope", "Hope"],
  ["Daddy Little Girl", "Daddy-Little-Girl"],
  ["Boston", "Boston"],
  ["Vehicle", "Fahrzeug"],
  ["Sport", "Sport"],
  ["Racing", "Racing"],
  ["Side Stripe", "Seitenstreifen"],
  ["Elephant", "Elefanten"],
  ["Sea Otter", "Seeotter"],
  ["Toucan", "Tukan"],
  ["Leopard", "Leoparden"],
  ["Lobster", "Hummer"],
  ["Bloom", "Blumen"],
  ["Future", "Future"],
  ["Rocket", "Raketen"],
  ["Dinosaur", "Dino"],
  ["Guitar", "Gitarren"],
  ["Neutral", "neutrales"],
  ["Colorblock", "Colorblock"]
];

const materialByType = {
  Set: "Weicher Materialmix",
  Sweatshirt: "Weicher Sweat-Mix",
  Hoodie: "Weicher Sweat-Mix",
  Jacket: "Waermender Materialmix",
  Dress: "Weicher Materialmix",
  Top: "Weicher Jersey-Mix",
  "T-Shirt": "Weicher Jersey-Mix",
  Pants: "Weicher Materialmix",
  Shorts: "Leichter Materialmix",
  Leggings: "Elastischer Materialmix",
  Romper: "Weicher Baby-Materialmix",
  Vest: "Waermender Materialmix"
};

function cleanEnglishName(name) {
  return String(name)
    .replace(/\bGallery\b/g, "")
    .replace(/\bDuo\b/g, "Set")
    .replace(/\bColor Pack\b/g, "Color Set")
    .replace(/\bMultipack\b/g, "Multi Set")
    .replace(/\bOutfit\b/g, "Set")
    .replace(/\s+/g, " ")
    .trim();
}

function descriptor(name, ageGroup, productType) {
  let value = cleanEnglishName(name)
    .replace(new RegExp(`^${ageGroup}\\s+`, "i"), "")
    .replace(/^Kids\s+/i, "")
    .replace(/^Baby\s+/i, "")
    .replace(/^Toddler\s+/i, "")
    .replace(/^Girls\s+/i, "")
    .replace(/^Boys\s+/i, "")
    .replace(new RegExp(`\\b${productType}\\b`, "ig"), "")
    .replace(productType === "Sweatshirt" ? /\bSweater\b/ig : /$a/, "")
    .replace(productType === "Top" ? /\bLong Sleeve\b/ig : /$a/, "")
    .replace(productType === "Pants" ? /\bJogger\b/ig : /$a/, "")
    .replace(/\bSet\b/ig, "")
    .replace(/\bCollection\b/ig, "")
    .replace(/\s+/g, " ")
    .trim();
  return value || "Soft Everyday";
}

function descriptorDeFromEnglish(value) {
  let result = value;
  for (const [en, de] of motifDe) {
    result = result.replace(new RegExp(`\\b${en}\\b`, "gi"), de);
  }
  return result.replace(/\s+/g, " ").trim();
}

function buildTitles(product) {
  const ageGroup = product.ageGroup || "Kids";
  const type = product.productType || typeFromName(product.name);
  const descEn = descriptor(product.name, ageGroup, type);
  const descDe = descriptorDeFromEnglish(descEn);
  const en = `${ageEn[ageGroup] || "Kids"} ${descEn} ${type}`.replace(/\s+/g, " ").trim();
  const de = `${ageDe[ageGroup] || "Kinder"} ${descDe} ${productTypeDe[type] || type}`
    .replace(/\bKapuzen Weste\b/g, "Kapuzenweste")
    .replace(/\bKapuzen Jacke\b/g, "Kapuzenjacke")
    .replace(/\bSweat Jacke\b/g, "Sweatjacke")
    .replace(/\bJogger Hose\b/g, "Jogginghose")
    .replace(/\bdunkelblaues Hose\b/g, "dunkelblaue Hose")
    .replace(/\brotes Hose\b/g, "rote Hose")
    .replace(/\bgraues Hose\b/g, "graue Hose")
    .replace(/\bgelbes Hose\b/g, "gelbe Hose")
    .replace(/\brosa Hose\b/g, "rosa Hose")
    .replace(/\bLong Sleeve Oberteil\b/g, "Langarmshirt")
    .replace(/\s+/g, " ")
    .trim();
  return { en, de };
}

function typeFromName(name) {
  return ["Sweatshirt", "Hoodie", "Jacket", "Dress", "T-Shirt", "Pants", "Shorts", "Leggings", "Romper", "Vest", "Top", "Set"]
    .find(type => new RegExp(type, "i").test(name)) || "Set";
}

function pricing(product) {
  const type = product.productType || typeFromName(product.name);
  const season = product.season || "All Season";
  let base = {
    Romper: 24.9,
    Top: 22.9,
    "T-Shirt": 19.9,
    Pants: 24.9,
    Shorts: 18.9,
    Leggings: 17.9,
    Sweatshirt: 32.9,
    Hoodie: 39.9,
    Jacket: 54.9,
    Dress: 34.9,
    Set: 44.9,
    Vest: 36.9
  }[type] || 29.9;
  if (product.ageGroup === "Baby") base -= 2;
  if (product.ageGroup === "Toddler") base += 1;
  if (["Girls", "Boys"].includes(product.ageGroup)) base += 2;
  if (["Set", "Jacket", "Vest"].includes(type)) base += 5;
  if (season === "Winter") base += 3;
  if (season === "Summer") base -= 1;
  return Math.max(16.9, Number(base.toFixed(2)));
}

function collections(product) {
  const list = ["New Arrivals"];
  if (product.ageGroup === "Baby") list.push("Baby");
  if (product.ageGroup === "Toddler") list.push("Toddler");
  if (product.ageGroup === "Girls") list.push("Girls");
  if (product.ageGroup === "Boys") list.push("Boys");
  if (product.ageGroup === "Unisex" || product.ageGroup === "Kids") list.push("Girls", "Boys");
  if (product.season === "Summer") list.push("Summer");
  if (product.season === "Winter") list.push("Winter");
  return [...new Set(list)];
}

function markMerchandising(product, index) {
  const activePool = product.active !== false && !product.needsManualReview;
  return {
    featured: activePool && index % 9 === 0,
    bestseller: activePool && [0, 8, 24, 38, 57, 62, 75, 92, 113].includes(index),
    newArrival: activePool && index < 42
  };
}

function cleanup(product, index) {
  if (product.brand !== "Letta & Luna") return product;
  const type = product.productType || typeFromName(product.name);
  const ageGroup = product.ageGroup || "Kids";
  const titles = buildTitles({ ...product, productType: type, ageGroup });
  const price = pricing({ ...product, productType: type, ageGroup });
  const inactiveManual = product.needsManualReview === true;
  const material = materialByType[type] || "Weicher Materialmix";
  const collectionList = collections({ ...product, ageGroup });
  const merch = markMerchandising(product, index);
  const deDescription = `${titles.de} von Letta & Luna: weiche Kidswear fuer bequeme Alltagslooks, Familienmomente und kleine Abenteuer. Angenehm zu tragen, leicht zu kombinieren und mit einem warmen, verspielten Markenlook.`;
  const enDescription = `${titles.en} by Letta & Luna: soft kidswear for comfortable everyday outfits, family moments and little adventures. Easy to wear, easy to style and designed with a warm, playful premium feel.`;
  return {
    ...product,
    productName: titles.en,
    name: titles.en,
    titleDe: titles.de,
    titleEn: titles.en,
    category: ageGroup === "Unisex" || ageGroup === "Kids" ? "Kids" : ageGroup,
    ageGroup,
    gender: ageGroup === "Girls" ? "Girls" : ageGroup === "Boys" ? "Boys" : "Kids",
    collection: collectionList[0],
    collections: collectionList,
    season: product.season || "All Season",
    productType: type,
    colorOptions: product.colorOptions?.length ? product.colorOptions : ["Mehrfarbig"],
    sizeOptions: product.sizeOptions?.length ? product.sizeOptions : ["92", "98", "104", "110", "116", "122", "128"],
    materialDe: material,
    materialEn: material === "Weicher Materialmix" ? "Soft fabric blend" : "Soft fabric blend",
    material,
    careInstructionsDe: "Schonwaschgang bei 30 Grad. Auf links waschen, aehnliche Farben zusammen waschen, nicht bleichen und nicht im Trockner trocknen.",
    careInstructionsEn: "Gentle wash at 30 degrees. Wash inside out with similar colors, do not bleach and do not tumble dry.",
    descriptionDe: deDescription,
    descriptionEn: enDescription,
    description: deDescription,
    shortDescription: `${titles.de} fuer weiche, bequeme Kidswear-Looks.`,
    bulletPoints: [
      "Weiche Haptik fuer den Alltag",
      "Bequeme Passform fuer Kinder",
      "Premium Kidswear von Letta & Luna"
    ],
    priceEur: price,
    retailPriceEUR: price,
    active: inactiveManual ? false : true,
    inStock: inactiveManual ? false : true,
    stockQty: inactiveManual ? 0 : Math.max(8, Number(product.stockQty || 12)),
    needsManualReview: inactiveManual,
    internalNotes: inactiveManual
      ? [...new Set([...(product.internalNotes || []), "Inactive after merchandising review: unclear collection image, placeholder-logo item or licensed-looking graphic."])]
      : (product.internalNotes || []),
    ...merch,
    tags: [...new Set(["Letta & Luna", "Kidswear", ageGroup, type, product.season || "All Season", ...collectionList])],
    seoTitle: `${titles.de} kaufen | Letta & Luna Kidswear`,
    seoDescription: `${titles.de} von Letta & Luna. Weiche Premium Kidswear fuer Baby, Kleinkinder, Maedchen und Jungen.`,
    openGraphTitle: `${titles.en} | Letta & Luna`,
    openGraphDescription: `${titles.en} from Letta & Luna: soft premium kidswear for everyday family life.`,
    openGraphImage: product.mainImage || product.images?.[0] || ""
  };
}

function main() {
  const original = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const leatherSnapshot = JSON.stringify(original.filter(product => product.brand !== "Letta & Luna"));
  const updated = original.map(cleanup);
  const leatherAfter = JSON.stringify(updated.filter(product => product.brand !== "Letta & Luna"));
  if (leatherSnapshot !== leatherAfter) {
    throw new Error("Leather products changed unexpectedly.");
  }
  fs.writeFileSync(productsPath, JSON.stringify(updated, null, 2));
  const letta = updated.filter(product => product.brand === "Letta & Luna");
  const report = {
    generatedAt: new Date().toISOString(),
    productsCleaned: letta.length,
    productsActive: letta.filter(product => product.active !== false).length,
    productsDeactivated: letta.filter(product => product.active === false).length,
    productsRequiringManualReview: letta.filter(product => product.needsManualReview).map(product => ({
      articleNumber: product.articleNumber,
      title: product.titleEn,
      slug: product.slug
    })),
    pricingStructureApplied: {
      babyItems: "Base kidswear price minus 2 EUR",
      toddlerItems: "Base kidswear price plus 1 EUR",
      boysGirlsItems: "Base kidswear price plus 2 EUR",
      setsJacketsVests: "Category premium plus 5 EUR",
      winterItems: "Season premium plus 3 EUR",
      summerItems: "Season lightwear adjustment minus 1 EUR"
    },
    collections: ["Baby", "Toddler", "Girls", "Boys", "Summer", "Winter", "New Arrivals"]
  };
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(reportPath, `# Letta & Luna Cleanup Report

- Generated: ${report.generatedAt}
- Products cleaned: ${report.productsCleaned}
- Active products: ${report.productsActive}
- Products deactivated: ${report.productsDeactivated}
- Products still requiring manual review: ${report.productsRequiringManualReview.length}

## Pricing Structure Applied

- Baby items: ${report.pricingStructureApplied.babyItems}
- Toddler items: ${report.pricingStructureApplied.toddlerItems}
- Boys/Girls items: ${report.pricingStructureApplied.boysGirlsItems}
- Sets/Jackets/Vests: ${report.pricingStructureApplied.setsJacketsVests}
- Winter items: ${report.pricingStructureApplied.winterItems}
- Summer items: ${report.pricingStructureApplied.summerItems}

## Manual Review Products

${report.productsRequiringManualReview.map(product => `- ${product.articleNumber} - ${product.title} (${product.slug})`).join("\n")}
`);
  console.log(JSON.stringify(report, null, 2));
}

main();
