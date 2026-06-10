let rawProducts = [];
let products = [];
let localImageManifest = { validImages: [], placeholderImages: [] };
let validLocalImagePaths = new Set();
let placeholderImagePaths = new Set();
let adminEdits = JSON.parse(localStorage.getItem("atelierAdminProductEdits") || "{}");
let adminSettings = JSON.parse(localStorage.getItem("atelierAdminSettings") || "null") || {
  storeName: "The Leather Atelier",
  storeEmail: "hello@leatheratelier.de",
  whatsapp: "+49 000 000000",
  vat: 19,
  shippingGermany: 5.9,
  shippingAustria: 9.9,
  shippingBelgium: 11.9,
  shippingNetherlands: 11.9,
  shippingLuxembourg: 10.9,
  freeShippingThreshold: 250,
  currency: "EUR",
  defaultProfitMargin: 55,
  payments: defaultPaymentSettings(),
  shipping: defaultShippingSettings()
};
adminSettings.payments = { ...defaultPaymentSettings(), ...(adminSettings.payments || {}) };
adminSettings.shipping = { ...defaultShippingSettings(), ...(adminSettings.shipping || {}) };
let lang = localStorage.getItem("atelierLang") || "de";
let cart = JSON.parse(localStorage.getItem("atelierCart") || "[]");
let wishlist = JSON.parse(localStorage.getItem("atelierWishlist") || "[]");
let currentGalleryIndex = 0;
let currentGalleryImages = [];
let touchStartX = 0;
let recentlyViewed = JSON.parse(localStorage.getItem("atelierRecentlyViewed") || "[]");
let accountProfile = JSON.parse(localStorage.getItem("atelierAccountProfile") || "null");
let accountAddresses = JSON.parse(localStorage.getItem("atelierAccountAddresses") || "[]");
let discountCode = localStorage.getItem("atelierDiscountCode") || "";
let orders = JSON.parse(localStorage.getItem("atelierOrders") || "[]");
let purchaseOrders = JSON.parse(localStorage.getItem("atelierPurchaseOrders") || "[]");
let suppliers = JSON.parse(localStorage.getItem("atelierSuppliers") || "[]");
let productReviews = JSON.parse(localStorage.getItem("loomingsthreadProductReviews") || "{}");
let wholesaleApplications = JSON.parse(localStorage.getItem("loomingsthreadWholesaleApplications") || "[]");
let productionRequests = JSON.parse(localStorage.getItem("loomingsthreadProductionRequests") || "[]");
let contactInquiries = JSON.parse(localStorage.getItem("loomingsthreadContactInquiries") || "[]");
let crmLeads = JSON.parse(localStorage.getItem("loomingsthreadCrmLeads") || "[]");
let newsletterSubscribers = normalizeNewsletterSubscribers(JSON.parse(localStorage.getItem("atelierNewsletterSignups") || "[]"));
let commerceAnalytics = JSON.parse(localStorage.getItem("loomingsthreadCommerceAnalytics") || "null") || {
  productViews: {},
  cartAdds: {},
  wishlistAdds: {},
  sessions: 0,
  lastVisitAt: ""
};
let aiProductDrafts = JSON.parse(localStorage.getItem("loomingsthreadAiProductDrafts") || "[]");
let launchReadiness = JSON.parse(localStorage.getItem("loomingsthreadLaunchReadiness") || "null") || {
  faviconReady: false,
  domainPurchased: false,
  dnsConfigured: false,
  sslActive: false,
  emailInfo: false,
  emailSupport: false,
  emailWholesale: false,
  legalImpressum: false,
  legalPrivacy: false,
  legalTerms: false,
  legalWithdrawal: false,
  legalCookies: false,
  marketingAnalytics: false,
  marketingSearchConsole: false,
  marketingMetaPixel: false,
  marketingPinterest: false,
  marketingNewsletter: false,
  socialInstagram: false,
  socialFacebook: false,
  socialPinterest: false,
  socialTiktok: false,
  customerSupportReady: false
};
let launchTaskMeta = JSON.parse(localStorage.getItem("loomingsthreadLaunchTaskMeta") || "{}");
const app = document.querySelector("#app");
const crmStatuses = ["New", "Contacted", "Negotiating", "Approved", "Lost"];
const brandSegments = ["All LoomingsThread brands", "The Leather Atelier", "Letta & Luna", "Custom Denim Studio", "LoomingsThread Apparel"];

function normalizeNewsletterSubscribers(items) {
  return (Array.isArray(items) ? items : []).map((item, index) => typeof item === "string" ? {
    id: `NEWS-${index}-${item.toLowerCase()}`,
    email: item,
    brand: "All LoomingsThread brands",
    tags: ["Website"],
    status: "Subscribed",
    createdAt: new Date().toISOString()
  } : {
    brand: "All LoomingsThread brands",
    tags: [],
    status: "Subscribed",
    createdAt: new Date().toISOString(),
    ...item
  });
}

const copy = {
  de: {
    navShop: "Shop", navAbout: "Atelier", navContact: "Kontakt", cart: "Warenkorb",
    footerText: "Kuratiertes Lederhandwerk, verantwortungsvoll bezogen und fuer Europa inszeniert.",
    add: "In den Warenkorb", details: "Details ansehen", search: "Suchen", all: "Alle", checkout: "Zur Kasse",
    empty: "Dein Warenkorb ist noch leer.", continue: "Weiter einkaufen", total: "Summe", order: "Bestellung abschliessen",
    wish: "Wunschliste", saved: "Gespeichert"
  },
  en: {
    navShop: "Shop", navAbout: "Atelier", navContact: "Contact", cart: "Cart",
    footerText: "Curated leather craft, shaped for Europe.",
    add: "Add to cart", details: "View details", search: "Search", all: "All", checkout: "Checkout",
    empty: "Your cart is empty.", continue: "Continue shopping", total: "Total", order: "Place order",
    wish: "Wishlist", saved: "Saved"
  }
};

const euro = value => new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-DE", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const t = key => copy[lang][key] || key;
const titleCase = value => String(value || "").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const getProduct = id => products.find(product => product.slug === id || product.sku === id);
const mainImage = product => product.mainImage || product.image || product.images?.[0] || "";
const productImages = product => product.images?.length ? product.images : [mainImage(product)].filter(Boolean);
const normalizeImagePath = value => {
  const imagePath = String(value || "").trim().split(/[?#]/)[0].replace(/\\/g, "/");
  return imagePath && !imagePath.startsWith("/") ? `/${imagePath}` : imagePath;
};
const conceptProductPattern = /\b(ai[- ]ready|ai image slot|prepared image slots?|bildslots?|concept[- ]only|concept product|launch-preis als platzhalter)\b/i;
const isConceptProduct = product => Boolean(product && (
  product.conceptOnly === true ||
  product.isConceptProduct === true ||
  product.isDemoFutureProduct === true ||
  ["concept", "draft", "ai-concept"].includes(String(product.productStatus || product.status || product.sourceType || "").toLowerCase()) ||
  conceptProductPattern.test([
    product.description,
    product.descriptionDe,
    product.descriptionEn,
    product.shortDescription,
    ...(product.bulletPoints || [])
  ].filter(Boolean).join(" "))
));
function publicProductEligibility(product) {
  if (!product) return { eligible: false, reason: "Missing product" };
  if (product.active !== true || product.deleted === true) return { eligible: false, reason: "Inactive" };
  if (product.imageQuality === "needs-regeneration") return { eligible: false, reason: "Image regeneration required" };
  if (["Custom Denim Studio", "LoomingsThread Apparel"].includes(product.brand) && product.sourceType === "catalog-board") {
    return { eligible: false, reason: "Catalog-board image disabled" };
  }
  if (isConceptProduct(product)) return { eligible: false, reason: "Concept product" };
  const image = normalizeImagePath(mainImage(product));
  if (!image) return { eligible: false, reason: "Image pending" };
  if (placeholderImagePaths.has(image) || /(?:^|[\/_-])(placeholder|missing-image|demo-image|concept-image|image-slot)(?:[\/_.-]|$)/i.test(image)) {
    return { eligible: false, reason: "Image pending" };
  }
  if (!validLocalImagePaths.has(image)) return { eligible: false, reason: "Image pending" };
  return { eligible: true, reason: "Public" };
}
function isPublicProduct(product) {
  return publicProductEligibility(product).eligible;
}
const publicProducts = () => products.filter(isPublicProduct);
const publicProductImages = product => [...new Set([
  mainImage(product),
  ...(product.images || []),
  ...(product.galleryImages || [])
].map(normalizeImagePath).filter(Boolean))]
  .filter(image => validLocalImagePaths.has(image) && !placeholderImagePaths.has(image));
const productPrice = product => product?.saleActive && Number(product.salePriceEur) > 0 ? Number(product.salePriceEur) : Number(product?.priceEur || product?.retailPriceEUR || 0);
const regularPrice = product => Number(product?.priceEur || product?.retailPriceEUR || 0);
const productSeoTitle = product => product.seoTitle || `${titleCase(product.name)} kaufen | Premium Lederwaren`;
const productSeoDescription = product => product.seoDescription || `${titleCase(product.name)} von ${product.brand || "LoomingsThread"}. ${shortDescription(product)} Premium Fashion und Lifestyle fuer Deutschland und Europa.`;
const productOgTitle = product => product.openGraphTitle || productSeoTitle(product);
const productOgDescription = product => product.openGraphDescription || productSeoDescription(product);
const productOgImage = product => product.openGraphImage || mainImage(product);
const publicCartEntries = () => cart.map((item, index) => ({ item, index, product: getProduct(item.id) })).filter(entry => isPublicProduct(entry.product));
const cartCount = () => publicCartEntries().reduce((sum, entry) => sum + entry.item.qty, 0);
const cartSubtotal = () => publicCartEntries().reduce((sum, entry) => {
  const { item, product } = entry;
  return sum + productPrice(product) * item.qty;
}, 0);
const cartDiscount = () => /^ATELIER10$/i.test(discountCode.trim()) ? cartSubtotal() * 0.1 : 0;
const carrierOptions = ["DHL", "Hermes", "DPD", "UPS", "FedEx"];
const shippingZoneKeys = ["germany", "austria", "belgium", "netherlands", "luxembourg", "eu", "international"];
const shippingZoneLabels = {
  germany: "Germany",
  austria: "Austria",
  belgium: "Belgium",
  netherlands: "Netherlands",
  luxembourg: "Luxembourg",
  eu: "EU Zone",
  international: "International"
};
const checkoutCountries = [
  { country: "Deutschland", zone: "germany" },
  { country: "Oesterreich", zone: "austria" },
  { country: "Belgien", zone: "belgium" },
  { country: "Niederlande", zone: "netherlands" },
  { country: "Luxemburg", zone: "luxembourg" },
  { country: "EU Zone", zone: "eu" },
  { country: "International", zone: "international" }
];
const countryZone = country => checkoutCountries.find(item => item.country === country)?.zone || "international";
const shippingZone = country => {
  const zone = countryZone(country);
  return { ...(adminSettings.shipping?.[zone] || defaultShippingSettings()[zone]), zone, label: shippingZoneLabels[zone] };
};
const shippingPrice = country => {
  const zone = shippingZone(country);
  if (zone.enabled === false) return 0;
  return cartSubtotal() - cartDiscount() >= Number(zone.freeThreshold || 0) ? 0 : Number(zone.price || 0);
};
const shippingEstimate = country => shippingZone(country).estimate || "3-6 Werktage";
const shippingMethods = country => {
  const zone = shippingZone(country);
  if (zone.enabled === false) return [];
  const carriers = zone.carriers?.length ? zone.carriers : ["DHL"];
  return carriers.map(carrier => ({
    id: `${zone.zone}-${carrier}`,
    label: `${carrier} Standard`,
    carrier,
    zone: zone.zone,
    zoneLabel: zone.label,
    country,
    estimate: zone.estimate,
    price: shippingPrice(country)
  }));
};
const selectedShippingMethod = country => shippingMethods(country)[0] || { id: "none", label: "Shipping unavailable", carrier: "", zone: countryZone(country), zoneLabel: shippingZone(country).label, country, estimate: "", price: 0 };
const cartTotal = (country = "Deutschland") => Math.max(0, cartSubtotal() - cartDiscount()) + shippingPrice(country);
const vatAmount = (country = "Deutschland") => cartTotal(country) * (adminSettings.vat / 100) / (1 + adminSettings.vat / 100);

function defaultShippingSettings() {
  return {
    germany: { enabled: true, price: 5.9, freeThreshold: 250, estimate: "2-4 Werktage", carriers: ["DHL", "Hermes", "DPD"] },
    austria: { enabled: true, price: 9.9, freeThreshold: 300, estimate: "3-6 Werktage", carriers: ["DHL", "UPS"] },
    belgium: { enabled: true, price: 11.9, freeThreshold: 300, estimate: "3-6 Werktage", carriers: ["DHL", "DPD"] },
    netherlands: { enabled: true, price: 11.9, freeThreshold: 300, estimate: "3-6 Werktage", carriers: ["DHL", "DPD"] },
    luxembourg: { enabled: true, price: 10.9, freeThreshold: 300, estimate: "3-6 Werktage", carriers: ["DHL", "UPS"] },
    eu: { enabled: true, price: 14.9, freeThreshold: 350, estimate: "4-8 Werktage", carriers: ["DHL", "UPS", "FedEx"] },
    international: { enabled: true, price: 29.9, freeThreshold: 500, estimate: "7-14 Werktage", carriers: ["DHL", "UPS", "FedEx"] }
  };
}

function defaultPaymentSettings() {
  return {
    paypalEnabled: true,
    paypalClientId: "PAYPAL_CLIENT_ID_PLACEHOLDER",
    stripeEnabled: true,
    stripePublishableKey: "STRIPE_PUBLISHABLE_KEY_PLACEHOLDER",
    klarnaEnabled: true,
    klarnaMerchantId: "KLARNA_MERCHANT_ID_PLACEHOLDER",
    bankTransferEnabled: true,
    bankAccountOwner: "Looming Threads - The Leather Atelier",
    iban: "DE00 0000 0000 0000 0000 00",
    bic: "DEMOBANKXXX",
    bankName: "Demo Bank",
    paymentInstructionText: "Bitte ueberweise den Gesamtbetrag innerhalb von 7 Tagen unter Angabe der Bestellnummer."
  };
}

function paymentMethods() {
  const payments = adminSettings.payments || defaultPaymentSettings();
  return [
    { id: "paypal", label: "PayPal", enabled: payments.paypalEnabled, notice: "PayPal ist vorbereitet. Die Zahlung wird vor dem Livegang final aktiviert." },
    { id: "stripe", label: "Stripe / Credit Card", enabled: payments.stripeEnabled, notice: "Kartenzahlung ist vorbereitet. Die Zahlung wird vor dem Livegang final aktiviert." },
    { id: "klarna", label: "Klarna", enabled: payments.klarnaEnabled, notice: "Klarna ist vorbereitet. Die Zahlung wird vor dem Livegang final aktiviert." },
    { id: "bankTransfer", label: "Vorkasse / Bank Transfer", enabled: payments.bankTransferEnabled, notice: payments.paymentInstructionText }
  ].filter(method => method.enabled);
}

function paymentMethodById(id) {
  return paymentMethods().find(method => method.id === id) || paymentMethods()[0] || { id: "none", label: "Payment unavailable", notice: "No demo payment method is enabled." };
}

function bankTransferBlock(order) {
  if (order.paymentProvider !== "bankTransfer") return "";
  const payments = adminSettings.payments || defaultPaymentSettings();
  return `<article class="payment-instructions"><h3>Bank Transfer / Vorkasse</h3><p>${payments.paymentInstructionText}</p><dl><div><dt>Account owner</dt><dd>${payments.bankAccountOwner}</dd></div><div><dt>IBAN</dt><dd>${payments.iban}</dd></div><div><dt>BIC</dt><dd>${payments.bic}</dd></div><div><dt>Bank</dt><dd>${payments.bankName}</dd></div><div><dt>Reference</dt><dd>${order.orderNumber}</dd></div></dl></article>`;
}

function paymentNoticeBlock(order) {
  if (order.paymentProvider === "bankTransfer") return bankTransferBlock(order);
  return `<article class="payment-instructions"><h3>Payment status</h3><p>Diese Zahlungsart ist vorbereitet und wird vor dem Livegang final aktiviert.</p></article>`;
}

function saveState() {
  localStorage.setItem("atelierCart", JSON.stringify(cart));
  localStorage.setItem("atelierWishlist", JSON.stringify(wishlist));
  localStorage.setItem("atelierRecentlyViewed", JSON.stringify(recentlyViewed));
  localStorage.setItem("atelierDiscountCode", discountCode);
  localStorage.setItem("atelierOrders", JSON.stringify(orders));
  document.querySelector("#cartCount").textContent = cartCount();
  document.querySelector("#wishlistCount").textContent = publicProducts().filter(product => wishlist.includes(product.slug)).length;
}

function saveAccountProfile(profile) {
  accountProfile = profile;
  localStorage.setItem("atelierAccountProfile", JSON.stringify(profile));
}

function saveAccountAddresses() {
  localStorage.setItem("atelierAccountAddresses", JSON.stringify(accountAddresses));
}

function applyAdminEdits() {
  const edited = rawProducts.map(product => ({ ...product, ...adminEdits[product.slug] }));
  const additions = Object.values(adminEdits).filter(edit => edit.isAdminNew && !rawProducts.some(product => product.slug === edit.slug));
  const demoProducts = demoBrandProducts().filter(product => !rawProducts.some(item => item.slug === product.slug) && !additions.some(item => item.slug === product.slug));
  products = [...edited, ...additions, ...demoProducts].map(product => ({
    active: true,
    stockQty: 10,
    inStock: true,
    saleActive: false,
    featured: false,
    bestseller: false,
    newArrival: false,
    ...product,
    brand: product.brand || "The Leather Atelier",
    gender: product.gender || (["ladies-bags"].includes(product.folder) ? "Women" : "Unisex"),
    ageGroup: product.ageGroup || "Adult",
    collection: product.collection || (product.brand === "The Leather Atelier" || !product.brand ? "Leather Goods" : product.category || "Lifestyle"),
    season: product.season || "All Season",
    styleTags: product.styleTags?.length ? product.styleTags : [product.folder, product.category, product.brand].filter(Boolean),
    category: product.brand === "The Leather Atelier" || !product.brand ? "Leather" : product.category,
    images: product.images?.length ? product.images : [product.mainImage].filter(Boolean),
    mainImage: product.mainImage || product.images?.[0] || "",
    seoTitle: product.seoTitle || `${titleCase(product.name)} kaufen | The Leather Atelier`,
    seoDescription: product.seoDescription || `${titleCase(product.name)} aus der ${product.brand || "LoomingsThread"} Kollektion. Premium Fashion, Lederwaren und Lifestyle fuer Deutschland.`,
    openGraphTitle: product.openGraphTitle || `${titleCase(product.name)} | LoomingsThread`,
    openGraphDescription: product.openGraphDescription || product.shortDescription || product.descriptionDe || "Premium Produkte von LoomingsThread.",
    openGraphImage: product.openGraphImage || product.mainImage || product.images?.[0] || ""
  })).map(product => {
    const eligibility = publicProductEligibility(product);
    return {
      ...product,
      publicImageStatus: eligibility.eligible ? "Public" : "Image pending",
      publicVisibilityReason: eligibility.reason
    };
  });
}

function saveAdminEdits() {
  localStorage.setItem("atelierAdminProductEdits", JSON.stringify(adminEdits));
  applyAdminEdits();
  saveState();
}

function saveAdminSettings() {
  localStorage.setItem("atelierAdminSettings", JSON.stringify(adminSettings));
}

function slugify(value) {
  return String(value || "product").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`;
}

function createSku(folder) {
  const prefix = { wallets: "TLA-WAL", cardholders: "TLA-CRD", belts: "TLA-BLT", "laptop-bags": "TLA-BAG", "duffle-bags": "TLA-DUF", "ladies-bags": "TLA-LAD", kidswear: "LL-KID", denim: "CDS-DEN", apparel: "LTA-APP" }[folder] || "TLA-OTH";
  const count = products.filter(product => product.articleNumber?.startsWith(prefix)).length + 1;
  return `${prefix}-${String(count).padStart(4, "0")}`;
}

const brandDefinitions = {
  "the-leather-atelier": {
    name: "The Leather Atelier",
    logo: "/logo/the-leather-atelier.svg",
    colors: ["#15110e", "#8b4b24", "#c7935f", "#f7f2ec"],
    focus: "Leather goods, bags, belts and accessories",
    story: "Premium leather essentials shaped for business, travel and everyday European life.",
    collection: "Leather",
    imageFolder: "laptop-bags"
  },
  "letta-luna": {
    name: "Letta & Luna",
    logo: "/logo/letta-luna.svg",
    colors: ["#4a2d2a", "#8d5a55", "#f3d9cf", "#fff8f1"],
    focus: "Kidswear, baby clothing, boys and girls",
    story: "Soft, considered childrenswear with calm colors, practical silhouettes and family-ready comfort.",
    collection: "Kidswear",
    imageFolder: "kidswear"
  },
  "custom-denim-studio": {
    name: "Custom Denim Studio",
    logo: "/logo/custom-denim-studio.svg",
    colors: ["#071427", "#0d2747", "#526d89", "#e8edf2"],
    focus: "Custom jeans, denim jackets and made-to-measure denim",
    story: "A denim workshop concept for personal fits, durable fabrics and custom details.",
    collection: "Denim",
    imageFolder: "duffle-bags"
  },
  "loomingsthread-apparel": {
    name: "LoomingsThread Apparel",
    logo: "/logo/loomingsthread-apparel.svg",
    colors: ["#242522", "#62645f", "#b7b5ad", "#f1efe9"],
    focus: "Men, women, hoodies, sweatshirts, T-shirts and fashion basics",
    story: "Elevated essentials for a modern wardrobe, designed to sit beside leather goods and denim.",
    collection: "Apparel",
    imageFolder: "wallets"
  }
};

const collectionDefinitions = {
  leather: { title: "Leather", matcher: product => product.brand === "The Leather Atelier" || product.category === "Leather" || ["wallets","cardholders","belts","laptop-bags","duffle-bags","ladies-bags"].includes(product.folder) },
  kidswear: { title: "Kidswear", matcher: product => product.brand === "Letta & Luna" || product.ageGroup === "Kids" || product.ageGroup === "Baby" },
  denim: { title: "Denim", matcher: product => product.brand === "Custom Denim Studio" || /denim/i.test(`${product.collection} ${product.name}`) },
  jeans: { title: "Jeans", matcher: product => product.brand === "Custom Denim Studio" && product.collection === "Jeans" },
  "denim-jackets": { title: "Denim Jackets", matcher: product => product.brand === "Custom Denim Studio" && product.collection === "Denim Jackets" },
  "denim-shirts": { title: "Denim Shirts", matcher: product => product.brand === "Custom Denim Studio" && product.collection === "Denim Shirts" },
  "mens-denim": { title: "Men's Denim", matcher: product => product.brand === "Custom Denim Studio" && (product.collections || []).includes("Men's Denim") },
  "womens-denim": { title: "Women's Denim", matcher: product => product.brand === "Custom Denim Studio" && (product.collections || []).includes("Women's Denim") },
  hoodies: { title: "Hoodies", matcher: product => product.brand === "LoomingsThread Apparel" && product.collection === "Hoodies" },
  sweatshirts: { title: "Sweatshirts", matcher: product => product.brand === "LoomingsThread Apparel" && product.collection === "Sweatshirts" },
  "t-shirts": { title: "T-Shirts", matcher: product => product.brand === "LoomingsThread Apparel" && product.collection === "T-Shirts" },
  "womens-apparel": { title: "Women's Collection", matcher: product => product.brand === "LoomingsThread Apparel" && (product.collections || []).includes("Women's Collection") },
  "mens-apparel": { title: "Men's Collection", matcher: product => product.brand === "LoomingsThread Apparel" && (product.collections || []).includes("Men's Collection") },
  "apparel-new-arrivals": { title: "Apparel New Arrivals", matcher: product => product.brand === "LoomingsThread Apparel" && product.newArrival },
  "apparel-bestsellers": { title: "Apparel Bestsellers", matcher: product => product.brand === "LoomingsThread Apparel" && product.bestseller },
  men: { title: "Men", matcher: product => product.gender === "Men" || product.gender === "Unisex" },
  women: { title: "Women", matcher: product => product.gender === "Women" || product.gender === "Unisex" },
  accessories: { title: "Accessories", matcher: product => /accessor|wallet|card|belt/i.test(`${product.collection} ${product.folder} ${product.name}`) },
  "new-arrivals": { title: "New Arrivals", matcher: product => product.newArrival || product.isDemoFutureProduct },
  bestsellers: { title: "Bestsellers", matcher: product => product.bestseller || product.featured },
  sale: { title: "Sale", matcher: product => product.saleActive && Number(product.salePriceEur) > 0 }
};

function brandFallbackImage(slug) {
  const brand = brandDefinitions[slug] || brandDefinitions["the-leather-atelier"];
  const product = publicProducts().find(item => item.brand === brand.name && mainImage(item))
    || publicProducts().find(item => item.folder === brand.imageFolder)
    || publicProducts()[0]
    || {};
  return mainImage(product);
}

function demoBrandProducts() {
  const image = folder => mainImage(rawProducts.find(product => product.folder === folder) || rawProducts[0] || {});
  const hasCustomDenim = rawProducts.some(product => product.brand === "Custom Denim Studio");
  const hasApparel = rawProducts.some(product => product.brand === "LoomingsThread Apparel");
  return [
    { slug: "demo-custom-denim-made-to-measure-jeans", name: "Made-to-Measure Denim Jeans", titleDe: "Made-to-Measure Denim Jeans", brand: "Custom Denim Studio", category: "Denim", folder: "denim", gender: "Unisex", ageGroup: "Adult", collection: "Custom Fit", season: "All Season", styleTags: ["denim","custom","jeans"], material: "Premium denim", materialDe: "Premium Denim", shortDescription: "Made-to-measure denim with a custom fit concept.", descriptionDe: "Made-to-measure Denim fuer individuelle Passformen, robuste Stoffe und personalisierte Details.", priceEur: 149, retailPriceEUR: 149, mainImage: image("duffle-bags"), images: [image("duffle-bags")].filter(Boolean), articleNumber: "CDS-DEN-0001", stockQty: 6, inStock: true, active: true, bestseller: true, isDemoFutureProduct: true },
    { slug: "demo-loomingsthread-essential-hoodie", name: "Essential Hoodie", titleDe: "Essential Hoodie", brand: "LoomingsThread Apparel", category: "Apparel", folder: "apparel", gender: "Unisex", ageGroup: "Adult", collection: "Modern Basics", season: "All Season", styleTags: ["hoodie","basics","apparel"], material: "Cotton fleece", materialDe: "Baumwoll-Fleece", shortDescription: "Premium hoodie from the LoomingsThread Apparel basics line.", descriptionDe: "Ein hochwertiger Hoodie aus der Modern-Basics-Linie von LoomingsThread Apparel.", priceEur: 89, retailPriceEUR: 89, mainImage: image("laptop-bags"), images: [image("laptop-bags")].filter(Boolean), articleNumber: "LTA-APP-0001", stockQty: 14, inStock: true, active: true, newArrival: true, featured: true, isDemoFutureProduct: true }
  ].filter(product => {
    if (product.brand === "Custom Denim Studio" && hasCustomDenim) return false;
    if (product.brand === "LoomingsThread Apparel" && hasApparel) return false;
    return true;
  });
}

function exportProductsJson() {
  const exported = products.filter(product => product.deleted !== true).map(product => {
    const copyProduct = { ...product };
    delete copyProduct.isAdminNew;
    return copyProduct;
  });
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "products.json";
  link.click();
  URL.revokeObjectURL(url);
  adminNotice("products.json downloaded. Please replace: D:\\New Leather Product Website\\data\\products.json");
}

function adminNotice(message) {
  const node = document.querySelector("#adminNotice");
  if (node) node.textContent = message;
  else alert(message);
}

function nextOrderNumber() {
  const year = new Date().getFullYear();
  const sameYear = orders.filter(order => String(order.orderNumber || "").startsWith(`TLA-${year}-`)).length + 1;
  return `TLA-${year}-${String(sameYear).padStart(4, "0")}`;
}

function invoiceNumber(orderNumber) {
  const [, year, count] = String(orderNumber || nextOrderNumber()).split("-");
  return `TLA-INV-${year || new Date().getFullYear()}-${count || "0001"}`;
}

function saveOrders() {
  localStorage.setItem("atelierOrders", JSON.stringify(orders));
}

function orderByNumber(orderNumber) {
  return orders.find(order => order.orderNumber === orderNumber);
}

function updateOrder(orderNumber, patch) {
  orders = orders.map(order => order.orderNumber === orderNumber ? { ...order, ...patch, updatedAt: new Date().toISOString() } : order);
  saveOrders();
}

function savePurchaseOrders() {
  localStorage.setItem("atelierPurchaseOrders", JSON.stringify(purchaseOrders));
}

function nextPurchaseOrderNumber() {
  const year = new Date().getFullYear();
  const sameYear = purchaseOrders.filter(po => String(po.poNumber || "").startsWith(`PO-${year}-`)).length + 1;
  return `PO-${year}-${String(sameYear).padStart(4, "0")}`;
}

function purchaseOrderByNumber(poNumber) {
  return purchaseOrders.find(po => po.poNumber === poNumber);
}

function productCostEstimate(item) {
  const product = getProduct(item.productId);
  const storedCost = Number(product?.landedCostEur || product?.costEur || 0);
  return storedCost > 0 ? storedCost : Number(item.unitPrice || 0) * 0.42;
}

function orderCostSummary(order) {
  const productCosts = (order.products || []).reduce((sum, item) => sum + productCostEstimate(item) * Number(item.quantity || 0), 0);
  const shippingCosts = Number(order.shipping || 0);
  const paymentFees = Number(order.total || 0) * 0.03;
  const revenue = Number(order.total || 0);
  const grossProfit = revenue - productCosts - shippingCosts;
  const netProfit = grossProfit - paymentFees;
  return { revenue, productCosts, shippingCosts, paymentFees, grossProfit, netProfit };
}

function reportRangeStart(range) {
  const now = new Date();
  const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "week") start.setDate(now.getDate() - 7);
  else if (range === "month") start.setMonth(now.getMonth() - 1);
  else if (range === "year") start.setFullYear(now.getFullYear() - 1);
  else start.setFullYear(1970);
  return start;
}

function ordersInRange(range = "year") {
  const start = reportRangeStart(range);
  return orders.filter(order => new Date(order.orderDate || Date.now()) >= start);
}

function businessMetrics(range = "year") {
  const scopedOrders = ordersInRange(range);
  const sums = scopedOrders.reduce((acc, order) => {
    const costs = orderCostSummary(order);
    Object.keys(costs).forEach(key => acc[key] += costs[key]);
    return acc;
  }, { revenue: 0, productCosts: 0, shippingCosts: 0, paymentFees: 0, grossProfit: 0, netProfit: 0 });
  const customers = customerSummaries(scopedOrders);
  return {
    ...sums,
    totalOrders: scopedOrders.length,
    totalCustomers: customers.length,
    pendingOrders: scopedOrders.filter(order => order.orderStatus === "New").length,
    awaitingPayment: scopedOrders.filter(order => order.orderStatus === "Awaiting Payment" || order.paymentStatus === "Awaiting Payment").length,
    inProduction: scopedOrders.filter(order => order.orderStatus === "In Production").length,
    shipped: scopedOrders.filter(order => order.orderStatus === "Shipped" || order.shippingStatus === "Shipped").length
  };
}

function customerSummaries(sourceOrders = orders) {
  const customers = new Map();
  sourceOrders.forEach(order => {
    const key = (order.email || order.customerName || "guest").toLowerCase();
    const existing = customers.get(key) || { name: order.customerName || "Guest", email: order.email || "", phone: order.phone || "", orders: 0, revenue: 0, lastOrderDate: "", orderNumbers: [] };
    existing.orders += 1;
    existing.revenue += Number(order.total || 0);
    existing.orderNumbers.push(order.orderNumber);
    if (!existing.lastOrderDate || new Date(order.orderDate) > new Date(existing.lastOrderDate)) existing.lastOrderDate = order.orderDate;
    customers.set(key, existing);
  });
  if (accountProfile && !customers.has((accountProfile.email || "demo").toLowerCase())) {
    customers.set((accountProfile.email || "demo").toLowerCase(), {
      name: `${accountProfile.firstName || ""} ${accountProfile.lastName || ""}`.trim() || "Demo Kunde",
      email: accountProfile.email || "",
      phone: accountProfile.phone || "",
      orders: 0,
      revenue: 0,
      lastOrderDate: "",
      orderNumbers: []
    });
  }
  return [...customers.values()].sort((a, b) => b.revenue - a.revenue);
}

function reservedQuantity(productId) {
  return orders
    .filter(order => !["Completed", "Cancelled", "Refunded"].includes(order.orderStatus))
    .flatMap(order => order.products || [])
    .filter(item => item.productId === productId)
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function inventoryRows() {
  return products.filter(product => product.deleted !== true).map(product => {
    const stock = Number(product.stockQty ?? 10);
    const reserved = reservedQuantity(product.slug);
    return { product, stock, reserved, available: Math.max(0, stock - reserved) };
  });
}

function downloadCsv(filename, rows) {
  const escapeCell = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map(row => row.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function saveAcquisitionData() {
  localStorage.setItem("loomingsthreadContactInquiries", JSON.stringify(contactInquiries));
  localStorage.setItem("loomingsthreadCrmLeads", JSON.stringify(crmLeads));
  localStorage.setItem("atelierNewsletterSignups", JSON.stringify(newsletterSubscribers));
  localStorage.setItem("loomingsthreadWholesaleApplications", JSON.stringify(wholesaleApplications));
  localStorage.setItem("loomingsthreadProductionRequests", JSON.stringify(productionRequests));
  localStorage.setItem("loomingsthreadCommerceAnalytics", JSON.stringify(commerceAnalytics));
}

function trackCommerceEvent(type, productId) {
  if (!productId || !commerceAnalytics[type]) return;
  commerceAnalytics[type][productId] = Number(commerceAnalytics[type][productId] || 0) + 1;
  localStorage.setItem("loomingsthreadCommerceAnalytics", JSON.stringify(commerceAnalytics));
}

function acquisitionLeads() {
  const manual = crmLeads.map(lead => ({ ...lead, recordType: "lead", sourceLabel: lead.source || "Manual" }));
  const contacts = contactInquiries.map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    source: item.type === "Wholesale inquiry" ? "Contact / Wholesale" : "Contact form",
    sourceLabel: item.type || "Contact form",
    interest: item.subject || item.type || "General inquiry",
    status: item.status || "New",
    notes: item.notes || item.message || "",
    createdAt: item.createdAt,
    recordType: "contact"
  }));
  const wholesale = wholesaleApplications.map(item => ({
    id: item.id,
    name: item.contact || item.company,
    email: item.email,
    source: "Wholesale",
    sourceLabel: "Wholesale pipeline",
    interest: `${item.interest || "Wholesale"} / ${item.brand || "All brands"}`,
    status: item.status || "New",
    notes: item.notes || item.message || "",
    createdAt: item.createdAt,
    recordType: "wholesale"
  }));
  const production = productionRequests.map(item => ({
    id: item.id,
    name: item.contact || item.company,
    email: item.email,
    source: "Production request",
    sourceLabel: "Production request",
    interest: `${item.productType || "Custom production"} / ${item.brand || "LoomingsThread"}`,
    status: item.status || "New",
    notes: item.adminNotes || item.notes || "",
    createdAt: item.createdAt,
    recordType: "production"
  }));
  return [...manual, ...contacts, ...wholesale, ...production].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function acquisitionMetrics() {
  const leads = acquisitionLeads();
  const productViews = Object.values(commerceAnalytics.productViews || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const cartAdds = Object.values(commerceAnalytics.cartAdds || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const wishlistAdds = Object.values(commerceAnalytics.wishlistAdds || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return {
    subscribers: newsletterSubscribers.filter(item => item.status !== "Unsubscribed").length,
    contacts: contactInquiries.length,
    wholesale: wholesaleApplications.length,
    production: productionRequests.length,
    leads: leads.length,
    productViews,
    cartAdds,
    wishlistAdds,
    orders: orders.length,
    revenue
  };
}

function rankedProductActivity(type) {
  const source = commerceAnalytics[type] || {};
  return Object.entries(source)
    .map(([slug, count]) => ({ product: getProduct(slug), count: Number(count || 0) }))
    .filter(item => item.product)
    .sort((a, b) => b.count - a.count);
}

function defaultSuppliers() {
  return [{
    id: "production-partner",
    name: "Production partner placeholder",
    contactName: "Supplier contact",
    email: "supplier@example.com",
    phone: "+49 000 000000",
    leadTimeDays: 21,
    rating: 4.6,
    onTimeRate: 92,
    notes: "Demo supplier profile. Replace with real procurement data before launch.",
    priceList: products.slice(0, 8).map(product => ({
      productId: product.slug,
      sku: product.articleNumber || product.slug,
      product: titleCase(product.name),
      costEur: Math.round(regularPrice(product) * 0.42 * 100) / 100,
      currency: "EUR",
      lastUpdated: new Date().toISOString().slice(0, 10)
    }))
  }];
}

function activeSuppliers() {
  if (!suppliers.length) {
    suppliers = defaultSuppliers();
    saveSuppliers();
  }
  return suppliers;
}

function saveSuppliers() {
  localStorage.setItem("atelierSuppliers", JSON.stringify(suppliers));
}

function supplierById(id) {
  return activeSuppliers().find(supplier => supplier.id === id) || activeSuppliers()[0];
}

function supplierCostForProduct(productId, supplierId) {
  const supplier = supplierById(supplierId);
  const line = supplier?.priceList?.find(item => item.productId === productId);
  if (line) return Number(line.costEur || 0);
  const product = getProduct(productId);
  return Math.round(regularPrice(product) * 0.42 * 100) / 100;
}

function procurementMetrics() {
  const openStatuses = ["Draft", "Sent to Supplier", "Confirmed", "In Production", "Shipped"];
  const openPurchaseOrders = purchaseOrders.filter(po => openStatuses.includes(po.status)).length;
  const supplierSpend = purchaseOrders.reduce((sum, po) => sum + (po.products || []).reduce((lineSum, item) => lineSum + Number(item.supplierCost || 0) * Number(item.quantity || 0), 0) + Number(po.shippingCost || 0), 0);
  const supplierList = activeSuppliers();
  const averageLeadTime = supplierList.length ? supplierList.reduce((sum, supplier) => sum + Number(supplier.leadTimeDays || 0), 0) / supplierList.length : 0;
  const valuation = inventoryRows().reduce((sum, row) => sum + supplierCostForProduct(row.product.slug) * row.stock, 0);
  const productProfit = products.slice(0, 24).map(product => ({
    product,
    revenue: regularPrice(product),
    cost: supplierCostForProduct(product.slug),
    profit: regularPrice(product) - supplierCostForProduct(product.slug)
  })).sort((a, b) => b.profit - a.profit);
  const categoryProfit = productProfit.reduce((map, row) => {
    const category = row.product.folder || "other";
    map[category] = (map[category] || 0) + row.profit;
    return map;
  }, {});
  return { openPurchaseOrders, supplierSpend, averageLeadTime, inventoryValuation: valuation, productProfit, categoryProfit };
}

function procurementReportRows(type) {
  const metrics = procurementMetrics();
  if (type === "supplier") return [["Supplier", "Contact", "Email", "Lead time days", "On-time rate", "Rating"], ...activeSuppliers().map(supplier => [supplier.name, supplier.contactName, supplier.email, supplier.leadTimeDays, `${supplier.onTimeRate}%`, supplier.rating])];
  if (type === "cost") return [["Supplier", "SKU", "Product", "Cost EUR", "Currency", "Last updated"], ...activeSuppliers().flatMap(supplier => (supplier.priceList || []).map(item => [supplier.name, item.sku, item.product, Number(item.costEur || 0).toFixed(2), item.currency || "EUR", item.lastUpdated || ""]))];
  if (type === "margin") return [["Product", "Category", "Price EUR", "Cost EUR", "Profit EUR", "Margin %"], ...metrics.productProfit.map(row => [titleCase(row.product.name), row.product.folder, row.revenue.toFixed(2), row.cost.toFixed(2), row.profit.toFixed(2), row.revenue ? Math.round(row.profit / row.revenue * 100) : 0])];
  return [["PO", "Supplier", "Status", "Order date", "Expected delivery", "Spend"], ...purchaseOrders.map(po => [po.poNumber, po.supplierName, po.status, po.orderDate, po.expectedDeliveryDate, ((po.products || []).reduce((sum, item) => sum + Number(item.supplierCost || 0) * Number(item.quantity || 0), 0) + Number(po.shippingCost || 0)).toFixed(2)])];
}

function exportProcurementCsv(type) {
  downloadCsv(`the-leather-atelier-${type}-procurement.csv`, procurementReportRows(type));
}

function openProcurementPdf(type = "procurement") {
  const rows = procurementReportRows(type);
  const html = `<html><head><title>${titleCase(type)} report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#16110d}h1{font-family:Georgia,serif}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:9px;text-align:left}th{text-transform:uppercase;font-size:11px;color:#6f6258}</style></head><body><h1>The Leather Atelier ${titleCase(type)} Report</h1><p>Generated ${new Date().toLocaleString("de-DE")}</p><table><thead><tr>${rows[0].map(cell => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return alert("Popup blocked. Please allow popups to print/export PDF.");
  win.document.write(html);
  win.document.close();
}

function createOrderFromCheckout(event) {
  event.preventDefault();
  const publicEntries = publicCartEntries();
  if (!publicEntries.length) {
    location.hash = "#/cart";
    return;
  }
  const form = event.target;
  const data = new FormData(form);
  const country = data.get("country") || "Deutschland";
  const method = shippingMethods(country).find(item => item.id === data.get("shippingMethod")) || selectedShippingMethod(country);
  const shipping = shippingPrice(country);
  const orderProducts = publicEntries.map(({ item, product }) => {
    return {
      productId: item.id,
      articleNumber: product.articleNumber || "",
      title: titleCase(product.name || item.id),
      color: item.color,
      size: item.size,
      quantity: item.qty,
      unitPrice: productPrice(product),
      lineTotal: productPrice(product) * item.qty,
      image: mainImage(product)
    };
  });
  const subtotal = cartSubtotal();
  const discount = cartDiscount();
  const total = cartTotal(country);
  const firstName = data.get("firstName") || "";
  const lastName = data.get("lastName") || "";
  const street = data.get("street") || "";
  const houseNumber = data.get("houseNumber") || "";
  const zip = data.get("zip") || "";
  const city = data.get("city") || "";
  const shippingAddress = `${street} ${houseNumber}, ${zip} ${city}, ${country}`.replace(/\s+/g, " ").trim();
  const billingAddress = data.get("billingStreet")
    ? `${data.get("billingStreet")} ${data.get("billingHouseNumber")}, ${data.get("billingZip")} ${data.get("billingCity")}, ${country}`.replace(/\s+/g, " ").trim()
    : shippingAddress;
  if (!paymentMethods().length) {
    alert("No demo payment method is enabled.");
    return;
  }
  const selectedPayment = paymentMethodById(data.get("paymentMethod"));
  const orderStatus = "Awaiting Payment";
  const order = {
    orderNumber: nextOrderNumber(),
    invoiceNumber: "",
    orderDate: new Date().toISOString(),
    customerName: `${firstName} ${lastName}`.trim(),
    email: data.get("email") || "",
    phone: data.get("phone") || "",
    billingAddress,
    shippingAddress,
    products: orderProducts,
    quantities: orderProducts.map(item => item.quantity),
    prices: orderProducts.map(item => item.unitPrice),
    subtotal,
    discount,
    VAT: vatAmount(country),
    shipping,
    shippingCountry: country,
    shippingZone: method.zoneLabel,
    shippingMethod: method.label,
    shippingCarrier: method.carrier,
    shippingStatus: "Not shipped",
    trackingUrl: "",
    total,
    paymentMethod: selectedPayment.label,
    paymentProvider: selectedPayment.id,
    paymentStatus: "Awaiting Payment",
    paymentReference: "",
    paymentNotice: selectedPayment.id === "bankTransfer" ? (adminSettings.payments?.paymentInstructionText || "") : "Diese Zahlungsart ist vorbereitet und wird vor dem Livegang final aktiviert.",
    orderStatus,
    trackingNumber: "",
    internalNote: "",
    deliveryEstimate: method.estimate || shippingEstimate(country)
  };
  order.invoiceNumber = invoiceNumber(order.orderNumber);
  orders = [order, ...orders];
  localStorage.setItem("atelierLastOrderNumber", order.orderNumber);
  cart = [];
  saveState();
  location.hash = `#/confirmation/${order.orderNumber}`;
}

function importProductsJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("products.json must contain an array.");
      rawProducts = imported;
      adminEdits = {};
      localStorage.setItem("atelierImportedProductsJson", JSON.stringify(imported));
      saveAdminEdits();
      adminNotice(`Imported ${imported.length} products into localStorage. Export when ready to replace the real products.json.`);
      if (location.pathname === "/admin/products") renderAdminProducts();
    } catch (error) {
      adminNotice(`Import failed: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function resetLocalEdits() {
  if (!confirm("Reset all local admin edits and reload original products.json?")) return;
  adminEdits = {};
  localStorage.removeItem("atelierAdminProductEdits");
  localStorage.removeItem("atelierImportedProductsJson");
  fetch(`/data/products.json?v=${Date.now()}`)
    .then(response => response.json())
    .then(data => {
      rawProducts = data;
      applyAdminEdits();
      adminNotice("Local edits reset. Original products.json reloaded.");
      renderAdminRoute();
    });
}

function cleanProductTitle(value) {
  return titleCase(String(value || "")
    .replace(/\([^)]*article[^)]*\)/gi, "")
    .replace(/\b(Tiger Article|Crocodile Article|Wax Pullup Product)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim());
}

function cleanProductText(value) {
  return String(value || "")
    .replace(/\([^)]*article[^)]*\)/gi, "")
    .replace(/\b100%\s*HANDMAE\b/gi, "100% handmade")
    .replace(/\b100%\s*HANDMADE\s*&\s*100%\s*(VEGETABLE\s*)?VEGTAN\s*LEATHER\b/gi, "Handgefertigt aus pflanzlich gegerbtem Leder.")
    .replace(/\b100%\s*HANDMADE\s*&\s*100%\s*LEATHER\b/gi, "Handgefertigt aus Leder.")
    .replace(/\baus der\s+([A-Za-z ]+)\s+Kollektion\.\s+aus der\s+\1\s+Kollektion\./gi, "aus der $1 Kollektion.")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanImportedProductTexts() {
  products.forEach(product => {
    const cleanedTitle = cleanProductTitle(product.titleDe || product.name);
    const cleanedDescription = cleanProductText(product.descriptionDe || product.description);
    adminEdits[product.slug] = {
      ...adminEdits[product.slug],
      slug: product.slug,
      name: cleanedTitle,
      productName: cleanedTitle,
      titleDe: cleanedTitle,
      titleEn: cleanProductTitle(product.titleEn || cleanedTitle),
      descriptionDe: cleanedDescription,
      descriptionEn: cleanProductText(product.descriptionEn || cleanedDescription),
      description: cleanedDescription,
      shortDescription: cleanedDescription.slice(0, 160)
    };
  });
  saveAdminEdits();
  adminNotice("Imported product texts cleaned locally. Review and export products.json when ready.");
  renderAdminProducts();
}

function currentAdminFilteredProducts() {
  const query = document.querySelector("#adminSearch")?.value.toLowerCase() || "";
  const folder = document.querySelector("#adminFolder")?.value || "All";
  const status = document.querySelector("#adminStatus")?.value || "All";
  return products.filter(product => {
    const haystack = `${product.name} ${product.articleNumber || ""} ${product.material || ""} ${product.leatherType || ""}`.toLowerCase();
    const statusOk = status === "All" ||
      (status === "Visible" && isPublicProduct(product)) ||
      (status === "Hidden" && !isPublicProduct(product)) ||
      (status === "Sale" && product.saleActive) ||
      (status === "Featured" && product.featured) ||
      (status === "Bestseller" && product.bestseller) ||
      (status === "New Arrival" && product.newArrival) ||
      (status === "Image pending" && product.publicImageStatus === "Image pending") ||
      (status === "Concept" && isConceptProduct(product)) ||
      (status === "Out of stock" && (!product.inStock || Number(product.stockQty) <= 0));
    return haystack.includes(query) && (folder === "All" || product.folder === folder) && statusOk;
  });
}

function applyBulkEdit() {
  const targets = currentAdminFilteredProducts();
  const category = document.querySelector("#bulkCategory").value;
  const salePercent = Number(document.querySelector("#bulkSalePercent").value || 0);
  const featured = document.querySelector("#bulkFeatured").checked;
  const bestseller = document.querySelector("#bulkBestseller").checked;
  const activeMode = document.querySelector("#bulkActive").value;
  targets.forEach(product => {
    const update = { ...adminEdits[product.slug], slug: product.slug };
    if (category !== "No change") {
      update.folder = category;
      update.category = category;
    }
    if (salePercent > 0) {
      update.saleActive = true;
      update.salePriceEur = Math.round(regularPrice(product) * (1 - salePercent / 100) * 100) / 100;
    }
    if (featured) update.featured = true;
    if (bestseller) update.bestseller = true;
    if (activeMode === "Activate") update.active = true;
    if (activeMode === "Deactivate") update.active = false;
    adminEdits[product.slug] = update;
  });
  saveAdminEdits();
  adminNotice(`Bulk edit applied to ${targets.length} filtered products.`);
  renderAdminProducts();
}

function calculatePricing(values) {
  const supplierCostEur = Number(values.supplierCostPkr || 0) / Number(values.exchangeRate || 1);
  const baseCost = supplierCostEur + Number(values.shippingPerItem || 0) + Number(values.packagingCost || 0);
  const customs = baseCost * (Number(values.customsDuty || 0) / 100);
  const importVat = (baseCost + customs) * (Number(values.importVat || 0) / 100);
  const landedCost = baseCost + customs + importVat;
  const marketing = landedCost * (Number(values.marketingCost || 0) / 100);
  const targetMargin = Number(values.profitMargin || 0) / 100;
  const paymentFee = Number(values.paymentFee || 0) / 100;
  const netSellingPrice = targetMargin >= 0.95 || paymentFee >= 0.95
    ? landedCost + marketing
    : (landedCost + marketing) / Math.max(0.01, 1 - targetMargin - paymentFee);
  const vatAmountValue = netSellingPrice * (Number(values.vat || adminSettings.vat) / 100);
  const grossCustomerPrice = netSellingPrice + vatAmountValue;
  const paymentCost = netSellingPrice * paymentFee;
  const profit = netSellingPrice - landedCost - marketing - paymentCost;
  const profitMargin = netSellingPrice > 0 ? (profit / netSellingPrice) * 100 : 0;
  return {
    supplierCostEur,
    landedCost,
    netSellingPrice,
    vatAmount: vatAmountValue,
    grossCustomerPrice,
    profit,
    profitMargin
  };
}

function pricingRecommendation(margin) {
  if (margin < 35) return { label: "Too low margin warning", className: "danger-zone", text: "Margin is tight for German ecommerce once returns, ads and payment fees are considered." };
  if (margin < 60) return { label: "Healthy margin", className: "healthy-zone", text: "Margin looks workable for a controlled premium storefront." };
  return { label: "Premium margin", className: "premium-zone", text: "Margin supports premium positioning, discounts and operational buffer." };
}

function pricingFormValues() {
  const form = document.querySelector("#pricingForm");
  return {
    supplierCostPkr: Number(form.supplierCostPkr.value || 0),
    exchangeRate: Number(form.exchangeRate.value || 300),
    shippingPerItem: Number(form.shippingPerItem.value || 0),
    customsDuty: Number(form.customsDuty.value || 0),
    importVat: Number(form.importVat.value || adminSettings.vat),
    packagingCost: Number(form.packagingCost.value || 0),
    paymentFee: Number(form.paymentFee.value || 0),
    marketingCost: Number(form.marketingCost.value || 0),
    profitMargin: Number(form.profitMargin.value || adminSettings.defaultProfitMargin),
    vat: Number(adminSettings.vat || 19)
  };
}

function updatePricingPreview() {
  const result = calculatePricing(pricingFormValues());
  const recommendation = pricingRecommendation(result.profitMargin);
  document.querySelector("#pricingResults").innerHTML = `<article><span>Landed cost EUR</span><b>${euro(result.landedCost)}</b></article><article><span>Net selling price</span><b>${euro(result.netSellingPrice)}</b></article><article><span>VAT amount</span><b>${euro(result.vatAmount)}</b></article><article><span>Gross customer price</span><b>${euro(result.grossCustomerPrice)}</b></article><article><span>Profit EUR</span><b>${euro(result.profit)}</b></article><article><span>Profit margin</span><b>${result.profitMargin.toFixed(1)}%</b></article>`;
  document.querySelector("#pricingRecommendation").className = `pricing-recommendation ${recommendation.className}`;
  document.querySelector("#pricingRecommendation").innerHTML = `<strong>${recommendation.label}</strong><p>${recommendation.text}</p>`;
}

function applyBulkPricing() {
  const category = document.querySelector("#pricingCategory").value;
  const targets = products.filter(product => category === "all-bags"
    ? ["laptop-bags", "duffle-bags", "ladies-bags"].includes(product.folder)
    : product.folder === category);
  const result = calculatePricing(pricingFormValues());
  const gross = Math.ceil(result.grossCustomerPrice) - 0.01;
  targets.forEach(product => {
    adminEdits[product.slug] = {
      ...adminEdits[product.slug],
      slug: product.slug,
      priceEur: Number(gross.toFixed(2)),
      retailPriceEUR: Number(gross.toFixed(2)),
      pricingMeta: {
        supplierCostPkr: pricingFormValues().supplierCostPkr,
        exchangeRate: pricingFormValues().exchangeRate,
        landedCostEur: Number(result.landedCost.toFixed(2)),
        netSellingPrice: Number(result.netSellingPrice.toFixed(2)),
        grossCustomerPrice: Number(gross.toFixed(2)),
        profitEur: Number(result.profit.toFixed(2)),
        profitMargin: Number(result.profitMargin.toFixed(2))
      }
    };
  });
  saveAdminEdits();
  adminNotice(`Bulk price update applied to ${targets.length} products. Export products.json when ready.`);
  updatePricingPreview();
}

function renderAdminPricing() {
  adminShell("Pricing", `<section class="pricing-layout">
    <form id="pricingForm" class="admin-form pricing-form" oninput="updatePricingPreview()" onchange="updatePricingPreview()">
      <section><h2>Product cost calculator</h2><div class="pricing-grid">
        <label>Supplier cost in PKR<input name="supplierCostPkr" type="number" step="1" value="6000"></label>
        <label>Exchange rate PKR to EUR<input name="exchangeRate" type="number" step="0.01" value="300"></label>
        <label>International shipping cost per item<input name="shippingPerItem" type="number" step="0.01" value="${adminSettings.shippingGermany}"></label>
        <label>Customs duty %<input name="customsDuty" type="number" step="0.01" value="4"></label>
        <label>Import VAT %<input name="importVat" type="number" step="0.01" value="${adminSettings.vat}"></label>
        <label>Packaging cost<input name="packagingCost" type="number" step="0.01" value="2.5"></label>
        <label>Payment fee %<input name="paymentFee" type="number" step="0.01" value="3"></label>
        <label>Marketing cost %<input name="marketingCost" type="number" step="0.01" value="8"></label>
        <label>Desired profit margin %<input name="profitMargin" type="number" step="0.01" value="${adminSettings.defaultProfitMargin}"></label>
      </div></section>
    </form>
    <aside><section class="pricing-results" id="pricingResults"></section><section id="pricingRecommendation" class="pricing-recommendation"></section></aside>
  </section>
  <section class="admin-bulk pricing-bulk"><div><h2>Bulk price calculator</h2><p>Applies the current formula to selected products and stores priceEur in local admin edits.</p></div><label>Select category<select id="pricingCategory"><option value="wallets">wallets</option><option value="cardholders">cardholders</option><option value="belts">belts</option><option value="all-bags">bags</option><option value="ladies-bags">ladies-bags</option><option value="duffle-bags">duffle-bags</option></select></label><button class="button" onclick="applyBulkPricing()">Apply formula to category</button></section>
  <section class="admin-stats pricing-settings"><article><b>${adminSettings.vat}%</b><span>VAT percentage</span></article><article><b>${adminSettings.currency}</b><span>Currency</span></article><article><b>${euro(adminSettings.shippingGermany)}</b><span>Germany shipping</span></article><article><b>${euro(adminSettings.freeShippingThreshold)}</b><span>Free shipping threshold</span></article><article><b>${adminSettings.defaultProfitMargin}%</b><span>Default profit margin</span></article></section>`);
  updatePricingPreview();
}

function updateSeo(title, description, image = "/products/laptop-bags/men-bag-s-for-laptop-s-and-file-s/image-1.jpg") {
  document.title = `${title} | LoomingsThread`;
  document.querySelector("meta[name='description']")?.setAttribute("content", description);
  document.querySelector("meta[property='og:title']")?.setAttribute("content", `${title} | LoomingsThread`);
  document.querySelector("meta[property='og:description']")?.setAttribute("content", description);
  document.querySelector("meta[property='og:image']")?.setAttribute("content", image);
  document.querySelector("meta[name='twitter:title']")?.setAttribute("content", `${title} | LoomingsThread`);
  document.querySelector("meta[name='twitter:description']")?.setAttribute("content", description);
  document.querySelector("meta[name='twitter:image']")?.setAttribute("content", image);
}

function updateStaticText() {
  document.querySelectorAll("[data-i18n]").forEach(node => node.textContent = t(node.dataset.i18n));
  document.querySelector("#langToggle").textContent = lang === "de" ? "EN" : "DE";
  saveState();
}

function page(title, body, kicker = "LoomingsThread") {
  if (title) updateSeo(title, `${title} bei LoomingsThread. Premium multi-brand ecommerce platform fuer Lederwaren, Kidswear, Denim und Apparel.`);
  app.innerHTML = `${title ? `<section class="page-head"><p>${kicker}</p><h1>${title}</h1></section>` : ""}${body}`;
}

function toggleMobileNav(force) {
  const nav = document.querySelector("#siteNav");
  const button = document.querySelector(".mobile-menu-toggle");
  if (!nav || !button) return;
  const open = typeof force === "boolean" ? force : !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", open);
  button.setAttribute("aria-expanded", String(open));
  button.textContent = open ? "Close" : "Menu";
}

function toggleMegaMenu(event) {
  event?.stopPropagation();
  const trigger = document.querySelector(".mega-trigger");
  const button = document.querySelector(".mega-menu-toggle");
  const open = !trigger?.classList.contains("is-open");
  trigger?.classList.toggle("is-open", open);
  button?.setAttribute("aria-expanded", String(open));
}

document.addEventListener("click", event => {
  if (!event.target.closest(".mega-trigger")) document.querySelector(".mega-trigger")?.classList.remove("is-open");
  if (event.target.closest("#siteNav a")) toggleMobileNav(false);
});

function addToCart(id, qty = 1, color = "Cognac", size = "Standard") {
  const product = getProduct(id);
  if (!isPublicProduct(product)) {
    alert("Dieses Produkt ist noch nicht fuer den Verkauf freigegeben.");
    return;
  }
  if (!product.inStock || Number(product.stockQty) <= 0) {
    alert("Dieses Produkt ist aktuell ausverkauft.");
    return;
  }
  const found = cart.find(item => item.id === id && item.color === color && item.size === size);
  if (found) found.qty += qty;
  else cart.push({ id, qty, color, size });
  trackCommerceEvent("cartAdds", id);
  saveState();
  location.hash = "#/cart";
}

function toggleWishlist(id) {
  if (!isPublicProduct(getProduct(id))) return;
  const adding = !wishlist.includes(id);
  wishlist = adding ? [...wishlist, id] : wishlist.filter(item => item !== id);
  if (adding) trackCommerceEvent("wishlistAdds", id);
  saveState();
  route();
}

function setQty(index, qty) {
  cart[index].qty = Math.max(1, qty);
  saveState();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveState();
  renderCart();
}

function productColors(product) {
  if (product.colorOptions?.length) return product.colorOptions;
  const text = `${product.name} ${(product.tags || []).join(" ")}`.toLowerCase();
  const colors = [];
  if (/black/.test(text)) colors.push("Black");
  if (/brown|chief|cognac|tiger/.test(text)) colors.push("Cognac");
  if (/tan|veg/.test(text)) colors.push("Tan");
  return colors.length ? [...new Set(colors)] : ["Cognac", "Black"];
}

function productSizes(product) {
  if (product.sizeOptions?.length) return product.sizeOptions;
  if (product.folder === "laptop-bags") return ["13 inch", "15 inch"];
  if (product.folder === "belts") return ["90 cm", "100 cm", "110 cm"];
  if (product.folder === "duffle-bags") return ["Weekend"];
  if (product.folder === "ladies-bags") return ["Standard"];
  if (/long|dollar/i.test(product.name)) return ["Long"];
  return ["Slim", "Standard"];
}

function shortDescription(product) {
  return product.shortDescription || `Premium ${product.collection || product.category || "lifestyle"} product from ${product.brand || "LoomingsThread"}.`;
}

function displayProductTitle(product) {
  if (!product) return "";
  return lang === "de" && product.titleDe ? product.titleDe : product.titleEn || product.name;
}

function leatherType(product) {
  return product.leatherType || product.leatherTypeDe || "";
}

function isLeatherProduct(product) {
  return product.brand === "The Leather Atelier" || ["wallets", "cardholders", "belts", "laptop-bags", "duffle-bags", "ladies-bags"].includes(product.folder);
}

function collectionCard(folder, title, text) {
  const product = publicProducts().find(item => item.folder === folder) || publicProducts()[0] || {};
  return `<a class="collection-card" href="#/shop" onclick="localStorage.setItem('atelierCollectionFilter','${folder}')">
    <img src="${mainImage(product)}" alt="${title}">
    <span>${title}</span>
    <p>${text}</p>
  </a>`;
}

function card(product) {
  if (!isPublicProduct(product)) return "";
  const sale = product.saleActive && Number(product.salePriceEur) > 0;
  const out = !product.inStock || Number(product.stockQty) <= 0;
  const review = reviewSummary(product.slug);
  return `<article class="product-card">
    <a class="product-card-media" href="#/product/${product.slug}"><img src="${mainImage(product)}" alt="${displayProductTitle(product)}" loading="lazy"></a>
    <div>
      <div class="badges">${sale ? "<span>Sale</span>" : ""}${out ? "<span>Ausverkauft</span>" : ""}${product.featured ? "<span>Featured</span>" : ""}</div>
      <p>${product.brand || "LoomingsThread"}</p>
      <h3>${displayProductTitle(product)}</h3>
      <div class="card-rating" aria-label="${review.average} von 5 Sternen">${starsMarkup(review.average)} <span>${review.count ? `${review.average} (${review.count})` : "Neu"}</span></div>
      <div class="card-copy">${shortDescription(product)}</div>
      <dl class="mini-specs"><div><dt>Collection</dt><dd>${product.collection || product.category}</dd></div><div><dt>Material</dt><dd>${product.material || product.materialDe || "Premium material"}</dd></div></dl>
      <span>${sale ? `<s>${euro(regularPrice(product))}</s> ` : ""}<b>${euro(productPrice(product))}</b></span>
    </div>
    <div class="card-actions">
      <button ${out ? "disabled" : ""} onclick="addToCart('${product.slug}')">${out ? "Ausverkauft" : t("add")}</button>
      <button class="ghost icon-button" title="${t("wish")}" onclick="toggleWishlist('${product.slug}')">${wishlist.includes(product.slug) ? t("saved") : t("wish")}</button>
      <button class="ghost icon-button" onclick="openQuickView('${product.slug}')">Quick view</button>
      <a href="#/product/${product.slug}">${t("details")}</a>
    </div>
  </article>`;
}

function reviewsFor(slug) {
  return Array.isArray(productReviews[slug]) ? productReviews[slug] : [];
}

function reviewSummary(slug) {
  const reviews = reviewsFor(slug);
  if (!reviews.length) return { average: 0, count: 0 };
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}

function starsMarkup(value) {
  const rating = Math.round(Number(value || 0));
  return `<span class="stars" aria-hidden="true">${[1, 2, 3, 4, 5].map(star => star <= rating ? "★" : "☆").join("")}</span>`;
}

function submitReview(event, slug) {
  event.preventDefault();
  const form = event.target;
  const files = [...(form.photos.files || [])].map(file => file.name).slice(0, 3);
  const review = {
    id: `REV-${Date.now()}`,
    name: form.name.value.trim(),
    rating: Number(form.rating.value),
    title: form.title.value.trim(),
    text: form.text.value.trim(),
    photoPlaceholders: files,
    createdAt: new Date().toISOString()
  };
  productReviews[slug] = [review, ...reviewsFor(slug)];
  localStorage.setItem("loomingsthreadProductReviews", JSON.stringify(productReviews));
  renderProduct(slug);
  setTimeout(() => document.querySelector("#reviews")?.scrollIntoView({ behavior: "smooth" }), 50);
}

function productStory(product) {
  const stories = {
    "The Leather Atelier": "Entworfen fuer Tage, an denen Funktion selbstverstaendlich und Stil leise wirken soll. Dieses Stueck verbindet klare Proportionen mit einer langlebigen, geschaeftstauglichen Haltung.",
    "Letta & Luna": "Ein unkomplizierter Begleiter fuer kleine Alltagsabenteuer. Weiche Haptik, Bewegungsfreiheit und eine warme Farbwelt machen das Anziehen angenehm leicht.",
    "Custom Denim Studio": "Ein moderner Denim-Baustein mit Heritage-Charakter. Die Silhouette ist bewusst vielseitig gedacht: authentisch im Detail, urban im Ausdruck.",
    "LoomingsThread Apparel": "Ein ruhiges Essential fuer eine durchdachte Garderobe. Klare Linien, angenehme Proportionen und vielseitiges Styling stehen im Mittelpunkt."
  };
  return stories[product.brand] || "Ein kuratiertes LoomingsThread Produkt fuer eine moderne, langlebige Garderobe.";
}

function productFeatures(product) {
  const features = [
    { title: "Durchdachtes Design", text: product.collection ? `Teil der ${product.collection} Kollektion mit klarer, vielseitiger Form.` : "Eine klare Form fuer vielseitige Kombinationen." },
    { title: "Ausgewaehltes Material", text: product.materialDe || product.material || "Materialangaben werden vor dem Verkaufsstart final geprueft." },
    { title: "Fuer den Alltag", text: isLeatherProduct(product) ? "Funktional fuer Arbeit, Reise und taegliche Routinen." : "Komfortabel fuer Alltag, Freizeit und moderne Layering-Looks." }
  ];
  return features.map(feature => `<article><span>0${features.indexOf(feature) + 1}</span><h3>${feature.title}</h3><p>${feature.text}</p></article>`).join("");
}

function homepageBrandStorytelling() {
  const chapters = [
    {
      slug: "the-leather-atelier",
      kicker: "Craftsmanship",
      title: "Objects shaped by patience.",
      text: "The Leather Atelier gives everyday essentials the weight of considered design: warm surfaces, purposeful details and a quiet executive character."
    },
    {
      slug: "letta-luna",
      kicker: "Family & Fashion",
      title: "Made for movement, memory and play.",
      text: "Letta & Luna brings softness and imagination into the brand house with calm color, comfortable silhouettes and a warm family point of view."
    },
    {
      slug: "custom-denim-studio",
      kicker: "Denim Heritage",
      title: "Workwear roots. Modern rhythm.",
      text: "Custom Denim Studio translates indigo heritage into an urban wardrobe through practical construction, familiar forms and contemporary proportions."
    },
    {
      slug: "loomingsthread-apparel",
      kicker: "Modern Essentials",
      title: "A wardrobe built around clarity.",
      text: "LoomingsThread Apparel focuses on the pieces that hold a wardrobe together: refined layers, premium basics and versatile modern silhouettes."
    }
  ];
  return `<section class="house-story-intro">
    <div><p class="eyebrow">Our Story</p><h2>One company, built as a house of distinct ideas.</h2></div>
    <div><p>LoomingsThread began with a simple conviction: products feel more valuable when their purpose, material and story are clear. Our four brands speak in different voices, but share one standard for thoughtful presentation, service and lasting relevance.</p><a class="link" href="#/brand-guidelines">Explore the brand house</a></div>
  </section>
  <section class="story-chapters">${chapters.map((chapter, index) => `<article class="story-chapter story-${chapter.slug}">
    <img src="${campaignImage(chapter.slug, index + 2)}" alt="${chapter.kicker} by ${brandDefinitions[chapter.slug].name}">
    <div><img class="chapter-logo" src="${brandDefinitions[chapter.slug].logo}" alt="${brandDefinitions[chapter.slug].name}"><p class="eyebrow">${chapter.kicker}</p><h3>${chapter.title}</h3><p>${chapter.text}</p><a href="#/brand/${chapter.slug}">Discover ${brandDefinitions[chapter.slug].name}</a></div>
  </article>`).join("")}</section>`;
}

function renderHome() {
  const visible = publicProducts();
  const hero = visible.find(product => product.folder === "duffle-bags") || visible.find(product => product.folder === "laptop-bags") || visible[0] || {};
  const bestSellers = (visible.filter(product => product.bestseller).length ? visible.filter(product => product.bestseller) : visible.filter(product => product.imageCount > 3)).slice(0, 4).map(card).join("");
  const newArrivals = (visible.filter(product => product.newArrival).length ? visible.filter(product => product.newArrival) : visible.slice(-4).reverse()).slice(0, 4).map(card).join("");
  const featured = visible.filter(product => product.featured).slice(0, 4);
  const lettaNew = lettaProducts("New Arrivals");
  const lettaBest = lettaProducts().filter(product => product.bestseller);
  const lettaBaby = lettaProducts("Baby");
  const lettaGirls = lettaProducts("Girls");
  const lettaBoys = lettaProducts("Boys");
  const denim = visible.filter(product => product.brand === "Custom Denim Studio");
  const apparel = visible.filter(product => product.brand === "LoomingsThread Apparel");
  const leather = visible.filter(product => product.brand === "The Leather Atelier");
  const customerFavorites = [...visible]
    .sort((a, b) => {
      const aScore = reviewSummary(a.slug).average * 10 + reviewSummary(a.slug).count + (wishlist.includes(a.slug) ? 8 : 0) + (a.bestseller ? 5 : 0);
      const bScore = reviewSummary(b.slug).average * 10 + reviewSummary(b.slug).count + (wishlist.includes(b.slug) ? 8 : 0) + (b.bestseller ? 5 : 0);
      return bScore - aScore;
    })
    .slice(0, 4);
  const insta = visible.filter(product => mainImage(product)).slice(10, 16);
  updateSeo("LoomingsThread", "Premium leather goods, kidswear and custom fashion crafted for modern European lifestyles.", campaignImage("loomingsthread-apparel"));
  page("", `
    <section class="luxury-hero multi-hero">
      <img src="${campaignImage("loomingsthread-apparel")}" alt="LoomingsThread premium fashion campaign">
      <div class="luxury-hero-copy">
        <p class="eyebrow">The new European edit / 2026</p>
        <h1>LoomingsThread</h1>
        <p>Four distinct fashion worlds, curated with one point of view. Leather craft, premium kidswear, denim heritage and contemporary essentials.</p>
        <div class="hero-actions"><a class="button" href="#/collections/new-arrivals">New season entdecken</a><a class="link" href="#/shop">The complete edit</a></div>
      </div>
    </section>
    <section class="commerce-marquee" aria-label="LoomingsThread service promises"><span>Four independent brands</span><span>One seamless checkout</span><span>Tracked European delivery</span><span>Curated quality</span></section>
    <section class="section-title"><p>Brands</p><h2>Four worlds. One premium platform.</h2></section>
    <section class="brand-showcase">${Object.entries(brandDefinitions).map(([slug, brand]) => `<a class="brand-tile" href="#/brand/${slug}"><img src="${campaignImage(slug)}" alt="${brand.name} campaign"><span>${brand.name}</span><p>${brand.focus}</p><em>Explore brand</em></a>`).join("")}</section>
    ${homepageBrandStorytelling()}
    ${brandSpotlight("the-leather-atelier", "The Leather Atelier", "Executive leather goods for work, travel and everyday rituals.", "Dark leather tones, business-ready accessories and a polished premium mood under the LoomingsThread roof.", "Explore leather", "leather")}
    ${brandSpotlight("letta-luna", "Letta & Luna", "Soft premium kidswear with a warm family spirit.", "Cream, pastel and playful pieces for Baby, Toddler, Girls and Boys, all connected to the same cart and checkout.", "Explore kidswear", "kidswear")}
    ${brandSpotlight("custom-denim-studio", "Custom Denim Studio", "Indigo denim heritage with a modern industrial edge.", "AI-ready jeans, jackets and denim shirts with stable gallery slots for future generated imagery.", "Explore denim", "denim")}
    ${brandSpotlight("loomingsthread-apparel", "LoomingsThread Apparel", "Clean contemporary fashion for men and women.", "Minimal hoodies, sweatshirts, T-shirts and women’s apparel curated for a premium capsule wardrobe.", "Explore apparel", "hoodies")}
    ${trustSection()}
    ${homepageConversionProof()}
    <section class="section-title"><p>Featured collections</p><h2>Shop the LoomingsThread edit</h2></section>
    <section class="collection-strip multi-collections">
      ${collectionTile("leather", "Leather", "Wallets, bags, belts and accessories.")}
      ${collectionTile("kidswear", "Kids", "Baby, boys and girls collections.")}
      ${collectionTile("denim", "Denim", "Custom jeans and denim jackets.")}
      ${collectionTile("men", "Men", "Menswear and elevated basics.")}
      ${collectionTile("women", "Women", "Womenswear, bags and essentials.")}
      ${collectionTile("accessories", "Accessories", "Small goods and finishing pieces.")}
    </section>
    <section class="section-title"><p>Bestseller</p><h2>Favoriten der Kollektion</h2></section>
    <section class="product-grid">${bestSellers}</section>
    <section class="section-title"><p>Customer favorites</p><h2>Von unserer Community ausgewaehlt</h2></section>
    <section class="product-grid">${customerFavorites.map(card).join("")}</section>
    <section class="editorial-band">
      <div><p class="eyebrow">Wholesale / Private Label</p><h2>Retail-ready fashion, leather goods and custom production.</h2></div>
      <p>LoomingsThread is structured for direct-to-consumer sales, wholesale inquiries, private label development and future OEM production workflows.</p>
      <div class="editorial-actions"><a class="button" href="#/wholesale">Wholesale enquiry</a><a class="link" href="#/production">Production request</a></div>
    </section>
    <section class="section-title"><p>New arrivals</p><h2>Neu im Atelier</h2></section>
    <section class="product-grid">${newArrivals}</section>
    <section class="letta-home-band">
      <div><p class="eyebrow">Letta & Luna</p><h2>Soft premium kidswear for little everyday adventures.</h2></div>
      <p>Baby, Toddler, Girls und Boys Looks mit warmem Familiengefuehl, weicher Haptik und lokal gepflegten Produktgalerien.</p>
      <a class="button" href="#/brand/letta-luna">Letta & Luna entdecken</a>
    </section>
    ${productShelf("Letta & Luna New Arrivals", "Neue Kidswear Lieblinge", lettaNew, "#/collections/kidswear")}
    ${productShelf("Letta & Luna Bestsellers", "Beliebte Familienfavoriten", lettaBest, "#/collections/kidswear")}
    ${productShelf("Baby Collection", "Sanfte Baby-Outfits", lettaBaby, "#/collections/kidswear")}
    ${productShelf("Girls Collection", "Verspielte Maedchen-Looks", lettaGirls, "#/collections/kidswear")}
    ${productShelf("Boys Collection", "Bequeme Jungen-Looks", lettaBoys, "#/collections/kidswear")}
    ${productShelf("Custom Denim Studio", "Jeans, Jackets und Shirts", denim.filter(product => product.newArrival), "#/brand/custom-denim-studio")}
    ${productShelf("LoomingsThread Apparel", "Hoodies, Sweats und Premium Basics", apparel.filter(product => product.newArrival), "#/brand/loomingsthread-apparel")}
    ${productShelf("The Leather Atelier", "Leather essentials", leather.filter(product => product.featured || product.bestseller), "#/brand/the-leather-atelier")}
    <section class="section-title"><p>Featured products</p><h2>Brand highlights</h2></section>
    <section class="product-grid">${(featured.length ? featured : visible.slice(0, 4)).map(card).join("")}</section>
    <section class="why-grid">
      <article><h3>Secure checkout</h3><p>Cart, checkout, demo payment methods and customer confirmation are structured for launch.</p></article>
      <article><h3>14-day returns</h3><p>German-market return information and legal drafts are prepared for professional review.</p></article>
      <article><h3>Tracked shipping</h3><p>Shipping zones, carriers, tracking workflows and order management are connected.</p></article>
      <article><h3>Handmade quality</h3><p>Leather, apparel, denim and kidswear are presented as a curated premium brand family.</p></article>
    </section>
    <section class="section-title"><p>Journal</p><h2>Style notes and care guides</h2></section>
    <section class="blog-grid journal-list">${Object.entries(journalPosts).slice(0, 4).map(([slug, post]) => `<article><p class="eyebrow">${post.kicker}</p><h2>${post.title}</h2><p>${post.intro}</p><a class="button" href="#/blog/${slug}">Read journal</a></article>`).join("")}</section>
    <section class="section-title"><p>Instagram</p><h2>@loomingsthread</h2></section>
    <section class="instagram-grid">${insta.map(product => `<a href="#/product/${product.slug}"><img src="${mainImage(product)}" alt="${product.name}"></a>`).join("")}</section>
    ${newsletterSection()}
    <a class="whatsapp-float" href="https://wa.me/" aria-label="WhatsApp">WhatsApp</a>
  `, "");
}

function collectionTile(slug, title, text) {
  const product = productsForCollection(slug)[0];
  const fallbackImages = {
    denim: campaignImage("custom-denim-studio"),
    men: campaignImage("loomingsthread-apparel"),
    women: campaignImage("loomingsthread-apparel", 2),
    accessories: campaignImage("the-leather-atelier", 2)
  };
  const image = product ? mainImage(product) : fallbackImages[slug] || campaignImage("the-leather-atelier");
  return `<a class="collection-card" href="#/collections/${slug}">
    <img src="${image}" alt="${title}">
    <span>${title}</span>
    <p>${text}</p>
  </a>`;
}

function productsForCollection(slug) {
  const definition = collectionDefinitions[slug] || collectionDefinitions.leather;
  return publicProducts().filter(definition.matcher);
}

function lettaProducts(filter = "") {
  return publicProducts().filter(product => {
    if (product.brand !== "Letta & Luna") return false;
    if (!filter) return true;
    return product.ageGroup === filter || product.season === filter || product.collection === filter || (product.collections || []).includes(filter);
  });
}

function productShelf(kicker, title, items, href = "#/shop") {
  const publicItems = items.filter(isPublicProduct);
  if (!publicItems.length) return "";
  return `<section class="section-title"><p>${kicker}</p><h2>${title}</h2></section>
    <section class="product-grid">${publicItems.slice(0, 4).map(card).join("")}</section>
    <div class="section-action"><a class="button" href="${href}">Kollektion ansehen</a></div>`;
}

function campaignImage(slug, index = 1) {
  return `/banners/${slug}/campaign-${String(index).padStart(2, "0")}.jpg`;
}

function selectCampaign(slug, index) {
  const main = document.querySelector(`#campaign-${slug}`);
  if (main) main.src = campaignImage(slug, index);
  document.querySelectorAll(`[data-campaign="${slug}"]`).forEach(button => {
    button.classList.toggle("active", Number(button.dataset.index) === Number(index));
  });
}

function campaignMedia(slug, alt) {
  return `<div class="campaign-hero-media">
    <img id="campaign-${slug}" class="campaign-hero-image" src="${campaignImage(slug)}" alt="${alt}">
    <div class="campaign-thumbs" aria-label="${alt} campaign banners">
      ${[1, 2, 3, 4, 5].map(index => `<button class="${index === 1 ? "active" : ""}" data-campaign="${slug}" data-index="${index}" onclick="selectCampaign('${slug}', ${index})" aria-label="Campaign ${index}"><img src="${campaignImage(slug, index)}" alt=""></button>`).join("")}
    </div>
  </div>`;
}

function brandSpotlight(slug, kicker, title, text, cta, collectionSlug) {
  const brand = brandDefinitions[slug];
  return `<section class="brand-spotlight brand-spotlight-${slug}">
    <img src="${campaignImage(slug, 2)}" alt="${brand.name} campaign">
    <div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${text}</p><div class="hero-actions"><a class="button" href="#/brand/${slug}">${cta}</a><a class="link" href="#/collections/${collectionSlug}">Shop collection</a></div></div>
  </section>`;
}

function setLettaFilter(filter) {
  localStorage.setItem("lettaKidsFilter", filter);
  renderCollection("kidswear");
}

function lettaFilterChips(activeFilter = "") {
  const filters = ["Alle", "Baby", "Toddler", "Boys", "Girls", "Summer", "Winter", "New Arrivals"];
  return `<section class="kids-filter-bar">${filters.map(filter => {
    const value = filter === "Alle" ? "" : filter;
    return `<button class="${value === activeFilter ? "active" : ""}" onclick="setLettaFilter('${value}')">${filter}</button>`;
  }).join("")}</section>`;
}

function renderLettaBrandLanding() {
  const brand = brandDefinitions["letta-luna"];
  const brandProducts = lettaProducts();
  const heroProduct = brandProducts.find(product => product.featured) || brandProducts[0] || {};
  const baby = lettaProducts("Baby");
  const girls = lettaProducts("Girls");
  const boys = lettaProducts("Boys");
  const winter = lettaProducts("Winter");
  updateSeo("Letta & Luna Kidswear", "Premium Kinderkleidung fuer Baby, Maedchen und Jungen. Weiche Stoffe, warme Farben und bequeme Alltagslooks.", campaignImage("letta-luna"));
  page("", `<section class="brand-hero letta-hero">
    ${campaignMedia("letta-luna", "Letta & Luna Kidswear")}
    <div><p class="eyebrow">Letta & Luna Kidswear</p><h1>${brand.name}</h1><p>Weiche Kinderkleidung fuer kleine Alltagsabenteuer: bequem, warm, verspielt und kuratiert fuer Familien, die Premium-Looks ohne steife Formalitaet lieben.</p><div class="hero-actions"><a class="button" href="#/collections/kidswear">Kidswear entdecken</a><a class="link" href="#/collections/new-arrivals">Neue Teile</a></div></div>
  </section>
  <section class="letta-mood">
    <article><h2>Soft by nature</h2><p>Sanfte Farben, praktische Schnitte und ein Look, der Kinder frei spielen laesst.</p></article>
    <article><h2>Everyday comfort</h2><p>Baby, Toddler, Boys und Girls Pieces fuer Kita, Schule, Wochenenden und Familienmomente.</p></article>
    <article><h2>Warmly curated</h2><p>Die Kollektion bleibt bewusst weich, familiennah und premium, ohne ueberladen zu wirken.</p></article>
  </section>
  ${lettaFilterChips("")}
  ${productShelf("Letta & Luna", "New Arrivals", lettaProducts("New Arrivals"), "#/collections/kidswear")}
  ${productShelf("Bestseller", "Beliebte Kidswear", brandProducts.filter(product => product.bestseller), "#/collections/kidswear")}
  ${productShelf("Baby Collection", "Sanfte Looks fuer die Kleinsten", baby, "#/collections/kidswear")}
  ${productShelf("Girls Collection", "Verspielte Maedchen-Looks", girls, "#/collections/kidswear")}
  ${productShelf("Boys Collection", "Bequeme Jungen-Outfits", boys, "#/collections/kidswear")}
  ${productShelf("Winter Edit", "Warme Layer fuer kuehle Tage", winter, "#/collections/kidswear")}
  ${newsletterSection()}`, "");
}

function renderKidswearCollection() {
  const activeFilter = localStorage.getItem("lettaKidsFilter") || "";
  const items = lettaProducts(activeFilter);
  const heroProduct = items[0] || lettaProducts()[0] || {};
  const label = activeFilter || "Kidswear";
  updateSeo(`Letta & Luna ${label}`, `Shop Letta & Luna ${label}. Premium Kidswear fuer Baby, Toddler, Girls und Boys.`, mainImage(heroProduct));
  page("Kidswear", `<section class="collection-hero letta-collection-hero"><img src="${mainImage(heroProduct)}" alt="${label}"><div><p class="eyebrow">Letta & Luna Collection</p><h2>${label}</h2><p>Weiche Premium-Kinderkleidung fuer Alltag, Kita, Schule und Familienmomente.</p></div></section>${lettaFilterChips(activeFilter)}<section class="catalog-meta"><strong>${items.length} Produkte</strong><span>Gefiltert nach ${label}. Alle Bilder sind lokal gespeichert.</span></section><section class="product-grid">${items.map(card).join("") || "<p class='empty-inline'>Keine Produkte fuer diesen Filter gefunden.</p>"}</section>`, "Letta & Luna Kidswear");
}

function renderFashionBrandLanding(slug) {
  const brand = brandDefinitions[slug];
  const items = publicProducts().filter(product => product.brand === brand.name);
  const heroProduct = items.find(product => product.featured) || items[0] || {};
  const isDenim = slug === "custom-denim-studio";
  const filters = isDenim
    ? [["Jeans", "jeans"], ["Jackets", "denim-jackets"], ["Shirts", "denim-shirts"], ["Men's Denim", "mens-denim"], ["Women's Denim", "womens-denim"]]
    : [["Hoodies", "hoodies"], ["Sweatshirts", "sweatshirts"], ["T-Shirts", "t-shirts"], ["Women's Collection", "womens-apparel"], ["Men's Collection", "mens-apparel"], ["Bestsellers", "apparel-bestsellers"]];
  const story = isDenim
    ? "Indigo, utility and modern industrial detailing. Custom Denim Studio is prepared as an AI-ready denim world with jeans, jackets and shirts."
    : "Clean silhouettes, quiet colors and modern wardrobe pieces. LoomingsThread Apparel is built as a contemporary capsule brand for men and women.";
  updateSeo(brand.name, `${brand.name} at LoomingsThread. ${story}`, campaignImage(slug));
  page("", `<section class="brand-hero fashion-hero ${isDenim ? "denim-hero" : "apparel-hero"}">
    ${campaignMedia(slug, brand.name)}
    <div><p class="eyebrow">${isDenim ? "Denim Heritage" : "Contemporary Apparel"}</p><h1>${brand.name}</h1><p>${story}</p><div class="hero-actions"><a class="button" href="#/collections/${isDenim ? "denim" : "hoodies"}">Shop ${brand.collection}</a><a class="link" href="#/shop">One cart. One checkout.</a></div></div>
  </section>
  <section class="fashion-filter-row">${filters.map(([label, collection]) => `<a href="#/collections/${collection}">${label}</a>`).join("")}</section>
  <section class="brand-story-grid">
    <article><h2>${isDenim ? "Indigo identity" : "Minimal identity"}</h2><p>${isDenim ? "A deeper blue palette and structured denim categories give the brand a distinct industrial mood." : "A quieter palette, clean forms and premium basics give the brand a modern fashion mood."}</p></article>
    <article><h2>AI-ready imagery</h2><p>Every product includes stable hero, front, back, detail and lifestyle image slots.</p></article>
    <article><h2>Unified commerce</h2><p>Wishlist, cart, checkout, account and order flows stay shared across all LoomingsThread brands.</p></article>
  </section>
  ${productShelf(brand.name, "New arrivals", items.filter(product => product.newArrival), "#/collections/new-arrivals")}
  ${productShelf(brand.name, "Bestsellers", items.filter(product => product.bestseller), isDenim ? "#/collections/denim" : "#/collections/apparel-bestsellers")}
  <section class="section-title"><p>${brand.name}</p><h2>Complete edit</h2></section>
  <section class="product-grid">${items.slice(0, 12).map(card).join("")}</section>`, "");
}

function renderBrandLanding(slug = "the-leather-atelier") {
  if (slug === "letta-luna") {
    renderLettaBrandLanding();
    return;
  }
  if (slug === "custom-denim-studio" || slug === "loomingsthread-apparel") {
    renderFashionBrandLanding(slug);
    return;
  }
  const brand = brandDefinitions[slug] || brandDefinitions["the-leather-atelier"];
  const brandProducts = publicProducts().filter(product => product.brand === brand.name);
  const heroProduct = brandProducts.find(product => product.featured) || brandProducts[0] || publicProducts()[0] || {};
  updateSeo(brand.name, `${brand.name} at LoomingsThread. ${brand.focus}. ${brand.story}`, campaignImage(slug));
  page("", `<section class="brand-hero leather-campaign-hero">
    ${campaignMedia(slug, brand.name)}
    <div><p class="eyebrow">LoomingsThread Brand</p><h1>${brand.name}</h1><p>${brand.story}</p><a class="button" href="#/collections/${slug === "the-leather-atelier" ? "leather" : slug === "letta-luna" ? "kidswear" : slug === "custom-denim-studio" ? "denim" : "men"}">Shop ${brand.collection}</a></div>
  </section>
  <section class="brand-story-grid">
    <article><h2>Brand story</h2><p>${brand.story} Built as part of the LoomingsThread platform for premium European customers.</p></article>
    <article><h2>Collections</h2><p>${brand.focus}</p></article>
    <article><h2>Quality promise</h2><p>Clean product pages, local images, clear checkout, wishlist, account, returns and tracked shipping are prepared across the storefront.</p></article>
  </section>
  ${trustSection()}
  <section class="section-title"><p>${brand.name}</p><h2>Featured products</h2></section>
  <section class="product-grid">${(brandProducts.length ? brandProducts : publicProducts().slice(0, 4)).slice(0, 8).map(card).join("")}</section>
  <section class="editorial-band"><div><p class="eyebrow">New arrivals</p><h2>Discover the latest ${brand.collection.toLowerCase()} edit.</h2></div><p>Future drops, seasonal edits and brand-specific campaigns can be managed through the existing product/admin structure.</p><a class="button" href="#/shop">Shop all</a></section>`, "");
}

function renderCollection(slug = "leather") {
  if (slug === "kidswear") {
    renderKidswearCollection();
    return;
  }
  const definition = collectionDefinitions[slug] || collectionDefinitions.leather;
  const items = productsForCollection(slug);
  const heroProduct = items[0];
  const campaignSlug = ["denim", "jeans", "denim-jackets", "denim-shirts", "mens-denim", "womens-denim"].includes(slug) ? "custom-denim-studio"
    : ["hoodies", "sweatshirts", "t-shirts", "womens-apparel", "mens-apparel", "apparel-new-arrivals", "apparel-bestsellers"].includes(slug) ? "loomingsthread-apparel"
    : "the-leather-atelier";
  const heroImage = heroProduct ? mainImage(heroProduct) : campaignImage(campaignSlug);
  updateSeo(`${definition.title} Collection`, `Shop ${definition.title} at LoomingsThread. Premium fashion, leather goods and lifestyle products.`, heroImage);
  page(definition.title, `<section class="collection-hero"><img src="${heroImage}" alt="${definition.title}"><div><p class="eyebrow">Collection</p><h2>${definition.title}</h2><p>Curated products from the LoomingsThread multi-brand platform.</p></div></section><section class="catalog-meta"><strong>${items.length} products</strong><span>${items.length ? "Premium local catalog with a streamlined shopping experience." : "New product photography is currently in production. The collection returns when the full galleries are approved."}</span></section><section class="product-grid">${items.map(card).join("") || "<p class='empty-inline'>Diese Kollektion wird mit neuer Produktfotografie vorbereitet.</p>"}</section>`, "LoomingsThread Collections");
}

function renderWholesale() {
  updateSeo("Wholesale and Private Label", "Wholesale orders, private label, OEM production and retailer applications for LoomingsThread.");
  page("", `<section class="b2b-hero"><div><p class="eyebrow">LoomingsThread Partners</p><h1>Built for considered retail.</h1><p>Curated multi-brand collections, clear minimum quantities and a direct path from first enquiry to long-term partnership.</p><a class="button" href="#wholesale-form">Partner werden</a></div></section>
  <section class="b2b-pillars"><article><span>01</span><h2>Distributor application</h2><p>Introduce your market, retail network and territory plans.</p></article><article><span>02</span><h2>MOQ enquiry</h2><p>Request collection-specific minimum quantities and indicative commercial terms.</p></article><article><span>03</span><h2>Wholesale registration</h2><p>Create a structured partner profile for future account approval.</p></article></section>
  <section class="wholesale-layout" id="wholesale-form">
    <article><p class="eyebrow">Selected partners</p><h2>Tell us how you want to work together.</h2><p>Applications are stored locally in this demo. A future CRM or commerce backend can receive the same structured data without redesigning this experience.</p><dl class="b2b-facts"><div><dt>Brands</dt><dd>4 curated worlds</dd></div><div><dt>Markets</dt><dd>Germany and Europe</dd></div><div><dt>Enquiries</dt><dd>Wholesale, distribution, MOQ</dd></div></dl></article>
    <form class="contact-form premium-form" onsubmit="saveWholesaleApplication(event)">
      <div class="two"><label>Company<input required name="company" placeholder="Company name"></label><label>Contact person<input required name="contact" placeholder="Full name"></label></div>
      <div class="two"><label>Business email<input required type="email" name="email" placeholder="name@company.com"></label><label>Phone<input name="phone" placeholder="+49"></label></div>
      <div class="two"><label>Application type<select name="interest"><option>Wholesale registration</option><option>Distributor application</option><option>MOQ inquiry</option><option>Private label</option></select></label><label>Primary market<input name="market" placeholder="Germany, Benelux, EU..."></label></div>
      <div class="two"><label>Brand interest<select name="brand"><option>All LoomingsThread brands</option>${Object.values(brandDefinitions).map(brand => `<option>${brand.name}</option>`).join("")}</select></label><label>Indicative quantity<input name="quantity" type="number" min="1" placeholder="100"></label></div>
      <label>Business profile<textarea name="message" required placeholder="Tell us about your stores, channels, target customer and collection interest"></textarea></label>
      <label class="check"><input required type="checkbox"> I confirm that this is a business enquiry.</label>
      <button class="button">Submit partner application</button>
    </form>
  </section>`, "LoomingsThread B2B");
}

function saveWholesaleApplication(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  wholesaleApplications.unshift({ id: `B2B-${Date.now()}`, ...data, createdAt: new Date().toISOString(), status: "New" });
  saveAcquisitionData();
  event.target.reset();
  alert("Vielen Dank. Ihre Partneranfrage wurde lokal gespeichert.");
}

function renderProductionRequest() {
  updateSeo("Custom Production", "Custom manufacturing, quantity and logo customization requests for LoomingsThread.");
  page("", `<section class="production-hero"><div><p class="eyebrow">LoomingsThread Production</p><h1>Your concept.<br>Our structured brief.</h1><p>From tailored quantities to private-label details, submit a clear manufacturing request for review.</p></div></section>
  <section class="production-layout">
    <aside><p class="eyebrow">Request framework</p><h2>Designed for serious product conversations.</h2><ol><li><span>01</span>Choose a product direction and target quantity.</li><li><span>02</span>Describe material, branding and customization needs.</li><li><span>03</span>Share timing, target market and contact details.</li></ol></aside>
    <form class="contact-form premium-form" onsubmit="saveProductionRequest(event)">
      <div class="two"><label>Company<input required name="company"></label><label>Contact person<input required name="contact"></label></div>
      <div class="two"><label>Email<input required name="email" type="email"></label><label>Phone<input name="phone"></label></div>
      <div class="two"><label>Brand direction<select name="brand">${Object.values(brandDefinitions).map(brand => `<option>${brand.name}</option>`).join("")}<option>New private label</option></select></label><label>Product type<input required name="productType" placeholder="Denim jacket, leather bag..."></label></div>
      <div class="two"><label>Requested quantity<input required name="quantity" type="number" min="1"></label><label>Target delivery<input name="targetDate" type="date"></label></div>
      <label>Logo customization<select name="logoCustomization"><option>No logo customization</option><option>Woven label</option><option>Embroidery</option><option>Print</option><option>Embossed leather mark</option><option>Custom packaging</option></select></label>
      <label>Material and construction brief<textarea name="materials" placeholder="Preferred feel, weight, color, trims or performance requirements"></textarea></label>
      <label>Project notes<textarea name="notes" required placeholder="Target market, intended use, reference products and commercial goals"></textarea></label>
      <button class="button">Submit production request</button>
    </form>
  </section>`, "Custom manufacturing");
}

function saveProductionRequest(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  productionRequests.unshift({ id: `PR-${Date.now()}`, ...data, createdAt: new Date().toISOString(), status: "New" });
  saveAcquisitionData();
  event.target.reset();
  alert("Ihre Produktionsanfrage wurde lokal gespeichert.");
}

function renderShop() {
  const visibleProducts = publicProducts();
  const folders = [t("all"), ...new Set(visibleProducts.map(product => product.folder))];
  page("Shop", `
    <section class="shop-tools">
      <label><span>${t("search")}</span><input id="search" placeholder="Wallet, Tasche, SKU, Material"></label>
      <label><span>Kategorie</span><select id="folder">${folders.map(folder => `<option>${folder}</option>`).join("")}</select></label>
      <label><span>Sortierung</span><select id="sort"><option value="featured">Atelier Edit</option><option value="low">Preis aufsteigend</option><option value="high">Preis absteigend</option><option value="name">Name</option></select></label>
    </section>
    <section class="catalog-meta"><strong id="resultCount"></strong><span>PayPal, Klarna, Stripe und Vorkasse sind strukturell vorbereitet, aber nicht live verbunden.</span></section>
    <section id="grid" class="product-grid"></section>
  `);
  const filter = localStorage.getItem("atelierCollectionFilter");
  if (filter) {
    const select = document.querySelector("#folder");
    if ([...select.options].some(option => option.value === filter)) select.value = filter;
    localStorage.removeItem("atelierCollectionFilter");
  }
  const refresh = () => {
    const query = document.querySelector("#search").value.toLowerCase();
    const folder = document.querySelector("#folder").value;
    const sort = document.querySelector("#sort").value;
    let visible = visibleProducts.filter(product => {
      const haystack = `${product.name} ${product.category} ${product.material} ${product.leatherType} ${product.articleNumber || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(query) && (folder === t("all") || product.folder === folder);
    });
    if (sort === "low") visible.sort((a, b) => a.retailPriceEUR - b.retailPriceEUR);
    if (sort === "high") visible.sort((a, b) => b.retailPriceEUR - a.retailPriceEUR);
    if (sort === "name") visible.sort((a, b) => a.name.localeCompare(b.name));
    document.querySelector("#resultCount").textContent = `${visible.length} Produkte`;
    document.querySelector("#grid").innerHTML = visible.map(card).join("");
  };
  document.querySelectorAll("#search,#folder,#sort").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function galleryMarkup(product) {
  const images = publicProductImages(product);
  currentGalleryImages = images;
  currentGalleryIndex = 0;
  return `<div class="product-gallery" ontouchstart="galleryTouchStart(event)" ontouchend="galleryTouchEnd(event)">
    <button class="gallery-zoom" onclick="openZoom()">Zoom</button>
    <img id="mainProductImage" class="gallery-main-image" src="${images[0]}" alt="${displayProductTitle(product)}" onclick="openZoom()">
    <div class="thumbnail-row">${images.map((src, index) => `<button class="gallery-thumb${index === 0 ? " active" : ""}" onclick="selectGalleryImage(${index})"><img src="${src}" alt="${displayProductTitle(product)} image ${index + 1}"></button>`).join("")}</div>
  </div>`;
}

function selectGalleryImage(index) {
  currentGalleryIndex = index;
  const img = document.querySelector("#mainProductImage");
  if (img) img.src = currentGalleryImages[index];
  document.querySelectorAll(".gallery-thumb").forEach((button, buttonIndex) => button.classList.toggle("active", buttonIndex === index));
}

function galleryTouchStart(event) {
  touchStartX = event.changedTouches[0].screenX;
}

function galleryTouchEnd(event) {
  const delta = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) < 40 || currentGalleryImages.length < 2) return;
  const next = delta < 0
    ? (currentGalleryIndex + 1) % currentGalleryImages.length
    : (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
  selectGalleryImage(next);
}

function openZoom() {
  if (!currentGalleryImages.length) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="zoom-modal" onclick="closeZoom()"><button onclick="closeZoom()">Close</button><img src="${currentGalleryImages[currentGalleryIndex]}" alt="Zoomed product image"></div>`);
}

function closeZoom() {
  document.querySelector(".zoom-modal")?.remove();
}

function rememberProduct(slug) {
  recentlyViewed = [slug, ...recentlyViewed.filter(item => item !== slug)].slice(0, 8);
  saveState();
}

function renderProduct(slug) {
  const product = getProduct(slug);
  if (!isPublicProduct(product)) {
    page("Produkt nicht verfuegbar", `<section class="empty"><p>Dieses Produkt ist aktuell nicht im Shop sichtbar.</p><a class="button" href="#/shop">Zur Kollektion</a></section>`);
    return;
  }
  trackCommerceEvent("productViews", product.slug);
  rememberProduct(product.slug);
  const colors = productColors(product);
  const sizes = productSizes(product);
  const related = publicProducts().filter(item => item.folder === product.folder && item.slug !== product.slug).slice(0, 4);
  const recent = recentlyViewed.map(getProduct).filter(Boolean).filter(isPublicProduct).filter(item => item.slug !== product.slug).slice(0, 4);
  const sale = product.saleActive && Number(product.salePriceEur) > 0;
  const out = !product.inStock || Number(product.stockQty) <= 0;
  const bullets = (product.bulletPoints || []).slice(0, 6);
  const reviews = reviewsFor(product.slug);
  const review = reviewSummary(product.slug);
  updateSeo(productOgTitle(product), productOgDescription(product), productOgImage(product));
  page("", `
    <section class="detail">
      ${galleryMarkup(product)}
      <div class="detail-copy">
        <p class="eyebrow">${product.brand || "LoomingsThread"} / ${titleCase(product.category)}</p>
        <h2>${displayProductTitle(product)}</h2>
        <p class="price">${sale ? `<s>${euro(regularPrice(product))}</s> ` : ""}${euro(productPrice(product))} ${sale ? "<span class='sale-inline'>Sale</span>" : ""}</p>
        <p>${product.descriptionDe || product.description}</p>
        ${bullets.length ? `<ul class="bullets">${bullets.map(point => `<li>${point}</li>`).join("")}</ul>` : ""}
        <div class="spec-panel"><h3>Produktspezifikationen</h3><dl><div><dt>Material</dt><dd>${product.materialDe || product.material}</dd></div>${isLeatherProduct(product) ? `<div><dt>Lederart</dt><dd>${product.leatherTypeDe || leatherType(product) || "Wird geprueft"}</dd></div>` : ""}<div><dt>Artikelnummer</dt><dd>${product.articleNumber}</dd></div><div><dt>Masse</dt><dd>${product.dimensions || "Nicht angegeben"}</dd></div><div><dt>Farboptionen</dt><dd>${colors.join(", ")}</dd></div><div><dt>Groessen</dt><dd>${sizes.join(", ")}</dd></div><div><dt>Gallery</dt><dd>${publicProductImages(product).length} Bilder</dd></div></dl></div>
        <label>Farbe / Color<select id="color">${colors.map(color => `<option>${color}</option>`).join("")}</select></label>
        <label>Groesse / Size<select id="size">${sizes.map(size => `<option>${size}</option>`).join("")}</select></label>
        <label>Menge / Quantity<input id="qty" type="number" min="1" value="1"></label>
        <button class="button wide" ${out ? "disabled" : ""} onclick="addToCart('${product.slug}', Number(document.querySelector('#qty').value), document.querySelector('#color').value, document.querySelector('#size').value)">${out ? "Ausverkauft" : t("add")}</button>
        <button class="ghost wide" onclick="toggleWishlist('${product.slug}')">${wishlist.includes(product.slug) ? "Aus Wunschliste entfernen" : "Zur Wunschliste"}</button>
        <div class="product-accordions"><details open><summary>Material and care</summary><p>${product.materialDe || product.material || "Premium material"} - ${product.careInstructionsDe || "Mit einem weichen, trockenen Tuch reinigen und vor dauerhafter Naesse schuetzen."}</p></details><details><summary>Shipping</summary><p>Deutschland, Oesterreich, Belgien, Niederlande und Luxemburg sind im Checkout vorbereitet.</p></details><details><summary>Returns</summary><p>14 Tage Rueckgabeinformation ist im Checkout und in der Widerrufsbelehrung vorgesehen.</p></details></div>
        <div class="brand-teaser"><span>${product.brand || "LoomingsThread"}</span><p>${Object.values(brandDefinitions).find(brand => brand.name === product.brand)?.story || "Part of the LoomingsThread premium multi-brand platform."}</p></div>
        <div class="mobile-sticky-atc"><strong>${euro(productPrice(product))}</strong><button class="button" ${out ? "disabled" : ""} onclick="addToCart('${product.slug}', Number(document.querySelector('#qty').value), document.querySelector('#color').value, document.querySelector('#size').value)">${out ? "Ausverkauft" : t("add")}</button></div>
      </div>
    </section>
    <section class="product-info-tabs">
      <article><h3>Material</h3><p>${product.materialDe || product.material}</p></article>
      ${isLeatherProduct(product) ? `<article><h3>Lederart</h3><p>${product.leatherTypeDe || leatherType(product) || "Wird geprueft"}</p></article>` : ""}
      <article><h3>Care</h3><p>${product.careInstructionsDe || "Mit einem weichen, trockenen Tuch reinigen."}</p></article>
      <article><h3>Delivery</h3><p>Standardversand ab ${euro(5.9)}. Kostenlos ab ${euro(250)} Warenwert.</p></article>
    </section>
    <section class="product-story">
      <div><p class="eyebrow">The product story</p><h2>Made to belong in your everyday.</h2></div>
      <p>${productStory(product)}</p>
    </section>
    <section class="feature-grid">${productFeatures(product)}</section>
    <section class="delivery-promise">
      <article><span>Delivery</span><strong>${shippingEstimate("Deutschland")}</strong><p>Tracked shipping with the available carrier selected during checkout.</p></article>
      <article><span>Returns</span><strong>14 days</strong><p>Clear return information for orders delivered within the supported markets.</p></article>
      <article><span>Service</span><strong>Personal support</strong><p>Questions about fit, materials or care can be sent through our contact page.</p></article>
    </section>
    <section class="review-section" id="reviews">
      <div class="review-summary"><p class="eyebrow">Customer reviews</p><h2>${review.count ? `${review.average} / 5` : "Be the first to review"}</h2>${starsMarkup(review.average)}<p>${review.count} verified-style local demo review${review.count === 1 ? "" : "s"}</p></div>
      <div class="review-list">${reviews.length ? reviews.map(item => `<article><header>${starsMarkup(item.rating)}<time>${new Date(item.createdAt).toLocaleDateString("de-DE")}</time></header><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><span>${escapeHtml(item.name)}</span>${item.photoPlaceholders?.length ? `<small>Selected photo files: ${item.photoPlaceholders.map(escapeHtml).join(", ")}</small>` : ""}</article>`).join("") : `<article class="review-empty"><p>Noch keine Bewertungen. Teilen Sie Ihre Erfahrung mit diesem Produkt.</p></article>`}</div>
      <form class="review-form" onsubmit="submitReview(event, '${product.slug}')">
        <p class="eyebrow">Review submission</p><h3>Ihre Bewertung</h3>
        <div class="two"><label>Name<input required name="name"></label><label>Rating<select required name="rating"><option value="5">5 - Excellent</option><option value="4">4 - Very good</option><option value="3">3 - Good</option><option value="2">2 - Fair</option><option value="1">1 - Poor</option></select></label></div>
        <label>Title<input required name="title" maxlength="80"></label>
        <label>Review<textarea required name="text" maxlength="800"></textarea></label>
        <label>Photos (filename preview)<input name="photos" type="file" accept="image/*" multiple></label>
        <small>Photo filenames are stored locally for review; image upload activates with the production backend.</small>
        <button class="button">Submit review</button>
      </form>
    </section>
    <section class="section-title"><p>Passend dazu</p><h2>Related products</h2></section>
    <section class="product-grid compact-grid">${related.map(card).join("")}</section>
    <section class="section-title"><p>Zuletzt angesehen</p><h2>Recently viewed</h2></section>
    <section class="product-grid compact-grid">${recent.length ? recent.map(card).join("") : "<p class='empty-inline'>Noch keine weiteren Produkte angesehen.</p>"}</section>
  `);
}

function renderCart() {
  const entries = publicCartEntries();
  if (!entries.length) {
    page("Warenkorb", `<section class="empty"><p>${t("empty")}</p><a class="button" href="#/shop">${t("continue")}</a></section>`);
    return;
  }
  const country = "Deutschland";
  const subtotal = cartSubtotal();
  const discount = cartDiscount();
  const shipping = shippingPrice(country);
  const total = cartTotal(country);
  page("Warenkorb", `
    <section class="cart-layout">
      <div class="cart-list">${entries.map(({ item, index, product }) => {
        return `<article class="cart-item"><img src="${mainImage(product)}" alt="${product.name}"><div><h3>${titleCase(product.name)}</h3><p>${item.color} / ${item.size}</p><strong>${euro(product.priceEur || product.retailPriceEUR)}</strong></div><div class="qty-stepper"><button type="button" onclick="setQty(${index}, ${item.qty - 1})">-</button><input type="number" min="1" value="${item.qty}" onchange="setQty(${index}, Number(this.value))"><button type="button" onclick="setQty(${index}, ${item.qty + 1})">+</button></div><button class="ghost danger" onclick="removeItem(${index})">Entfernen</button></article>`;
      }).join("")}</div>
      <aside class="summary"><h2>Warenkorb</h2>
        <dl class="totals"><div><dt>Zwischensumme</dt><dd>${euro(subtotal)}</dd></div><div><dt>Rabatt</dt><dd>-${euro(discount)}</dd></div><div><dt>Versand Deutschland</dt><dd>${euro(shipping)}</dd></div><div><dt>inkl. MwSt.</dt><dd>${euro(vatAmount(country))}</dd></div></dl>
        <strong>${euro(total)}</strong>
        <label>Coupon Code<input value="${discountCode}" placeholder="ATELIER10" onchange="discountCode=this.value; saveState(); renderCart();"></label>
        <a class="button wide" href="#/checkout">${t("checkout")}</a>
      </aside>
    </section>
  `);
}

function renderCheckout() {
  const selectedCountry = localStorage.getItem("atelierShippingCountry") || "Deutschland";
  const shipping = shippingPrice(selectedCountry);
  const total = cartTotal(selectedCountry);
  const methods = paymentMethods();
  const shipMethods = shippingMethods(selectedCountry);
  const items = publicCartEntries().map(({ item, product }) => {
    return `<li>${item.qty} x ${titleCase(product.name)} <span>${euro(productPrice(product) * item.qty)}</span></li>`;
  }).join("");
  page("Checkout", `
    <form class="checkout" onsubmit="createOrderFromCheckout(event)">
      <section>
        <h2>Kundendaten</h2>
        <div class="two"><input name="firstName" required placeholder="First Name / Vorname" value="${accountProfile?.firstName || ""}"><input name="lastName" required placeholder="Last Name / Nachname" value="${accountProfile?.lastName || ""}"></div>
        <input name="company" placeholder="Company / Firma">
        <div class="two"><input name="email" required type="email" placeholder="Email" value="${accountProfile?.email || ""}"><input name="phone" required placeholder="Phone / Telefon"></div>
        <h2>Shipping Address / Lieferadresse</h2>
        <div class="two"><input name="street" required placeholder="Street / Strasse"><input name="houseNumber" required placeholder="House Number / Hausnummer"></div>
        <div class="two"><input name="zip" required placeholder="ZIP / PLZ"><input name="city" required placeholder="City / Stadt"></div>
        <label>Country / Land<select id="checkoutCountry" name="country" onchange="localStorage.setItem('atelierShippingCountry', this.value); renderCheckout();">
          ${checkoutCountries.filter(item => shippingZone(item.country).enabled !== false).map(item => `<option${item.country === selectedCountry ? " selected" : ""}>${item.country}</option>`).join("")}
        </select></label>
        <label class="check"><input type="checkbox" id="billingToggle" onchange="document.querySelector('#billingAddress').hidden=!this.checked"> Billing address differs / Rechnungsadresse abweichend</label>
        <div id="billingAddress" hidden><h2>Billing Address / Rechnungsadresse</h2><div class="two"><input name="billingStreet" placeholder="Street / Strasse"><input name="billingHouseNumber" placeholder="House Number / Hausnummer"></div><div class="two"><input name="billingZip" placeholder="ZIP / PLZ"><input name="billingCity" placeholder="City / Stadt"></div></div>
      </section>
      <section>
        <h2>Shipping</h2>
        <div class="shipping-method-grid">
          ${shipMethods.length ? shipMethods.map((method, index) => `<label class="radio"><input name="shippingMethod" value="${method.id}" type="radio" ${index === 0 ? "checked" : ""}> ${method.label} - ${method.country} - ${euro(method.price)} - ${method.estimate}</label>`).join("") : `<p class="payment-empty">Shipping is currently unavailable for this country.</p>`}
        </div>
        <p class="shipping-note">${shipping === 0 ? "Free shipping threshold reached." : `Free shipping from ${euro(shippingZone(selectedCountry).freeThreshold)} for ${shippingZone(selectedCountry).label}.`}</p>
        <h2>Payment Methods</h2>
        <div class="payment-grid">
          ${methods.length ? methods.map((method, index) => `<label class="radio"><input name="paymentMethod" value="${method.id}" type="radio" ${index === 0 ? "checked" : ""} onchange="updateCheckoutPaymentNotice()"> ${method.label}</label>`).join("") : `<p class="payment-empty">No demo payment method is enabled. Please contact the atelier.</p>`}
        </div>
        <div id="paymentNotice" class="payment-note">${methods[0]?.notice || "No demo payment method is enabled."}</div>
        <label>Discount Code<input value="${discountCode}" placeholder="ATELIER10" onchange="discountCode=this.value; saveState(); renderCheckout();"></label>
        <div class="summary checkout-summary"><h2>Order Summary</h2><ul class="order-lines">${items || "<li>Keine Artikel im Warenkorb</li>"}</ul><dl class="totals"><div><dt>Subtotal</dt><dd>${euro(cartSubtotal())}</dd></div><div><dt>Discount</dt><dd>-${euro(cartDiscount())}</dd></div><div><dt>Shipping</dt><dd>${euro(shipping)}</dd></div><div><dt>incl. VAT</dt><dd>${euro(vatAmount(selectedCountry))}</dd></div></dl><strong>${euro(total)}</strong></div>
        <label class="check"><input required type="checkbox"> Ich akzeptiere AGB und Widerrufsbelehrung.</label>
        <label class="check"><input required type="checkbox"> Ich akzeptiere die Datenschutzerklaerung.</label>
        <label class="check"><input required type="checkbox"> Ich habe die 14-Tage-Rueckgabeinformation gelesen.</label>
        <button class="button wide" type="submit" ${methods.length && shipMethods.length ? "" : "disabled"}>${t("order")}</button>
      </section>
    </form>
  `);
}

function updateCheckoutPaymentNotice() {
  const selected = document.querySelector("input[name='paymentMethod']:checked")?.value;
  const method = paymentMethodById(selected);
  const notice = document.querySelector("#paymentNotice");
  if (notice) notice.textContent = method.notice;
}

function renderWishlist() {
  const saved = publicProducts().filter(product => wishlist.includes(product.slug));
  page("Wunschliste", saved.length ? `<section class="wishlist-toolbar"><p>${saved.length} gespeicherte Produkte</p><button class="ghost" onclick="wishlist=[]; saveState(); renderWishlist();">Wunschliste leeren</button></section><section class="product-grid">${saved.map(card).join("")}</section>` : `<section class="empty"><p>Noch keine Favoriten gespeichert.</p><a class="button" href="#/shop">Shop ansehen</a></section>`);
}

function demoLogin(event) {
  event.preventDefault();
  const form = event.target;
  saveAccountProfile({
    firstName: form.firstName.value || "Atelier",
    lastName: form.lastName.value || "Kunde",
    email: form.email.value,
    address: "Musterstrasse 1, 10115 Berlin"
  });
  location.hash = "#/account";
}

function renderLogin() {
  page("Login", `<section class="auth-layout"><form class="auth-card" onsubmit="demoLogin(event)"><p class="eyebrow">Customer Account</p><h2>Einloggen</h2><input name="email" required type="email" placeholder="E-Mail"><input name="password" required type="password" placeholder="Passwort"><input name="firstName" placeholder="Vorname"><input name="lastName" placeholder="Nachname"><button class="button wide">Login</button><p>Noch kein Konto? <a href="#/register">Jetzt registrieren</a></p></form></section>`);
}

function renderRegister() {
  page("Register", `<section class="auth-layout"><form class="auth-card" onsubmit="demoLogin(event)"><p class="eyebrow">LoomingsThread</p><h2>Konto erstellen</h2><div class="two"><input name="firstName" required placeholder="Vorname"><input name="lastName" required placeholder="Nachname"></div><input name="email" required type="email" placeholder="E-Mail"><input name="password" required type="password" placeholder="Passwort"><label class="check"><input required type="checkbox"> Ich akzeptiere Datenschutz und AGB.</label><button class="button wide">Konto erstellen</button></form></section>`);
}

function accountOrders() {
  const email = accountProfile?.email?.toLowerCase();
  const matches = email ? orders.filter(order => String(order.email || "").toLowerCase() === email) : [];
  return matches.length ? matches : orders;
}

function accountShell(section, body) {
  const profile = accountProfile || { firstName: "Gast", lastName: "Kunde", email: "gast@loomingsthread.de", phone: "", address: "Noch keine Standardadresse gespeichert." };
  page("Mein Konto", `<section class="account-dashboard portal-dashboard">
    <aside class="account-sidebar"><p class="eyebrow">Kundenportal</p><h2>${profile.firstName} ${profile.lastName}</h2><p>${profile.email}</p><nav class="account-nav"><a class="${section === "orders" ? "active" : ""}" href="#/account/orders">Bestellungen</a><a class="${section === "invoices" ? "active" : ""}" href="#/account/invoices">Rechnungen</a><a class="${section === "profile" ? "active" : ""}" href="#/account/profile">Profil</a><a class="${section === "addresses" ? "active" : ""}" href="#/account/addresses">Adressen</a><a href="#/wishlist">Wunschliste</a></nav><div class="account-actions"><a class="button" href="#/login">Login</a><a class="ghost" href="#/register">Registrieren</a></div>${accountProfile ? `<button class="ghost" onclick="localStorage.removeItem('atelierAccountProfile'); accountProfile=null; route();">Logout</button>` : ""}</aside>
    <div class="account-panels portal-panels">${body}</div>
  </section>`);
}

function renderAccount(section = "orders") {
  if (section === "invoices") return renderAccountInvoices();
  if (section === "profile") return renderAccountProfile();
  if (section === "addresses") return renderAccountAddresses();
  renderAccountOrders();
}

function renderAccountOrders() {
  const rows = accountOrders();
  accountShell("orders", rows.length ? `<article class="portal-wide"><h3>Meine Bestellungen</h3><div class="portal-list">${rows.map(order => `<section class="portal-order"><div><strong>${order.orderNumber}</strong><span>${new Date(order.orderDate).toLocaleDateString("de-DE")} - ${order.orderStatus}</span><small>Tracking: ${order.trackingNumber || "wird nach Versand ergaenzt"}</small></div><div><strong>${euro(order.total)}</strong><button class="ghost" onclick="reorderOrder('${order.orderNumber}')">Erneut bestellen</button><a class="ghost" href="#/account/invoices">Rechnung</a></div></section>`).join("")}</div></article>` : `<article><h3>Meine Bestellungen</h3><p>Noch keine Bestellungen vorhanden.</p><a class="button" href="#/shop">Shop ansehen</a></article>`);
}

function renderAccountInvoices() {
  const rows = accountOrders();
  accountShell("invoices", `<article class="portal-wide"><h3>Rechnungen</h3>${rows.length ? `<div class="portal-list">${rows.map(order => `<section class="portal-order"><div><strong>${order.invoiceNumber || invoiceNumber(order.orderNumber)}</strong><span>Bestellung ${order.orderNumber}</span><small>${order.paymentStatus || "Awaiting Payment"} - ${euro(order.total)}</small></div><button class="button" onclick="downloadCustomerInvoice('${order.orderNumber}')">Download invoice</button></section>`).join("")}</div>` : `<p>Noch keine Rechnungen vorhanden.</p>`}</article>`);
}

function renderAccountProfile() {
  const profile = accountProfile || { firstName: "", lastName: "", email: "", phone: "" };
  accountShell("profile", `<form class="portal-form" onsubmit="saveAccountProfileForm(event)"><h3>Profil aktualisieren</h3><div class="two"><label>Vorname<input name="firstName" value="${profile.firstName || ""}"></label><label>Nachname<input name="lastName" value="${profile.lastName || ""}"></label></div><div class="two"><label>E-Mail<input name="email" type="email" value="${profile.email || ""}"></label><label>Telefon<input name="phone" value="${profile.phone || ""}"></label></div><button class="button">Profil speichern</button></form>`);
}

function renderAccountAddresses() {
  accountShell("addresses", `<form class="portal-form" onsubmit="saveAccountAddressForm(event)"><h3>Adresse speichern</h3><div class="two"><label>Name<input name="name" required placeholder="Name"></label><label>Land<input name="country" value="Deutschland"></label></div><label>Strasse und Hausnummer<input name="street" required></label><div class="two"><label>PLZ<input name="zip" required></label><label>Stadt<input name="city" required></label></div><button class="button">Adresse speichern</button></form><article class="portal-wide"><h3>Gespeicherte Adressen</h3>${accountAddresses.length ? `<div class="portal-list">${accountAddresses.map((address, index) => `<section class="portal-order"><div><strong>${address.name}</strong><span>${address.street}, ${address.zip} ${address.city}</span><small>${address.country}</small></div><button class="ghost danger" onclick="removeAccountAddress(${index})">Entfernen</button></section>`).join("")}</div>` : `<p>Noch keine Adressen gespeichert.</p>`}</article>`);
}

function saveAccountProfileForm(event) {
  event.preventDefault();
  const form = event.target;
  saveAccountProfile({ firstName: form.firstName.value, lastName: form.lastName.value, email: form.email.value, phone: form.phone.value });
  renderAccountProfile();
}

function saveAccountAddressForm(event) {
  event.preventDefault();
  const form = event.target;
  accountAddresses = [{ name: form.name.value, street: form.street.value, zip: form.zip.value, city: form.city.value, country: form.country.value }, ...accountAddresses];
  saveAccountAddresses();
  renderAccountAddresses();
}

function removeAccountAddress(index) {
  accountAddresses.splice(index, 1);
  saveAccountAddresses();
  renderAccountAddresses();
}

function reorderOrder(orderNumber) {
  const order = orderByNumber(orderNumber);
  if (!order) return;
  cart = (order.products || []).map(item => ({ id: item.productId, qty: item.quantity, color: item.color || "", size: item.size || "" })).filter(item => isPublicProduct(getProduct(item.id)));
  saveState();
  location.hash = "#/cart";
}

function downloadCustomerInvoice(orderNumber) {
  const order = orderByNumber(orderNumber);
  if (!order) return;
  const text = [`${adminSettings.storeName}`, `Invoice ${order.invoiceNumber || invoiceNumber(order.orderNumber)}`, `Order ${order.orderNumber}`, `Customer: ${order.customerName}`, `Total: ${euro(order.total)}`, "", ...(order.products || []).map(item => `${item.quantity} x ${item.title} - ${euro(item.lineTotal)}`)].join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.invoiceNumber || invoiceNumber(order.orderNumber)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderAbout() {
  updateSeo("About The Leather Atelier", "Premium About Us page fuer The Leather Atelier by Looming Threads: handgemachte Lederwaren, zeitloses Design und Qualitaetsversprechen.");
  page("About Us", `<section class="brand-page">
    <article class="brand-intro"><p class="eyebrow">The Leather Atelier by Looming Threads</p><h2>Eine ruhige Luxusmarke fuer Lederwaren, die im Alltag bestehen.</h2><p>The Leather Atelier verbindet kuratierte handwerkliche Lederprodukte mit einer klaren deutschen Shopstruktur. Die Marke steht fuer Qualitaet vor Lautstaerke, langlebige Formen und einen Einkauf, der Vertrauen schafft.</p></article>
    <div class="brand-grid">
      <article><h3>Our Story</h3><p>Aus Looming Threads entsteht eine eigenstaendige Lederlinie fuer Kunden, die warme Materialien, klare Formen und bewusste Kaufentscheidungen schaetzen.</p></article>
      <article><h3>Handmade Craftsmanship</h3><p>Im Mittelpunkt stehen Details, Kanten, Naehte und Haptik, die ein Produkt auch nach Jahren wertig wirken lassen.</p></article>
      <article><h3>Premium Leather</h3><p>Leder wird wegen Griff, Struktur, Patina und Alltagstauglichkeit ausgewaehlt. Finale Spezifikationen werden vor Livegang produktweise geprueft.</p></article>
      <article><h3>Quality Promise</h3><p>Jede Produktseite ist auf transparente Materialien, Bilder, Varianten, Versand und Rueckgabe vorbereitet.</p></article>
      <article><h3>Sustainability</h3><p>Der nachhaltigste Gegenstand ist oft der, den man lange nutzt. The Leather Atelier setzt auf zeitloses Design statt schnelle Trends.</p></article>
      <article><h3>Why Choose The Leather Atelier</h3><p>Premium Look, lokale Bilder, strukturierter Checkout, Tracking-Versand, Trust-Elemente und German-market Launch Readiness.</p></article>
    </div>
  </section>`);
}

function renderContact() {
  updateSeo("Kontakt", "Kontakt zu The Leather Atelier by Looming Threads: WhatsApp, Business Email, Adresse und Kontaktformular als professionelle Platzhalter.");
  page("Kontakt", `<section class="contact-layout">
    <aside class="contact-card"><p class="eyebrow">Customer Care</p><h2>Wir helfen bei Produkten, Bestellungen und Launch-Fragen.</h2><p><strong>Business email:</strong><br>hello@loomingsthread.de</p><p><strong>Business address:</strong><br>LoomingsThread<br>Germany</p><a class="button wide" href="https://wa.me/">WhatsApp kontaktieren</a>${socialLinks()}</aside>
    <form class="contact contact-form" onsubmit="saveContactInquiry(event)">
      <div class="two"><input required name="name" placeholder="Name"><input required name="email" type="email" placeholder="Email"></div>
      <div class="two"><input name="phone" placeholder="Phone"><select name="type"><option>Contact request</option><option>Product inquiry</option><option>Wholesale inquiry</option></select></div>
      <input required name="subject" placeholder="Subject">
      <textarea required name="message" placeholder="Message"></textarea>
      <button class="button">Nachricht senden</button>
    </form>
  </section>`);
}

function saveContactInquiry(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  contactInquiries.unshift({
    id: `CONTACT-${Date.now()}`,
    ...data,
    status: "New",
    notes: "",
    createdAt: new Date().toISOString()
  });
  saveAcquisitionData();
  event.target.reset();
  alert("Danke. Deine Nachricht wurde lokal fuer den Kundenservice gespeichert.");
}

function renderFaq() {
  page("FAQ", `<section class="copy-page"><h2>Sind Zahlungen live?</h2><p>Nein. PayPal, Klarna, Stripe und Vorkasse sind nur Platzhalter.</p><h2>Sind die Bilder lokal gespeichert?</h2><p>Ja. Alle Produktbilder werden lokal aus dem Projektordner geladen.</p><h2>Gibt es 14 Tage Rueckgabe?</h2><p>Die Shop-Struktur zeigt die 14-Tage-Information. Finale Rechtstexte muessen vor Livegang geprueft werden.</p></section>`);
}

function renderBlog() {
  updateSeo("Journal", "Leather Journal von The Leather Atelier: Lederpflege, Wallet Guide, handmade leather und Travel Bags.");
  page("Journal", `<section class="blog-grid journal-list">${Object.entries(journalPosts).map(([slug, post]) => `<article><p class="eyebrow">${post.kicker}</p><h2>${post.title}</h2><p>${post.intro}</p><a class="button" href="#/blog/${slug}">Artikel lesen</a></article>`).join("")}</section>`);
}

function renderJournalPost(slug) {
  const post = journalPosts[slug] || journalPosts["leather-care-guide"];
  updateSeo(post.title, `${post.title} im Leather Journal von The Leather Atelier. ${post.intro}`);
  page(post.title, `<section class="copy-page journal-post"><p class="lead">${post.intro}</p><div class="legal-grid">${post.sections.map(([heading, text]) => `<article><h2>${heading}</h2><p>${text}</p></article>`).join("")}</div>${newsletterSection()}</section>`, post.kicker);
}

function renderBrandStory() {
  updateSeo("Brand Story", "Die Brand Story von The Leather Atelier: handmade leather products, timeless design, European customers und quality over mass production.");
  page("Brand Story", `<section class="brand-page">
    <article class="brand-intro"><p class="eyebrow">Quality over mass production</p><h2>Handmade leather products for European customers who value fewer, better things.</h2><p>The Leather Atelier by Looming Threads ist als Premium-Lederwelt aufgebaut: zeitlos, ruhig, produktnah und fuer echte Kunden in Deutschland und Europa vorbereitet.</p></article>
    <div class="story-timeline">
      <article><span>01</span><h3>Handmade Leather Products</h3><p>Die Kollektion richtet den Blick auf Verarbeitung, Materialgefuehl und Produkte, die im Alltag schoener altern.</p></article>
      <article><span>02</span><h3>Timeless Design</h3><p>Wallets, Card Holder, Business Bags, Duffle Bags, Ladies Bags und Belts folgen klaren Formen statt kurzlebigen Trends.</p></article>
      <article><span>03</span><h3>European Customers</h3><p>Checkout, MwSt., Versandzonen, Tracking, Widerruf und Datenschutz sind fuer einen deutschen Launch strukturell vorbereitet.</p></article>
      <article><span>04</span><h3>Not Mass Produced</h3><p>Die Marke positioniert sich gegen anonyme Massenware und fuer eine kuratierte, nachvollziehbare Produktwelt.</p></article>
    </div>
  </section>`);
}

function logoCard(slug, brand) {
  return `<article class="logo-system-card">
    <div class="logo-preview logo-preview-${slug}"><img src="${brand.logo}" alt="${brand.name} logo"></div>
    <div><p class="eyebrow">${brand.collection}</p><h3>${brand.name}</h3><p>${brand.story}</p><div class="logo-actions"><a class="ghost" href="${brand.logo}" download>SVG herunterladen</a><a href="#/brand/${slug}">Brand page</a></div></div>
  </article>`;
}

function renderBrandGuidelines() {
  updateSeo("Brand Guidelines", "LoomingsThread Brand Identity System: logos, colors, typography and visual style for all four fashion brands.");
  const identityCards = Object.entries(brandDefinitions).map(([slug, brand]) => logoCard(slug, brand)).join("");
  page("", `<section class="guidelines-hero"><div><img src="/logo/loomingsthread.svg" alt="LoomingsThread"><p class="eyebrow">Brand Identity System / Version 1.0</p><h1>Different voices.<br>One unmistakable house.</h1><p>This working identity system establishes a premium, consistent foundation for LoomingsThread and its four consumer brands.</p></div></section>
  <section class="guideline-nav"><a href="#logos">Logos</a><a href="#colors">Colors</a><a href="#type">Typography</a><a href="#usage">Usage</a><a href="#visuals">Visual style</a></section>
  <section class="guideline-section" id="logos"><div class="guideline-heading"><p class="eyebrow">01 / Logo system</p><h2>A family, not a uniform.</h2><p>Each mark has its own construction and mood. The parent house remains the endorsement layer across commerce, packaging and corporate communication.</p></div><div class="logo-system-grid"><article class="logo-system-card parent-logo-card"><div class="logo-preview"><img src="/logo/loomingsthread.svg" alt="LoomingsThread logo"></div><div><p class="eyebrow">Parent company</p><h3>LoomingsThread</h3><p>Use for the shared store, corporate communication and multi-brand campaigns.</p><a class="ghost" href="/logo/loomingsthread.svg" download>SVG herunterladen</a></div></article>${identityCards}</div></section>
  <section class="guideline-section color-guidelines" id="colors"><div class="guideline-heading"><p class="eyebrow">02 / Color</p><h2>Recognizable at a glance.</h2></div><div class="palette-grid">${Object.entries(brandDefinitions).map(([slug, brand]) => `<article><h3>${brand.name}</h3><div class="swatch-row">${brand.colors.map(color => `<span style="--swatch:${color}"><i></i><code>${color}</code></span>`).join("")}</div></article>`).join("")}</div></section>
  <section class="guideline-section type-guidelines" id="type"><div class="guideline-heading"><p class="eyebrow">03 / Typography</p><h2>Editorial character, digital clarity.</h2></div><div class="type-specimens"><article><span>Display / Georgia</span><h3>Craft, character and confidence.</h3><p>Used for campaign headlines, brand stories and key product moments.</p></article><article><span>Interface / Inter & system sans</span><h4>Precise information for modern commerce.</h4><p>Used for navigation, filters, prices, specifications and operational content.</p></article></div></section>
  <section class="guideline-section usage-guidelines" id="usage"><div class="guideline-heading"><p class="eyebrow">04 / Logo usage</p><h2>Give every mark room to breathe.</h2></div><div class="usage-grid"><article><strong>Clear space</strong><p>Keep surrounding space equal to the height of the primary letterform.</p></article><article><strong>Contrast</strong><p>Use the full-color mark on light backgrounds and a single-color version on photography.</p></article><article><strong>Minimum size</strong><p>Keep wordmarks above 140 px digitally so subtitles and fine details remain legible.</p></article><article><strong>Never distort</strong><p>Do not stretch, rotate, recolor individual elements or place the mark over busy detail.</p></article></div></section>
  <section class="guideline-section visual-guidelines" id="visuals"><div class="guideline-heading"><p class="eyebrow">05 / Visual style</p><h2>Real products, natural light, cinematic restraint.</h2></div><div class="visual-strip">${Object.keys(brandDefinitions).map((slug, index) => `<figure><img src="${campaignImage(slug, index + 1)}" alt="${brandDefinitions[slug].name} visual direction"><figcaption>${brandDefinitions[slug].name}</figcaption></figure>`).join("")}</div></section>`, "LoomingsThread Brand House");
}

function socialPlatformData(platform) {
  const data = {
    instagram: { title: "Instagram", ratio: "4:5 feed / 9:16 stories", tone: "Editorial, immediate and product-led", cadence: "3-5 feed posts plus stories per week" },
    facebook: { title: "Facebook", ratio: "1:1 feed / 1.91:1 link", tone: "Informative, reassuring and community-focused", cadence: "2-4 posts per week" },
    pinterest: { title: "Pinterest", ratio: "2:3 vertical pins", tone: "Inspirational, searchable and evergreen", cadence: "5-10 pins per week" }
  };
  return data[platform] || data.instagram;
}

function renderSocialKit(platform = "instagram") {
  const data = socialPlatformData(platform);
  updateSeo(`${data.title} Social Kit`, `${data.title} content system and local campaign assets for the LoomingsThread brand house.`);
  page("", `<section class="social-kit-hero social-${platform}"><div><p class="eyebrow">Social Media Kit</p><h1>${data.title}</h1><p>${data.tone}. A shared publishing system keeps four brand identities distinct while making the parent company recognizable.</p></div></section>
  <section class="social-kit-specs"><article><span>Recommended formats</span><strong>${data.ratio}</strong></article><article><span>Publishing cadence</span><strong>${data.cadence}</strong></article><article><span>Core principle</span><strong>Product first. Story second. Logo with restraint.</strong></article></section>
  <section class="guideline-section"><div class="guideline-heading"><p class="eyebrow">Content pillars</p><h2>A balanced premium feed.</h2></div><div class="social-pillars"><article><span>01</span><h3>Campaign</h3><p>Strong seasonal frames that establish the emotional world of each brand.</p></article><article><span>02</span><h3>Product</h3><p>Clean product views, material details and useful styling combinations.</p></article><article><span>03</span><h3>Story</h3><p>Craft, family, denim heritage and the thinking behind modern essentials.</p></article><article><span>04</span><h3>Service</h3><p>Delivery, returns, care, fit and customer support expressed clearly.</p></article></div></section>
  <section class="guideline-section"><div class="guideline-heading"><p class="eyebrow">Ready-to-use source library</p><h2>Campaign selections</h2></div><div class="social-mock-grid">${Object.keys(brandDefinitions).map((slug, brandIndex) => [1, 2, 3].map((imageIndex) => `<figure><img src="${campaignImage(slug, imageIndex + brandIndex % 2)}" alt="${brandDefinitions[slug].name} social asset"><figcaption><strong>${brandDefinitions[slug].name}</strong><span>${data.title} campaign source</span></figcaption></figure>`).join("")).join("")}</div></section>
  <section class="social-copy-bank"><div><p class="eyebrow">Copy framework</p><h2>Short. Specific. Quietly confident.</h2></div><div><blockquote>Designed for the moments that become routine.</blockquote><blockquote>Material, proportion and purpose in balance.</blockquote><blockquote>Four brand worlds. One considered point of view.</blockquote></div></section>`, `${data.title} Kit`);
}

function renderMarketingAssets() {
  updateSeo("Marketing Assets", "Local banner, campaign and seasonal marketing asset library for all LoomingsThread brands.");
  const seasons = ["Brand Launch", "Spring Edit", "City Campaign", "Autumn Layers", "Holiday Gifting"];
  page("", `<section class="asset-library-hero"><div><p class="eyebrow">Marketing Asset Library</p><h1>Campaigns built to travel across every channel.</h1><p>Twenty local campaign banners form the launch library for homepage storytelling, social publishing, retailer presentations and seasonal brand communication.</p></div><aside><strong>20</strong><span>local campaign banners</span><strong>4</strong><span>distinct brand worlds</span><strong>5</strong><span>campaign chapters each</span></aside></section>
  <section class="asset-filters">${Object.entries(brandDefinitions).map(([slug, brand]) => `<a href="#assets-${slug}"><img src="${brand.logo}" alt="${brand.name}"><span>${brand.name}</span></a>`).join("")}</section>
  ${Object.entries(brandDefinitions).map(([slug, brand]) => `<section class="campaign-library" id="assets-${slug}"><div class="campaign-library-head"><img src="${brand.logo}" alt="${brand.name}"><div><p class="eyebrow">${brand.collection} Campaign Library</p><h2>${brand.name}</h2><p>${brand.story}</p></div></div><div class="campaign-asset-grid">${[1, 2, 3, 4, 5].map((index) => `<article><img src="${campaignImage(slug, index)}" alt="${brand.name} ${seasons[index - 1]}"><div><span>0${index}</span><h3>${seasons[index - 1]}</h3><a href="${campaignImage(slug, index)}" download>Download source</a></div></article>`).join("")}</div></section>`).join("")}
  <section class="seasonal-roadmap"><div><p class="eyebrow">Seasonal system</p><h2>A repeatable campaign rhythm.</h2></div><div>${seasons.map((season, index) => `<article><span>0${index + 1}</span><strong>${season}</strong><p>${["Introduce the brand promise and signature visual language.","Lighter styling, optimistic color and new-season discovery.","Urban context, movement and contemporary utility.","Texture, layering, warmth and transitional wardrobes.","Considered gifts, close details and emotional storytelling."][index]}</p></article>`).join("")}</div></section>`, "LoomingsThread Marketing");
}

function trustSection() {
  return `<section class="trust-badges" aria-label="Trust elements">
    <article><span class="trust-number">01</span><strong>Sichere Zahlung</strong><span>PayPal, Klarna, Karte und Vorkasse sind als klar erkennbare Zahlungsarten vorbereitet.</span></article>
    <article><span class="trust-number">02</span><strong>Versand mit Tracking</strong><span>Unterstuetzte Versandzonen und Carrier werden transparent bis zur Bestellung kommuniziert.</span></article>
    <article><span class="trust-number">03</span><strong>Persoenlicher Kundenservice</strong><span>Kontakt, FAQ und Bestellkommunikation schaffen einen direkten Weg zu LoomingsThread.</span></article>
    <article><span class="trust-number">04</span><strong>Einfache Rueckgabe</strong><span>14-Tage-Information, Widerruf und Rueckgabeprozess sind sichtbar und nachvollziehbar strukturiert.</span></article>
  </section>`;
}

function homepageConversionProof() {
  const reviewEntries = Object.entries(productReviews)
    .flatMap(([slug, reviews]) => (reviews || []).map(review => ({ ...review, product: getProduct(slug) })))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);
  const productCount = publicProducts().length;
  const galleryCount = publicProducts().filter(product => publicProductImages(product).length > 1).length;
  const proofCards = [
    [`${productCount}+`, "kuratierte Produkte", "Vier eigenstaendige Marken in einem gemeinsamen Shop."],
    [`${galleryCount}`, "lokale Produktgalerien", "Produktbilder werden direkt aus dem Shop-Projekt geladen."],
    ["14 Tage", "Rueckgabeinformation", "Transparente Hinweise begleiten Warenkorb und Checkout."],
    ["1 Checkout", "fuer alle Marken", "Leather, Kidswear, Denim und Apparel gemeinsam bestellen."]
  ];
  const testimonials = reviewEntries.length ? reviewEntries.map(review => `<blockquote><div>${starsMarkup(review.rating)}</div><p>${escapeHtml(review.text)}</p><footer>${escapeHtml(review.name)}${review.product ? ` / ${escapeHtml(displayProductTitle(review.product))}` : ""}</footer></blockquote>`).join("") : [
    ["Passform & Komfort", "Hier erscheinen nach verifizierten Kaeufen echte Erfahrungen zu Groesse, Komfort und Alltagstauglichkeit."],
    ["Material & Verarbeitung", "Kundenfeedback zu Haptik, Details und Produktqualitaet wird transparent am Produkt veroeffentlicht."],
    ["Service & Lieferung", "Erfahrungen mit Beratung, Versand und Rueckgabe werden nach dem Launch sichtbar gemacht."]
  ].map(([title, text]) => `<article><span>Customer story space</span><h3>${title}</h3><p>${text}</p></article>`).join("");
  return `<section class="conversion-proof">
    <div class="section-title"><p>Why buy from us</p><h2>Premium Auswahl, klarer Service.</h2></div>
    <div class="proof-metrics">${proofCards.map(([value, label, text]) => `<article><strong>${value}</strong><span>${label}</span><p>${text}</p></article>`).join("")}</div>
    <div class="testimonial-heading"><div><p class="eyebrow">Customer confidence</p><h2>${reviewEntries.length ? "Was unsere Kunden sagen" : "Echte Stimmen statt erfundener Versprechen"}</h2></div><p>${reviewEntries.length ? "Aktuelle Bewertungen aus dem lokalen Review-System." : "Dieser Bereich ist bereit fuer verifizierte Kundenbewertungen und zeigt bis dahin bewusst keine erfundenen Testimonials."}</p></div>
    <div class="${reviewEntries.length ? "reviews conversion-reviews" : "testimonial-placeholders"}">${testimonials}</div>
  </section>`;
}

function newsletterSection() {
  return `<section class="newsletter"><div><p class="eyebrow">Newsletter / 10% Willkommen</p><h2>Dein erster LoomingsThread Vorteil.</h2><p>Waehle deine Markenwelt und erhalte den Code <strong>ATELIER10</strong> fuer 10% auf deine erste Bestellung sowie kuratierte Neuheiten statt taeglicher Massenmails.</p></div><form onsubmit="saveNewsletterSignup(event)"><input name="email" type="email" required placeholder="E-Mail-Adresse"><select name="brand" aria-label="Bevorzugte Marke">${brandSegments.map(brand => `<option>${brand}</option>`).join("")}</select><button class="button">Vorteil sichern</button></form></section>`;
}

function saveNewsletterSignup(event) {
  event.preventDefault();
  const email = event.target.email.value.trim();
  const brand = event.target.brand?.value || "All LoomingsThread brands";
  const existing = newsletterSubscribers.find(item => item.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    existing.brand = brand;
    existing.status = "Subscribed";
    existing.tags = [...new Set([...(existing.tags || []), "Website", "Welcome offer"])];
    existing.updatedAt = new Date().toISOString();
  } else {
    newsletterSubscribers.unshift({
      id: `NEWS-${Date.now()}`,
      email,
      brand,
      tags: ["Website", "Welcome offer"],
      status: "Subscribed",
      createdAt: new Date().toISOString()
    });
  }
  saveAcquisitionData();
  event.target.reset();
  alert("Willkommen. Deine Praeferenz wurde lokal gespeichert. Dein Demo-Code lautet ATELIER10.");
}

function socialLinks() {
  return `<nav class="social-links" aria-label="Social media">
    <a href="#" aria-label="Facebook">Facebook</a>
    <a href="#" aria-label="Instagram">Instagram</a>
    <a href="#" aria-label="Pinterest">Pinterest</a>
    <a href="#" aria-label="TikTok">TikTok</a>
  </nav>`;
}

const journalPosts = {
  "leather-care-guide": {
    title: "Leather Care Guide",
    kicker: "Pflege",
    intro: "Gutes Leder braucht keine komplizierte Routine. Entscheidend sind trockene Lagerung, sanfte Reinigung und Geduld fuer Patina.",
    sections: [["Reinigung", "Staub und leichte Verschmutzungen mit einem weichen, trockenen Tuch entfernen."], ["Pflege", "Wenige, hochwertige Pflegeprodukte sparsam einsetzen und immer zuerst unauffaellig testen."], ["Aufbewahrung", "Lederwaren nicht dauerhaft in direkter Sonne oder feuchter Umgebung lagern."]]
  },
  "how-to-choose-a-wallet": {
    title: "How To Choose A Wallet",
    kicker: "Guide",
    intro: "Die richtige Geldboerse passt zu Alltag, Kleidung und Tragegewohnheit, nicht nur zum Look.",
    sections: [["Slim Wallet", "Ideal fuer Karten, wenig Bargeld und Jacken- oder Hosentaschen."], ["Long Wallet", "Mehr Raum fuer Scheine, Belege und eine ruhige, klassische Silhouette."], ["Material", "Struktur, Griff und Kantenverarbeitung entscheiden ueber die Wertigkeit im Alltag."]]
  },
  "handmade-vs-mass-produced-leather": {
    title: "Handmade vs Mass Produced Leather",
    kicker: "Atelier",
    intro: "Handgemachte Lederwaren stellen Material, Verarbeitung und Reparierbarkeit ueber reine Stueckzahl.",
    sections: [["Haptik", "Kleine Materialunterschiede und Patina machen jedes Stueck eigenstaendig."], ["Verarbeitung", "Sorgfaeltige Naehte, Kanten und Proportionen bestimmen die Lebensdauer."], ["Bewusster Kauf", "Qualitaet ueber Masse reduziert impulsive Ersatzkaeufe."]]
  },
  "leather-travel-bags-guide": {
    title: "Leather Travel Bags Guide",
    kicker: "Travel",
    intro: "Eine gute Reisetasche verbindet Volumen, robuste Beschlaege und eine Form, die auch nach Jahren ruhig wirkt.",
    sections: [["Duffle Bags", "Ideal fuer Wochenenden, Kurzreisen und flexible Packlisten."], ["Business Travel", "Laptop- und Dokumentenfaecher helfen, Arbeit und Reise sauber zu trennen."], ["Tracking & Versand", "Versand mit Tracking ist in der Shopstruktur vorbereitet."]]
  }
};

function renderLegal(slug) {
  const pages = {
    impressum: {
      title: "Impressum",
      intro: "Angaben gemaess deutschem Recht. Entwurf fuer The Leather Atelier by Looming Threads.",
      sections: [
        ["Company name", "The Leather Atelier by Looming Threads, Rechtsform und Registerdaten vor Livegang ergaenzen."],
        ["Owner name", "Vor- und Nachname der Inhaberin / des Inhabers oder der vertretungsberechtigten Person eintragen."],
        ["Address", "Strasse, Hausnummer, PLZ, Ort, Deutschland."],
        ["Contact", "E-Mail: hello@leatheratelier.de. Telefon: +49 000 000000. Angaben vor Livegang finalisieren."],
        ["VAT ID", "USt-IdNr. gemaess Â§ 27a UStG: DE000000000. Nummer vor Livegang ersetzen."],
        ["Responsible person", "Verantwortlich fuer Inhalte: Name, Anschrift und Kontakt vor Livegang finalisieren."]
      ]
    },
    datenschutz: {
      title: "Datenschutz",
      intro: "GDPR-/DSGVO-Struktur als professioneller Entwurf. Keine Rechtsberatung.",
      sections: [
        ["Responsible party", "The Leather Atelier by Looming Threads, Adresse und Datenschutzkontakt vor Livegang ergaenzen."],
        ["Data collection", "Wir verarbeiten Demo-Daten fuer Warenkorb, Wunschliste, Sprache, Kundenkonto und Bestellablauf lokal im Browser."],
        ["Cookies", "Essenzielle lokale Speicherfunktionen werden fuer Warenkorb, Sprache, Wishlist, Admin-Demo und Checkout genutzt."],
        ["Contact forms", "Bei Aktivierung sind Zweck, Rechtsgrundlage, Speicherdauer und Empfaenger des Kontaktformulars zu benennen."],
        ["Orders", "Bestelldaten koennen Name, Adresse, E-Mail, Telefon, Warenkorb, Zahlungsart und Versanddaten umfassen."],
        ["Payment providers", "PayPal, Stripe/Karte, Klarna und Vorkasse sind vorbereitet, aber nicht live verbunden."],
        ["Analytics", "Analytics ist nicht aktiv. Bei spaeterer Aktivierung sind Anbieter, Opt-in und Speicherdauer zu dokumentieren."],
        ["Customer rights", "Auskunft, Berichtigung, Loeschung, Einschraenkung, Widerspruch, Datenuebertragbarkeit und Beschwerderecht bei der Aufsichtsbehoerde."],
        ["Data deletion", "Loeschfristen und Prozesse muessen vor Livegang passend zu Buchhaltung, Steuerrecht und Support definiert werden."]
      ]
    },
    agb: {
      title: "AGB",
      intro: "Allgemeine Geschaeftsbedingungen als deutsche Ecommerce-Struktur.",
      sections: [
        ["Scope", "Diese AGB gelten fuer Bestellungen im Online-Shop The Leather Atelier by Looming Threads."],
        ["Contract conclusion", "Produktdarstellungen sind kein bindendes Angebot. Der Vertragsschluss erfolgt nach Annahme der Bestellung."],
        ["Prices and payment", "Alle Preise in Euro inkl. gesetzlicher MwSt. Zahlungsarten: PayPal, Karte/Stripe, Klarna und Vorkasse nach finaler Aktivierung."],
        ["Delivery", "Lieferlaender, Lieferzeiten, Versandkosten und Tracking werden im Checkout angezeigt."],
        ["Retention of title", "Die Ware bleibt bis zur vollstaendigen Bezahlung Eigentum des Anbieters."],
        ["Warranty", "Es gelten die gesetzlichen Gewaehrleistungsrechte."],
        ["Liability", "Haftungsregelungen fuer Vorsatz, grobe Fahrlaessigkeit, wesentliche Vertragspflichten und Produkthaftung final pruefen."],
        ["Withdrawal", "Verbraucher haben ein gesetzliches Widerrufsrecht gemaess Widerrufsbelehrung."],
        ["Final provisions", "Anwendbares Recht, Gerichtsstand und Streitbeilegungshinweise vor Livegang rechtlich pruefen."]
      ]
    },
    widerruf: {
      title: "Widerrufsbelehrung",
      intro: "14-day withdrawal structure for German consumers.",
      sections: [
        ["14-day withdrawal structure", "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gruenden diesen Vertrag zu widerrufen."],
        ["Withdrawal period", "Die Frist betraegt 14 Tage ab dem Tag, an dem Sie oder ein benannter Dritter die Ware erhalten haben."],
        ["How to withdraw", "Senden Sie eine eindeutige Erklaerung per E-Mail oder Post an die noch einzutragende Anbieteradresse."],
        ["Consequences", "Nach wirksamem Widerruf werden Zahlungen nach gesetzlicher Vorgabe erstattet. Ruecksendekosten und Ausnahmen final pruefen."],
        ["Withdrawal form template", "Hiermit widerrufe ich den von mir abgeschlossenen Vertrag ueber den Kauf folgender Waren: _____ / Bestellt am: _____ / Erhalten am: _____ / Name: _____ / Anschrift: _____ / Datum: _____."],
        ["Return address", "The Leather Atelier by Looming Threads, Retourenadresse, Strasse, PLZ Ort, Deutschland. Vor Livegang finalisieren."]
      ]
    },
    versand: {
      title: "Versand & Rueckgabe",
      intro: "Versand- und Rueckgabeinformationen fuer den deutschen Markt.",
      sections: [
        ["Shipping countries", "Deutschland, Oesterreich, Belgien, Niederlande, Luxemburg, EU Zone und International sind als Versandzonen vorbereitet."],
        ["Shipping costs", "Versandkosten und Freigrenzen werden im Checkout je Zone angezeigt und koennen im Adminbereich angepasst werden."],
        ["Delivery times", "Vorgesehene Lieferzeiten: Deutschland ca. 2-4 Werktage, EU ca. 3-8 Werktage, International ca. 7-14 Werktage."],
        ["Returns", "Rueckgaben sind innerhalb der gesetzlichen Widerrufsfrist strukturell vorbereitet."],
        ["Exchange", "Umtauschprozesse fuer Groesse, Farbe oder Modell muessen vor Livegang operativ definiert werden."],
        ["Damaged goods process", "Bitte Transportschaeden mit Fotos dokumentieren und den Kundenservice kontaktieren. Prozess und Fristen finalisieren."]
      ]
    },
    cookies: {
      title: "Cookie Policy",
      intro: "Cookie- und Consent-Struktur als Entwurf.",
      sections: [
        ["Essential cookies", "Essenzielle lokale Speicherfunktionen fuer Warenkorb, Wishlist, Sprache, Admin-Demo und Checkout sind erforderlich."],
        ["Analytics", "Analytics ist vorbereitet, aber nicht aktiv. Aktivierung nur mit passendem Consent und Datenschutzhinweis."],
        ["Marketing", "Marketing-Cookies, Retargeting und Pixel sind nicht aktiv. Spaetere Anbieter muessen transparent benannt werden."],
        ["Cookie consent", "Consent-Banner, Kategorien, Widerruf und Protokollierung muessen vor Livegang eingebunden werden."]
      ]
    }
  };
  const data = pages[slug] || pages.impressum;
  page(data.title, `<section class="copy-page legal-copy"><p class="legal-alert">Diese Texte sind Entwuerfe und muessen vor dem Launch durch einen Anwalt oder Legal-Text-Anbieter geprueft werden.</p><p>${data.intro}</p><div class="legal-grid">${data.sections.map(([heading, text]) => `<article><h2>${heading}</h2><p>${text}</p></article>`).join("")}</div></section>`);
}

function isAdminLoggedIn() {
  return localStorage.getItem("atelierAdminLoggedIn") === "true";
}

function adminShell(title, body) {
  document.body.classList.add("admin-mode");
  updateSeo(`Admin - ${title}`, "Adminbereich fuer The Leather Atelier Produktmanagement.");
  app.innerHTML = `<section class="admin-layout">
    <aside class="admin-sidebar"><a class="brand" href="/admin/dashboard"><span class="brand-mark">LA</span><span><strong>Admin</strong><small>LoomingsThread</small></span></a><nav><a href="/admin/dashboard">Dashboard</a><a href="/admin/marketing">Marketing</a><a href="/admin/leads">Leads</a><a href="/admin/newsletter">Newsletter CRM</a><a href="/admin/inquiries">Inquiries</a><a href="/admin/analytics">Analytics</a><a href="/admin/segments">Segments</a><a href="/admin/launch-center">Launch Center</a><a href="/admin/products">Produkte</a><a href="/admin/image-production">Image Production</a><a href="/admin/products/new">Neues Produkt</a><a href="/admin/ai-product-generator">AI Product Generator</a><a href="/admin/orders">Orders</a><a href="/admin/purchase-orders">Purchase Orders</a><a href="/admin/procurement">Procurement</a><a href="/admin/customers">Customers</a><a href="/admin/inventory">Inventory</a><a href="/admin/profits">Profits</a><a href="/admin/reports">Reports</a><a href="/admin/pricing">Pricing</a><a href="/admin/settings">Settings</a><a href="/admin/settings/payments">Payments</a><a href="/admin/settings/shipping">Shipping</a><a href="/">Shop ansehen</a></nav><button class="ghost" onclick="localStorage.removeItem('atelierAdminLoggedIn'); location.href='/admin'">Logout</button></aside>
    <section class="admin-main"><div class="admin-head"><div><p class="eyebrow">Admin Panel</p><h1>${title}</h1></div><div class="admin-head-actions"><button class="button" onclick="exportProductsJson()">Export updated products.json</button><label class="ghost admin-import">Import products.json<input type="file" accept="application/json,.json" onchange="importProductsJson(event)"></label><button class="ghost danger" onclick="resetLocalEdits()">Reset local edits</button></div></div><p id="adminNotice" class="admin-warning">Admin changes are stored locally until exported.</p>${body}</section>
  </section>`;
}

function launchCatalogMetrics() {
  const items = products.filter(product => product.deleted !== true);
  const fullGalleries = items.filter(product => productImages(product).length >= 5).length;
  const needsReview = items.filter(product => product.needsManualReview === true || product.needsGalleryReview === true).length;
  const missingImages = items.filter(product => !mainImage(product) && !productImages(product).length).length;
  const missingDescriptions = items.filter(product => !String(product.descriptionDe || product.descriptionEn || product.description || "").trim()).length;
  return { total: items.length, fullGalleries, needsReview, missingImages, missingDescriptions };
}

const productionBrandLabels = {
  "Custom Denim Studio": "Denim",
  "LoomingsThread Apparel": "Apparel",
  "The Leather Atelier": "Leather Atelier",
  "Letta & Luna": "Letta & Luna"
};
const imageProductionStatuses = ["Missing", "Needs Generation", "Generated", "Approved", "Rejected"];
let imageProductionRecords = JSON.parse(localStorage.getItem("loomingsThreadImageProductionRecords") || "{}");
let imageProductionUiState = { query: "", brand: "All brands", status: "All statuses", openProduct: "" };
const productionViewDefinitions = {
  front: { label: "Front View", pattern: /(?:^|[\/_-])(front|image-0?1)(?:[\/_.-]|$)/i },
  back: { label: "Back View", pattern: /(?:^|[\/_-])(back|rear)(?:[\/_.-]|$)/i },
  leftSide: { label: "Left Side View", pattern: /(?:^|[\/_-])(left-side|left|side-left)(?:[\/_.-]|$)/i },
  rightSide: { label: "Right Side View", pattern: /(?:^|[\/_-])(right-side|right|side-right)(?:[\/_.-]|$)/i },
  detail: { label: "Detail Close-Up", pattern: /(?:^|[\/_-])(detail|closeup|close-up|macro)(?:[\/_.-]|$)/i },
  materialTexture: { label: "Fabric / Material Texture", pattern: /(?:^|[\/_-])(fabric|material|texture|grain)(?:[\/_.-]|$)/i },
  leatherTexture: { label: "Leather Texture", pattern: /(?:^|[\/_-])(leather-texture|leather-grain|texture|grain)(?:[\/_.-]|$)/i },
  lifestyle: { label: "Lifestyle / Model View", pattern: /(?:^|[\/_-])(lifestyle|model|campaign)(?:[\/_.-]|$)/i },
  waistButton: { label: "Waist Button Detail", pattern: /(?:^|[\/_-])(waist-button|waist-detail)(?:[\/_.-]|$)/i },
  zipper: { label: "Zipper Detail", pattern: /(?:^|[\/_-])(zipper|zip-detail)(?:[\/_.-]|$)/i },
  backPocket: { label: "Back Pocket Detail", pattern: /(?:^|[\/_-])(back-pocket|pocket-back)(?:[\/_.-]|$)/i },
  stitching: { label: "Stitching Detail", pattern: /(?:^|[\/_-])(stitching|stitch-detail|seam)(?:[\/_.-]|$)/i },
  hem: { label: "Hem Detail", pattern: /(?:^|[\/_-])(hem|hem-detail)(?:[\/_.-]|$)/i },
  collar: { label: "Collar Detail", pattern: /(?:^|[\/_-])(collar|collar-detail)(?:[\/_.-]|$)/i },
  button: { label: "Button Detail", pattern: /(?:^|[\/_-])(button|button-detail)(?:[\/_.-]|$)/i },
  chestPocket: { label: "Chest Pocket Detail", pattern: /(?:^|[\/_-])(chest-pocket|pocket-chest)(?:[\/_.-]|$)/i },
  sleeveCuff: { label: "Sleeve Cuff Detail", pattern: /(?:^|[\/_-])(sleeve-cuff|cuff-detail)(?:[\/_.-]|$)/i },
  backYoke: { label: "Back Yoke Detail", pattern: /(?:^|[\/_-])(back-yoke|yoke-detail)(?:[\/_.-]|$)/i },
  hood: { label: "Hood Detail", pattern: /(?:^|[\/_-])(hood|hood-detail)(?:[\/_.-]|$)/i },
  drawstring: { label: "Drawstring Detail", pattern: /(?:^|[\/_-])(drawstring|cord-detail)(?:[\/_.-]|$)/i },
  kangarooPocket: { label: "Kangaroo Pocket Detail", pattern: /(?:^|[\/_-])(kangaroo-pocket|front-pocket)(?:[\/_.-]|$)/i },
  cuff: { label: "Cuff Detail", pattern: /(?:^|[\/_-])(cuff|cuff-detail)(?:[\/_.-]|$)/i },
  sleeve: { label: "Sleeve Detail", pattern: /(?:^|[\/_-])(sleeve|sleeve-detail)(?:[\/_.-]|$)/i },
  bottom: { label: "Bottom View", pattern: /(?:^|[\/_-])(bottom|base)(?:[\/_.-]|$)/i },
  interior: { label: "Inside / Interior", pattern: /(?:^|[\/_-])(inside|interior|compartment)(?:[\/_.-]|$)/i },
  handle: { label: "Handle Detail", pattern: /(?:^|[\/_-])(handle|handle-detail)(?:[\/_.-]|$)/i },
  strap: { label: "Strap Detail", pattern: /(?:^|[\/_-])(strap|shoulder-strap)(?:[\/_.-]|$)/i },
  hardware: { label: "Metal Hardware Detail", pattern: /(?:^|[\/_-])(hardware|metal-detail|buckle)(?:[\/_.-]|$)/i },
  openView: { label: "Open View", pattern: /(?:^|[\/_-])(open|open-view)(?:[\/_.-]|$)/i },
  compartments: { label: "Inside Compartments", pattern: /(?:^|[\/_-])(compartments|inside-compartments|interior)(?:[\/_.-]|$)/i },
  cardSlots: { label: "Card Slots Detail", pattern: /(?:^|[\/_-])(card-slots|slots-detail)(?:[\/_.-]|$)/i }
};
const generalProductionViewIds = ["front", "back", "leftSide", "rightSide", "detail", "materialTexture", "lifestyle"];

function validProductionImage(value) {
  const image = normalizeImagePath(value);
  return Boolean(image && validLocalImagePaths.has(image) && !placeholderImagePaths.has(image));
}

function productProductionKey(product) {
  return String(product.articleNumber || product.sku || product.id || product.slug);
}

function productProductionStandard(product) {
  const taxonomy = `${product.brand || ""} ${product.category || ""} ${product.collection || ""} ${product.productName || ""} ${product.titleDe || ""} ${product.name || ""}`.toLowerCase();
  if (product.brand === "The Leather Atelier" && /(laptop-bags|duffle-bags|ladies-bags|bag|briefcase|backpack|tote|messenger)/.test(taxonomy)) {
    return { id: "leather-bag", label: "Leather Bag", views: [...generalProductionViewIds.filter(view => view !== "materialTexture"), "leatherTexture", "bottom", "interior", "zipper", "handle", "strap", "hardware", "stitching"] };
  }
  if (product.brand === "The Leather Atelier" && /(wallet|cardholder|card holder)/.test(taxonomy)) {
    return { id: "wallet", label: "Wallet / Cardholder", views: [...generalProductionViewIds.filter(view => view !== "materialTexture"), "leatherTexture", "openView", "compartments", "cardSlots", "stitching"] };
  }
  if (/denim jackets?|trucker jacket/.test(taxonomy)) {
    return { id: "denim-jacket", label: "Denim Jacket", views: [...generalProductionViewIds, "collar", "button", "chestPocket", "sleeveCuff", "backYoke"] };
  }
  if (/jeans?/.test(taxonomy)) {
    return { id: "denim", label: "Denim / Jeans", views: [...generalProductionViewIds, "waistButton", "zipper", "backPocket", "stitching", "hem"] };
  }
  if (/hoodie|sweatshirt/.test(taxonomy)) {
    return { id: "hoodie", label: "Hoodie / Sweatshirt", views: [...generalProductionViewIds, "hood", "drawstring", "kangarooPocket", "cuff", "hem"] };
  }
  if (/t-shirts?|t shirts?|tee\b/.test(taxonomy)) {
    return { id: "tshirt", label: "T-Shirt", views: [...generalProductionViewIds, "collar", "sleeve"] };
  }
  return { id: "general", label: "General Ecommerce", views: [...generalProductionViewIds] };
}

function productAllImagePaths(product) {
  const slots = Object.values(product.imageSlots || {});
  const gallery = Object.values(product.gallery || {});
  return [...new Set([
    mainImage(product),
    ...(product.images || []),
    ...(product.galleryImages || []),
    ...(product.detailImages || []),
    ...slots,
    ...gallery
  ].flat().map(normalizeImagePath).filter(Boolean))];
}

function productViewCandidates(product, viewId) {
  const slots = product.imageSlots || {};
  const gallery = product.gallery || {};
  const images = productAllImagePaths(product);
  const definition = productionViewDefinitions[viewId];
  const named = definition ? images.filter(image => definition.pattern.test(String(image))) : [];
  const explicit = {
    front: [gallery.front, product.frontImage, slots.front, mainImage(product)],
    back: [gallery.back, product.backImage, slots.back],
    leftSide: [gallery.leftSide, product.leftSideImage, slots.leftSide],
    rightSide: [gallery.rightSide, product.rightSideImage, slots.rightSide],
    detail: [gallery.detail, ...(product.detailImages || []), slots.detail],
    materialTexture: [gallery.materialTexture, gallery.fabricTexture, product.materialTextureImage, slots.materialTexture, slots.fabricTexture],
    lifestyle: [gallery.lifestyle, product.lifestyleImage, slots.lifestyle]
  };
  return [...new Set([...(explicit[viewId] || []), ...named].flat().map(normalizeImagePath).filter(Boolean))];
}

function imageProductionItem(product, viewId) {
  const key = productProductionKey(product);
  const saved = imageProductionRecords[key]?.[viewId] || {};
  const detectedPath = productViewCandidates(product, viewId).find(validProductionImage) || "";
  const path = normalizeImagePath(saved.path || detectedPath);
  const exists = validProductionImage(path);
  const automaticStatus = exists ? "Generated" : product.readyForGeneration === true ? "Needs Generation" : "Missing";
  const status = imageProductionStatuses.includes(saved.status) ? saved.status : automaticStatus;
  return { viewId, label: productionViewDefinitions[viewId].label, path, exists, status };
}

function productGalleryCompleteness(product) {
  const standard = productProductionStandard(product);
  const items = standard.views.map(viewId => imageProductionItem(product, viewId));
  const approvedCount = items.filter(item => item.exists && item.status === "Approved").length;
  const existingCount = items.filter(item => item.exists).length;
  return {
    standard,
    items,
    views: Object.fromEntries(items.map(item => [item.viewId, item.exists])),
    completeCount: approvedCount,
    existingCount,
    percentage: Math.round(approvedCount / items.length * 100),
    assetPercentage: Math.round(existingCount / items.length * 100),
    missingViews: items.filter(item => !item.exists).map(item => item.viewId),
    readyForLaunch: items.length > 0 && items.every(item => item.exists && item.status === "Approved")
  };
}

function updateImageProductionItem(encodedKey, viewId, field, value) {
  const key = decodeURIComponent(encodedKey);
  imageProductionUiState = {
    query: document.querySelector("#imageProductionSearch")?.value || "",
    brand: document.querySelector("#imageProductionBrand")?.value || "All brands",
    status: document.querySelector("#imageProductionStatus")?.value || "All statuses",
    openProduct: key
  };
  imageProductionRecords[key] ||= {};
  imageProductionRecords[key][viewId] ||= {};
  imageProductionRecords[key][viewId][field] = field === "path" ? normalizeImagePath(value) : value;
  localStorage.setItem("loomingsThreadImageProductionRecords", JSON.stringify(imageProductionRecords));
  renderAdminImageProduction();
}

function imageProductionProgress() {
  const queued = products.filter(product => product.deleted !== true && product.readyForGeneration === true);
  const completed = queued.filter(product => productGalleryCompleteness(product).readyForLaunch);
  return {
    total: queued.length,
    completed: completed.length,
    remaining: Math.max(0, queued.length - completed.length),
    percentage: queued.length ? Math.round(completed.length / queued.length * 100) : 0
  };
}

function imageProductionProgressWidget() {
  const progress = imageProductionProgress();
  return `<section class="launch-production-widget">
    <div class="launch-production-copy"><p class="eyebrow">Image production</p><h2>${progress.percentage}% complete</h2><p>Category-specific galleries must contain every required local file and receive approval.</p><a href="/admin/image-production">Open Image Production</a></div>
    <div class="launch-production-meter"><div><i style="width:${progress.percentage}%"></i></div><span>${progress.completed} of ${progress.total} queued products launch-ready</span></div>
    <div class="launch-production-stats"><article><strong>${progress.total}</strong><span>Total queued</span></article><article><strong>${progress.completed}</strong><span>Completed</span></article><article><strong>${progress.remaining}</strong><span>Remaining</span></article><article><strong>${progress.percentage}%</strong><span>Complete</span></article></div>
  </section>`;
}

function realPaymentStatuses() {
  const payment = adminSettings.payments || {};
  return {
    paypal: payment.paypalEnabled === true && Boolean(payment.paypalClientId) && !/placeholder/i.test(payment.paypalClientId),
    stripe: payment.stripeEnabled === true && Boolean(payment.stripePublishableKey) && !/placeholder/i.test(payment.stripePublishableKey),
    klarna: payment.klarnaEnabled === true && Boolean(payment.klarnaMerchantId) && !/placeholder/i.test(payment.klarnaMerchantId),
    bank: payment.bankTransferEnabled === true && Boolean(payment.iban) && !/^DE00|placeholder/i.test(payment.iban)
  };
}

function launchScoreData() {
  const catalog = launchCatalogMetrics();
  const payments = realPaymentStatuses();
  const percentage = values => Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length * 100);
  const branding = percentage([1, launchReadiness.faviconReady, 1, 1]);
  const galleryRatio = catalog.total ? catalog.fullGalleries / catalog.total : 0;
  const reviewRatio = catalog.total ? (catalog.total - catalog.needsReview) / catalog.total : 0;
  const catalogScore = percentage([
    catalog.total > 0,
    galleryRatio,
    reviewRatio,
    catalog.missingImages === 0,
    catalog.missingDescriptions === 0
  ]);
  const paymentScore = percentage(Object.values(payments));
  const legal = percentage([launchReadiness.legalImpressum, launchReadiness.legalPrivacy, launchReadiness.legalTerms, launchReadiness.legalWithdrawal, launchReadiness.legalCookies]);
  const marketing = percentage([launchReadiness.marketingAnalytics, launchReadiness.marketingSearchConsole, launchReadiness.marketingMetaPixel, launchReadiness.marketingPinterest, launchReadiness.marketingNewsletter]);
  const shippingReady = shippingZoneKeys.some(key => adminSettings.shipping?.[key]?.enabled);
  const operations = percentage([
    launchReadiness.domainPurchased,
    launchReadiness.dnsConfigured,
    launchReadiness.sslActive,
    launchReadiness.emailInfo,
    launchReadiness.emailSupport,
    launchReadiness.emailWholesale,
    launchReadiness.customerSupportReady,
    shippingReady
  ]);
  const categories = { Branding: branding, Catalog: catalogScore, Payments: paymentScore, Legal: legal, Marketing: marketing, Operations: operations };
  return { overall: Math.round(Object.values(categories).reduce((sum, score) => sum + score, 0) / Object.keys(categories).length), categories, catalog, payments, shippingReady };
}

function launchTaskDetails(task) {
  const stored = launchTaskMeta[task.key] || {};
  return {
    priority: stored.priority || task.priority || "medium",
    responsible: stored.responsible || "",
    dueDate: stored.dueDate || "",
    notes: stored.notes || "",
    status: task.automatic ? (task.ready ? "done" : "open") : (stored.status || (task.ready ? "done" : "open"))
  };
}

function updateLaunchTask(key, field, value, automatic = false) {
  launchTaskMeta[key] = { ...(launchTaskMeta[key] || {}), [field]: value };
  localStorage.setItem("loomingsthreadLaunchTaskMeta", JSON.stringify(launchTaskMeta));
  if (field === "status" && !automatic) {
    launchReadiness[key] = value === "done";
    localStorage.setItem("loomingsthreadLaunchReadiness", JSON.stringify(launchReadiness));
    renderAdminLaunchCenter();
  }
}

function setLaunchReadiness(key, value) {
  launchReadiness[key] = Boolean(value);
  launchTaskMeta[key] = { ...(launchTaskMeta[key] || {}), status: value ? "done" : "open" };
  localStorage.setItem("loomingsthreadLaunchReadiness", JSON.stringify(launchReadiness));
  localStorage.setItem("loomingsthreadLaunchTaskMeta", JSON.stringify(launchTaskMeta));
  renderAdminLaunchCenter();
}

function launchStatusRow(task) {
  const meta = launchTaskDetails(task);
  const ready = meta.status === "done";
  const statusOptions = [["open", "Open"], ["in-progress", "In progress"], ["done", "Done"], ["blocked", "Blocked"]];
  return `<div class="launch-status-row ${ready ? "is-ready" : meta.status === "blocked" ? "is-blocked" : "is-pending"}">
    <div class="launch-task-summary"><span class="launch-status-icon">${ready ? "Done" : meta.status === "in-progress" ? "Active" : meta.status === "blocked" ? "Blocked" : "Open"}</span><span><strong>${task.label}</strong>${task.note ? `<small>${task.note}</small>` : ""}</span>${task.automatic ? `<span class="launch-auto">Auto</span>` : ""}</div>
    <div class="launch-task-fields">
      <label>Status<select ${task.automatic ? "disabled" : ""} onchange="updateLaunchTask('${task.key}', 'status', this.value, ${task.automatic})">${statusOptions.map(([value, label]) => `<option value="${value}"${meta.status === value ? " selected" : ""}>${label}</option>`).join("")}</select></label>
      <label>Priority<select onchange="updateLaunchTask('${task.key}', 'priority', this.value, ${task.automatic})">${["high", "medium", "low"].map(value => `<option value="${value}"${meta.priority === value ? " selected" : ""}>${titleCase(value)}</option>`).join("")}</select></label>
      <label>Responsible person<input value="${escapeHtml(meta.responsible)}" placeholder="Name" oninput="updateLaunchTask('${task.key}', 'responsible', this.value, ${task.automatic})"></label>
      <label>Due date<input type="date" value="${escapeHtml(meta.dueDate)}" onchange="updateLaunchTask('${task.key}', 'dueDate', this.value, ${task.automatic})"></label>
      <label class="launch-notes-field">Notes<textarea placeholder="Next step, dependency or decision..." oninput="updateLaunchTask('${task.key}', 'notes', this.value, ${task.automatic})">${escapeHtml(meta.notes)}</textarea></label>
    </div>
  </div>`;
}

function launchChecklistTasks(score) {
  const { catalog, payments } = score;
  return [
    { area: "Branding", key: "brandLogos", label: "Five-brand logo system", ready: true, note: "5 local SVG logo placeholders available.", automatic: true, priority: "low" },
    { area: "Branding", key: "faviconReady", label: "Favicon installed", ready: launchReadiness.faviconReady, note: "Final browser and device icon set.", priority: "medium" },
    { area: "Branding", key: "brandGuidelines", label: "Brand guidelines published", ready: true, note: "Public Brand House page is available.", automatic: true, priority: "low" },
    { area: "Branding", key: "bannerLibrary", label: "Banner library complete", ready: true, note: "20 local campaign banners across four brands.", automatic: true, priority: "low" },
    { area: "Domain", key: "domainPurchased", label: "Domain purchased", ready: launchReadiness.domainPurchased, priority: "high" },
    { area: "Domain", key: "dnsConfigured", label: "DNS configured", ready: launchReadiness.dnsConfigured, priority: "high" },
    { area: "Domain", key: "sslActive", label: "SSL active", ready: launchReadiness.sslActive, priority: "high" },
    { area: "Email", key: "emailInfo", label: "info@ mailbox", ready: launchReadiness.emailInfo, priority: "medium" },
    { area: "Email", key: "emailSupport", label: "support@ mailbox", ready: launchReadiness.emailSupport, priority: "high" },
    { area: "Email", key: "emailWholesale", label: "wholesale@ mailbox", ready: launchReadiness.emailWholesale, priority: "medium" },
    { area: "Payments", key: "paypalConnected", label: "PayPal connected", ready: payments.paypal, note: payments.paypal ? "Live client ID detected." : "Placeholder or disabled.", automatic: true, priority: "high" },
    { area: "Payments", key: "stripeConnected", label: "Stripe connected", ready: payments.stripe, note: payments.stripe ? "Live publishable key detected." : "Placeholder or disabled.", automatic: true, priority: "high" },
    { area: "Payments", key: "klarnaConnected", label: "Klarna connected", ready: payments.klarna, note: payments.klarna ? "Live merchant ID detected." : "Placeholder or disabled.", automatic: true, priority: "high" },
    { area: "Payments", key: "bankConfigured", label: "Bank transfer configured", ready: payments.bank, note: payments.bank ? "Non-placeholder IBAN detected." : "Placeholder or disabled.", automatic: true, priority: "medium" },
    { area: "Legal", key: "legalImpressum", label: "Impressum reviewed", ready: launchReadiness.legalImpressum, priority: "high" },
    { area: "Legal", key: "legalPrivacy", label: "Datenschutzerklaerung reviewed", ready: launchReadiness.legalPrivacy, priority: "high" },
    { area: "Legal", key: "legalTerms", label: "AGB reviewed", ready: launchReadiness.legalTerms, priority: "high" },
    { area: "Legal", key: "legalWithdrawal", label: "Widerruf reviewed", ready: launchReadiness.legalWithdrawal, priority: "high" },
    { area: "Legal", key: "legalCookies", label: "Cookie policy reviewed", ready: launchReadiness.legalCookies, priority: "high" },
    { area: "Catalog", key: "catalogGalleries", label: "Full product galleries", ready: catalog.fullGalleries === catalog.total, note: `${catalog.fullGalleries} of ${catalog.total} products currently have 5+ images.`, automatic: true, priority: "high" },
    { area: "Catalog", key: "catalogReview", label: "Manual review flags resolved", ready: catalog.needsReview === 0, note: `${catalog.needsReview} products currently need review.`, automatic: true, priority: "high" },
    { area: "Catalog", key: "catalogImages", label: "No missing product images", ready: catalog.missingImages === 0, note: `${catalog.missingImages} products missing images.`, automatic: true, priority: "high" },
    { area: "Catalog", key: "catalogDescriptions", label: "No missing descriptions", ready: catalog.missingDescriptions === 0, note: `${catalog.missingDescriptions} products missing descriptions.`, automatic: true, priority: "medium" },
    { area: "Marketing", key: "marketingAnalytics", label: "Google Analytics", ready: launchReadiness.marketingAnalytics, priority: "medium" },
    { area: "Marketing", key: "marketingSearchConsole", label: "Search Console", ready: launchReadiness.marketingSearchConsole, priority: "medium" },
    { area: "Marketing", key: "marketingMetaPixel", label: "Meta Pixel", ready: launchReadiness.marketingMetaPixel, priority: "low" },
    { area: "Marketing", key: "marketingPinterest", label: "Pinterest tracking", ready: launchReadiness.marketingPinterest, priority: "low" },
    { area: "Marketing", key: "marketingNewsletter", label: "Newsletter connected", ready: launchReadiness.marketingNewsletter, priority: "medium" },
    { area: "Social Media", key: "socialInstagram", label: "Instagram", ready: launchReadiness.socialInstagram, priority: "medium" },
    { area: "Social Media", key: "socialFacebook", label: "Facebook", ready: launchReadiness.socialFacebook, priority: "medium" },
    { area: "Social Media", key: "socialPinterest", label: "Pinterest", ready: launchReadiness.socialPinterest, priority: "low" },
    { area: "Social Media", key: "socialTiktok", label: "TikTok", ready: launchReadiness.socialTiktok, priority: "low" },
    { area: "Social Media", key: "customerSupportReady", label: "Customer support workflow", ready: launchReadiness.customerSupportReady, priority: "high" }
  ];
}

function launchChecklistCard(number, title, description, tasks, footer = "") {
  return `<article class="launch-checklist"><header><span>${number}</span><div><h2>${title}</h2><p>${description}</p></div></header>${tasks.map(launchStatusRow).join("")}${footer}</article>`;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportLaunchChecklistCsv() {
  const score = launchScoreData();
  const rows = launchChecklistTasks(score).map(task => {
    const meta = launchTaskDetails(task);
    return [task.area, task.label, meta.status, meta.priority, meta.responsible, meta.dueDate, meta.notes, task.automatic ? "Yes" : "No"];
  });
  const csv = [["Area", "Task", "Status", "Priority", "Responsible Person", "Due Date", "Notes", "Automatic"], ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `loomingsthread-launch-checklist-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  adminNotice("Launch checklist CSV downloaded.");
}

function launchActionItems(score) {
  const catalog = score.catalog;
  const payments = score.payments;
  const tasks = [
    { priority: 1, show: !launchReadiness.domainPurchased, title: "Purchase and confirm the production domain", area: "Domain" },
    { priority: 1, show: !launchReadiness.dnsConfigured, title: "Configure DNS records for the live hosting provider", area: "Domain" },
    { priority: 1, show: !launchReadiness.sslActive, title: "Activate and verify SSL before accepting customer data", area: "Security" },
    { priority: 1, show: !Object.values(payments).some(Boolean), title: "Connect at least one real payment method", area: "Payments" },
    { priority: 1, show: score.categories.Legal < 100, title: "Complete professional legal review for all German legal texts", area: "Legal" },
    { priority: 2, show: catalog.needsReview > 0, title: `Review ${catalog.needsReview} products still carrying manual or gallery review flags`, area: "Catalog" },
    { priority: 2, show: catalog.fullGalleries < catalog.total, title: `Complete galleries for ${catalog.total - catalog.fullGalleries} products`, area: "Catalog" },
    { priority: 2, show: !launchReadiness.emailSupport, title: "Create and test support@ mailbox", area: "Email" },
    { priority: 3, show: !launchReadiness.faviconReady, title: "Create and install the final favicon set", area: "Branding" },
    { priority: 3, show: score.categories.Marketing < 100, title: "Complete analytics, search and newsletter tracking setup", area: "Marketing" },
    { priority: 3, show: !launchReadiness.socialInstagram || !launchReadiness.socialFacebook, title: "Secure and connect primary social profiles", area: "Social" }
  ];
  return tasks.filter(task => task.show).sort((a, b) => a.priority - b.priority).slice(0, 10);
}

function renderAdminLaunchCenter() {
  const score = launchScoreData();
  const { catalog, payments } = score;
  const checklistTasks = launchChecklistTasks(score);
  const tasksFor = area => checklistTasks.filter(task => task.area === area);
  const actionItems = launchActionItems(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - score.overall / 100 * circumference;
  adminShell("Launch Readiness Center", `<section class="launch-overview">
    <article class="launch-score-card">
      <div class="launch-score-ring"><svg viewBox="0 0 128 128" aria-label="${score.overall}% launch ready"><circle cx="64" cy="64" r="54"></circle><circle class="score-progress" cx="64" cy="64" r="54" style="stroke-dasharray:${circumference};stroke-dashoffset:${offset}"></circle></svg><strong>${score.overall}%</strong></div>
      <div><p class="eyebrow">Overall launch score</p><h2>${score.overall >= 85 ? "Nearly ready for final approval." : score.overall >= 60 ? "Strong foundation, important work remains." : "Core launch requirements are still open."}</h2><p>The score combines branding, catalog, payments, legal, marketing and operational readiness. Checklist decisions are stored locally in this browser.</p></div>
    </article>
    <section class="launch-category-scores">${Object.entries(score.categories).map(([name, value]) => `<article><div><span>${name}</span><strong>${value}%</strong></div><div class="score-bar"><i style="width:${value}%"></i></div></article>`).join("")}</section>
  </section>
  ${imageProductionProgressWidget()}
  <section class="launch-toolbar"><div><strong>Launch checklist management</strong><span>Ownership, due dates, notes and workflow status are stored locally.</span></div><button class="ghost" onclick="exportLaunchChecklistCsv()">Export CSV</button><button class="button" onclick="window.print()">Print checklist</button></section>
  <section class="launch-grid">
    ${launchChecklistCard("01", "Branding", "Identity and campaign foundations.", tasksFor("Branding"))}
    ${launchChecklistCard("02", "Domain", "Public hosting and security.", tasksFor("Domain"))}
    ${launchChecklistCard("03", "Email", "Customer and partner communication.", tasksFor("Email"))}
    ${launchChecklistCard("04", "Payments", "Live connection status from payment settings.", tasksFor("Payments"), `<a class="launch-card-link" href="/admin/settings/payments">Open payment settings</a>`)}
    ${launchChecklistCard("05", "Legal", "Professional review status.", tasksFor("Legal"))}
    ${launchChecklistCard("06", "Catalog", "Live metrics from the current product data.", tasksFor("Catalog"), `<div class="catalog-launch-stats"><div><strong>${catalog.total}</strong><span>Total products</span></div><div><strong>${catalog.fullGalleries}</strong><span>Full galleries (5+)</span></div><div><strong>${catalog.needsReview}</strong><span>Need review</span></div><div><strong>${catalog.missingImages}</strong><span>Missing images</span></div><div><strong>${catalog.missingDescriptions}</strong><span>Missing descriptions</span></div></div><a class="launch-card-link" href="/admin/products">Open product management</a>`)}
    ${launchChecklistCard("07", "Marketing", "Measurement and retention setup.", tasksFor("Marketing"))}
    ${launchChecklistCard("08", "Social Media", "Account and profile readiness.", tasksFor("Social Media"))}
  </section>
  <section class="action-center">
    <header><div><p class="eyebrow">Action Center</p><h2>Highest-priority launch tasks</h2></div><span>${actionItems.length} open priorities</span></header>
    <div class="launch-actions">${actionItems.length ? actionItems.map((task, index) => `<article class="priority-${task.priority}"><span>${String(index + 1).padStart(2, "0")}</span><div><small>${task.priority === 1 ? "Critical" : task.priority === 2 ? "High" : "Next"}</small><h3>${task.title}</h3></div><strong>${task.area}</strong></article>`).join("") : `<article class="launch-complete"><h3>All tracked launch tasks are complete.</h3><p>Run a final legal, payment and production smoke test before publishing.</p></article>`}</div>
  </section>`);
}

function renderAdminAiGenerator() {
  const recentDrafts = aiProductDrafts.slice(0, 6);
  adminShell("AI Product Generator", `<section class="ai-generator-layout">
    <form class="admin-form ai-generator-form" onsubmit="generateAiProductDraft(event)">
      <section><p class="eyebrow">Draft studio</p><h2>Generate a structured product concept</h2><p>This local suggestion tool creates editable draft copy and prompts. It does not alter the live catalog or call an external AI service.</p></section>
      <div class="two"><label>Brand<select name="brand">${Object.values(brandDefinitions).map(brand => `<option>${brand.name}</option>`).join("")}</select></label><label>Product type<input required name="productType" placeholder="Overshirt, weekender, hoodie..."></label></div>
      <div class="two"><label>Collection<input name="collection" placeholder="New Arrivals"></label><label>Audience<select name="audience"><option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option></select></label></div>
      <div class="two"><label>Material direction<input name="material" placeholder="Indigo denim, premium leather..."></label><label>Target cost EUR<input name="cost" type="number" min="0" step="0.01" value="35"></label></div>
      <label>Creative direction<textarea name="direction" placeholder="Quiet luxury, relaxed fit, heritage details..."></textarea></label>
      <button class="button">Generate draft suggestions</button>
    </form>
    <section id="aiDraftOutput" class="ai-draft-output"><p class="eyebrow">Suggestion output</p><h2>Ready when you are.</h2><p>Complete the brief to generate titles, SEO copy, pricing guidance and a five-image gallery prompt set.</p></section>
  </section>
  <section class="section-title admin-section-title"><p>Saved locally</p><h2>Recent concept drafts</h2></section>
  <section class="ai-draft-history">${recentDrafts.length ? recentDrafts.map(draft => `<article><span>${escapeHtml(draft.brand)}</span><h3>${escapeHtml(draft.title)}</h3><p>${escapeHtml(draft.seoDescription)}</p><strong>${euro(draft.suggestedPrice)}</strong></article>`).join("") : "<p>No saved drafts yet.</p>"}</section>`);
}

function generateAiProductDraft(event) {
  event.preventDefault();
  const form = event.target;
  const brand = form.brand.value;
  const type = titleCase(form.productType.value);
  const collection = form.collection.value || "New Arrivals";
  const material = form.material.value || "premium selected material";
  const direction = form.direction.value || "clean, modern and versatile";
  const cost = Number(form.cost.value || 0);
  const marginPrice = Math.ceil((cost / 0.42) / 5) * 5;
  const prefixes = {
    "The Leather Atelier": ["Heritage", "Executive", "No. 01"],
    "Letta & Luna": ["Soft Day", "Little Journey", "Cloud"],
    "Custom Denim Studio": ["Foundry", "Archive", "Indigo Works"],
    "LoomingsThread Apparel": ["Form", "Studio", "Essential"]
  };
  const prefix = prefixes[brand]?.[aiProductDrafts.length % 3] || "Studio";
  const title = `${prefix} ${type}`;
  const seoTitle = `${title} | ${brand}`;
  const seoDescription = `${title} aus ${material}. ${direction}. Entdecken Sie die ${collection} Kollektion bei LoomingsThread.`;
  const promptBase = `${title}, ${brand}, ${material}, ${direction}, premium ecommerce fashion photography, accurate construction, no text, no logo artifacts`;
  const draft = {
    id: `DRAFT-${Date.now()}`, brand, title, collection, material, direction,
    seoTitle, seoDescription, suggestedPrice: Math.max(29, marginPrice),
    galleryPrompts: [
      `${promptBase}, centered front view on clean studio background, full product visible`,
      `${promptBase}, centered back view on clean studio background, full product visible`,
      `${promptBase}, three-quarter side angle, clean studio background`,
      `${promptBase}, macro detail of material, stitching and construction`,
      `${promptBase}, editorial lifestyle campaign, natural light, realistic model and environment`
    ],
    createdAt: new Date().toISOString()
  };
  aiProductDrafts.unshift(draft);
  localStorage.setItem("loomingsthreadAiProductDrafts", JSON.stringify(aiProductDrafts));
  document.querySelector("#aiDraftOutput").innerHTML = `<p class="eyebrow">Generated concept</p><h2>${escapeHtml(title)}</h2><dl><div><dt>SEO title</dt><dd>${escapeHtml(seoTitle)}</dd></div><div><dt>SEO description</dt><dd>${escapeHtml(seoDescription)}</dd></div><div><dt>Pricing suggestion</dt><dd>${euro(draft.suggestedPrice)}</dd></div></dl><h3>Gallery prompt suggestions</h3><ol>${draft.galleryPrompts.map(prompt => `<li>${escapeHtml(prompt)}</li>`).join("")}</ol><button class="ghost" onclick="copyAiDraft('${draft.id}')">Copy draft JSON</button>`;
}

function copyAiDraft(id) {
  const draft = aiProductDrafts.find(item => item.id === id);
  if (!draft) return;
  navigator.clipboard?.writeText(JSON.stringify(draft, null, 2));
  adminNotice("Draft JSON copied to clipboard.");
}

function renderAdminLogin() {
  document.body.classList.add("admin-mode");
  updateSeo("Admin Login", "Demo Admin Login fuer The Leather Atelier.");
  app.innerHTML = `<section class="auth-layout admin-login"><form class="auth-card" onsubmit="adminLogin(event)"><p class="eyebrow">The Leather Atelier</p><h1>Admin Login</h1><input name="email" type="email" required placeholder="admin@leatheratelier.de"><input name="password" type="password" required placeholder="admin123"><button class="button wide">Login</button><p>Demo login: admin@leatheratelier.de / admin123</p></form></section>`;
}

function adminLogin(event) {
  event.preventDefault();
  const form = event.target;
  if (form.email.value === "admin@leatheratelier.de" && form.password.value === "admin123") {
    localStorage.setItem("atelierAdminLoggedIn", "true");
    location.href = "/admin/products";
    return;
  }
  alert("Demo login failed.");
}

function adminCatalogVisibilityMetrics() {
  const items = products.filter(product => product.deleted !== true);
  return {
    total: items.length,
    public: items.filter(isPublicProduct).length,
    imagePending: items.filter(product => !isPublicProduct(product)).length,
    concepts: items.filter(isConceptProduct).length
  };
}

function renderAdminDashboard() {
  const visible = publicProducts().length;
  const metrics = businessMetrics("year");
  const catalogVisibility = adminCatalogVisibilityMetrics();
  adminShell("Dashboard", `<section class="admin-stats business-stats">
    <article><b>${catalogVisibility.total}</b><span>Total products</span></article>
    <article><b>${visible}</b><span>Public products</span></article>
    <article><b>${catalogVisibility.imagePending}</b><span>Image pending</span></article>
    <article><b>${catalogVisibility.concepts}</b><span>Concept products</span></article>
    <article><b>${metrics.totalCustomers}</b><span>Total customers</span></article>
    <article><b>${metrics.totalOrders}</b><span>Total orders</span></article>
    <article><b>${euro(metrics.revenue)}</b><span>Revenue</span></article>
    <article><b>${euro(metrics.netProfit)}</b><span>Profit</span></article>
    <article><b>${metrics.pendingOrders}</b><span>Pending orders</span></article>
    <article><b>${metrics.awaitingPayment}</b><span>Awaiting payment</span></article>
    <article><b>${metrics.inProduction}</b><span>In production</span></article>
    <article><b>${metrics.shipped}</b><span>Orders shipped</span></article>
  </section><section class="dashboard-grid"><article class="admin-empty"><h2>Business overview</h2><p>Local demo orders, customer data, inventory, purchase orders and profit reports are stored in this browser until a real backend is connected.</p><div class="quick-links"><a class="button" href="/admin/orders">Orders</a><a class="ghost" href="/admin/purchase-orders">Purchase Orders</a><a class="ghost" href="/admin/reports">Reports</a></div></article><article class="admin-empty"><h2>Launch note</h2><p><strong>Legal launch note:</strong> These texts are placeholders and must be reviewed by a lawyer or legal text provider before launch.</p><p>Use export to download an updated products.json file when catalog edits are ready.</p></article></section>`);
}

function adminProductRow(product) {
  const sale = product.saleActive && Number(product.salePriceEur) > 0;
  const hidden = product.active === false || product.deleted === true;
  const visibility = publicProductEligibility(product);
  return `<tr class="${hidden || !visibility.eligible ? "is-muted" : ""}"><td><img src="${mainImage(product)}" alt="${product.name}"></td><td><strong>${titleCase(product.name)}</strong><small>${product.articleNumber || product.slug}</small></td><td>${product.folder}</td><td>${sale ? `<s>${euro(regularPrice(product))}</s><br><b>${euro(productPrice(product))}</b>` : euro(regularPrice(product))}</td><td>${product.stockQty ?? 0} / ${product.inStock ? "In stock" : "Out"}</td><td>${visibility.eligible ? `<span class="status-pill">Public</span>` : `<span class="status-pill status-warning">${escapeHtml(product.publicImageStatus || "Image pending")}</span><small>${escapeHtml(visibility.reason)}</small>`}${product.featured ? " Featured" : ""}${product.bestseller ? " Bestseller" : ""}${product.newArrival ? " New" : ""}${sale ? " Sale" : ""}${hidden ? " Hidden" : ""}</td><td><a class="ghost" href="/admin/products/edit/${product.slug}">Edit</a><button class="ghost" onclick="adminToggleActive('${product.slug}')">${product.active === false ? "Enable" : "Disable"}</button><button class="ghost danger" onclick="adminDeleteProduct('${product.slug}')">Delete local</button></td></tr>`;
}

function renderAdminProducts() {
  const folders = ["All", ...new Set(products.map(product => product.folder))];
  const categories = [...new Set(products.map(product => product.folder))];
  const visibility = adminCatalogVisibilityMetrics();
  adminShell("Products", `<section class="admin-stats catalog-visibility-stats"><article><b>${visibility.total}</b><span>Total products</span></article><article><b>${visibility.public}</b><span>Public products</span></article><article><b>${visibility.imagePending}</b><span>Image pending</span></article><article><b>${visibility.concepts}</b><span>Concept products</span></article></section>
  <section class="admin-tools"><input id="adminSearch" placeholder="Search title, SKU, material"><select id="adminFolder">${folders.map(folder => `<option>${folder}</option>`).join("")}</select><select id="adminStatus"><option>All</option><option>Visible</option><option>Hidden</option><option>Image pending</option><option>Concept</option><option>Sale</option><option>Featured</option><option>Bestseller</option><option>New Arrival</option><option>Out of stock</option></select><a class="button" href="/admin/products/new">Add new product</a></section>
  <section class="admin-bulk"><div><h2>Bulk tools</h2><p>Applies to the currently filtered products.</p></div><label>Bulk set category<select id="bulkCategory"><option>No change</option>${categories.map(category => `<option>${category}</option>`).join("")}</select></label><label>Bulk set sale %<input id="bulkSalePercent" type="number" min="0" max="95" placeholder="20"></label><label class="check"><input id="bulkFeatured" type="checkbox"> Mark featured</label><label class="check"><input id="bulkBestseller" type="checkbox"> Mark bestseller</label><label>Activate/deactivate<select id="bulkActive"><option>No change</option><option>Activate</option><option>Deactivate</option></select></label><button class="button" onclick="applyBulkEdit()">Apply bulk edit</button><button class="ghost" onclick="cleanImportedProductTexts()">Clean imported product texts</button></section>
  <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th>Actions</th></tr></thead><tbody id="adminRows"></tbody></table></div>`);
  const refresh = () => {
    const filtered = currentAdminFilteredProducts();
    document.querySelector("#adminRows").innerHTML = filtered.map(adminProductRow).join("");
  };
  document.querySelectorAll("#adminSearch,#adminFolder,#adminStatus").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function adminToggleActive(slug) {
  const product = getProduct(slug);
  adminEdits[slug] = { ...adminEdits[slug], slug, active: product.active === false };
  saveAdminEdits();
  renderAdminProducts();
}

function adminDeleteProduct(slug) {
  adminEdits[slug] = { ...adminEdits[slug], slug, deleted: true, active: false };
  cart = cart.filter(item => item.id !== slug);
  wishlist = wishlist.filter(item => item !== slug);
  saveAdminEdits();
  renderAdminProducts();
}

function renderAdminProductForm(slug) {
  const existing = slug ? getProduct(slug) : null;
  const product = existing || {
    slug: "",
    name: "",
    titleDe: "",
    titleEn: "",
    folder: "wallets",
    category: "wallets",
    descriptionDe: "",
    descriptionEn: "",
    materialDe: "Leder",
    materialEn: "Leather",
    leatherTypeDe: "Echtes Leder",
    leatherTypeEn: "Genuine leather",
    dimensions: "",
    colorOptions: ["Black"],
    sizeOptions: ["Standard"],
    priceEur: 0,
    brand: "The Leather Atelier",
    collection: "Leather Goods",
    season: "All Season",
    gender: "Unisex",
    styleTags: [],
    salePriceEur: "",
    stockQty: 10,
    inStock: true,
    images: []
  };
  const images = productImages(product);
  const folderOptions = ["wallets","cardholders","belts","laptop-bags","duffle-bags","ladies-bags","kidswear","denim","apparel","other"];
  const brandOptions = ["The Leather Atelier","Letta & Luna","Custom Denim Studio","LoomingsThread Apparel"];
  const genderOptions = ["Unisex","Men","Women","Kids","Baby","Toddler","Boys","Girls"];
  const seasonOptions = ["All Season","Spring Summer","Autumn Winter","Summer","Winter"];
  adminShell(existing ? "Edit Product" : "Add Product", `<form class="admin-form" onsubmit="saveAdminProduct(event, '${slug || ""}')">
    <section><h2>Basic</h2><div class="two"><label>Title DE<input name="titleDe" value="${product.titleDe || product.name || ""}" required></label><label>Title EN<input name="titleEn" value="${product.titleEn || product.name || ""}"></label></div><label>Slug<input name="slug" value="${product.slug || ""}" ${existing ? "readonly" : ""}></label><div class="two"><label>Brand<select name="brand">${brandOptions.map(brand => `<option${(product.brand || "The Leather Atelier") === brand ? " selected" : ""}>${brand}</option>`).join("")}</select></label><label>Category folder<select name="folder">${folderOptions.map(folder => `<option${product.folder === folder ? " selected" : ""}>${folder}</option>`).join("")}</select></label></div><div class="two"><label>Collection<input name="collection" value="${product.collection || ""}"></label><label>Season<select name="season">${seasonOptions.map(season => `<option${(product.season || "All Season") === season ? " selected" : ""}>${season}</option>`).join("")}</select></label></div><div class="two"><label>Gender<select name="gender">${genderOptions.map(gender => `<option${(product.gender || "Unisex") === gender ? " selected" : ""}>${gender}</option>`).join("")}</select></label><label>Style tags comma-separated<input name="styleTags" value="${(product.styleTags || product.tags || []).join(", ")}"></label></div><div class="two"><label>Price EUR<input name="priceEur" type="number" step="0.01" value="${regularPrice(product)}"></label><label>Sale price EUR<input name="salePriceEur" type="number" step="0.01" value="${product.salePriceEur || ""}"></label></div><div class="check-grid"><label class="check"><input name="saleActive" type="checkbox" ${product.saleActive ? "checked" : ""}> Sale on</label><label class="check"><input name="featured" type="checkbox" ${product.featured ? "checked" : ""}> Featured</label><label class="check"><input name="bestseller" type="checkbox" ${product.bestseller ? "checked" : ""}> Bestseller</label><label class="check"><input name="newArrival" type="checkbox" ${product.newArrival ? "checked" : ""}> New Arrival</label><label class="check"><input name="active" type="checkbox" ${product.active !== false ? "checked" : ""}> Active</label><label class="check"><input name="inStock" type="checkbox" ${product.inStock !== false ? "checked" : ""}> In stock</label></div></section>
    <section><h2>Description</h2><label>Description DE<textarea name="descriptionDe">${product.descriptionDe || product.description || ""}</textarea></label><label>Description EN<textarea name="descriptionEn">${product.descriptionEn || ""}</textarea></label><div class="two"><label>Material DE<input name="materialDe" value="${product.materialDe || product.material || ""}"></label><label>Leather Type DE<input name="leatherTypeDe" value="${product.leatherTypeDe || product.leatherType || ""}"></label></div><label>Dimensions<input name="dimensions" value="${product.dimensions || ""}"></label><div class="two"><label>Color options comma-separated<input name="colorOptions" value="${(product.colorOptions || []).join(", ")}"></label><label>Size options comma-separated<input name="sizeOptions" value="${(product.sizeOptions || []).join(", ")}"></label></div><label>Stock quantity<input name="stockQty" type="number" value="${product.stockQty ?? 10}"></label></section>
    <section><h2>Images</h2><label>Main image<select name="mainImage">${images.map(src => `<option${src === mainImage(product) ? " selected" : ""}>${src}</option>`).join("")}</select></label><label>Gallery images, one path per line<textarea name="images">${images.join("\n")}</textarea></label><p class="form-help">Use local paths such as /products/wallets/example/image-1.jpg. Imported image files are not deleted by admin actions.</p></section>
    <div class="admin-form-actions"><button class="button">Save product</button><a class="ghost" href="/admin/products">Cancel</a></div>
  </form>`);
}

function saveAdminProduct(event, originalSlug) {
  event.preventDefault();
  const form = event.target;
  const folder = form.folder.value;
  const slug = originalSlug || slugify(form.slug.value || form.titleDe.value);
  const images = form.images.value.split(/\n+/).map(value => value.trim()).filter(Boolean);
  const product = {
    ...(getProduct(originalSlug) || {}),
    isAdminNew: !originalSlug,
    slug,
    name: form.titleDe.value,
    productName: form.titleDe.value,
    titleDe: form.titleDe.value,
    titleEn: form.titleEn.value || form.titleDe.value,
    articleNumber: getProduct(originalSlug)?.articleNumber || createSku(folder),
    folder,
    brand: form.brand.value,
    category: folder,
    collection: form.collection.value,
    collections: [form.collection.value, form.season.value, form.gender.value].filter(Boolean),
    season: form.season.value,
    gender: form.gender.value,
    ageGroup: ["Kids","Baby","Toddler","Boys","Girls"].includes(form.gender.value) ? form.gender.value : "Adult",
    styleTags: form.styleTags.value.split(",").map(value => value.trim()).filter(Boolean),
    descriptionDe: form.descriptionDe.value,
    descriptionEn: form.descriptionEn.value,
    description: form.descriptionDe.value,
    shortDescription: form.descriptionDe.value.slice(0, 160),
    materialDe: form.materialDe.value,
    materialEn: form.materialDe.value,
    material: form.materialDe.value,
    leatherTypeDe: form.leatherTypeDe.value,
    leatherTypeEn: form.leatherTypeDe.value,
    leatherType: form.leatherTypeDe.value,
    dimensions: form.dimensions.value,
    colorOptions: form.colorOptions.value.split(",").map(value => value.trim()).filter(Boolean),
    sizeOptions: form.sizeOptions.value.split(",").map(value => value.trim()).filter(Boolean),
    priceEur: Number(form.priceEur.value || 0),
    retailPriceEUR: Number(form.priceEur.value || 0),
    salePriceEur: form.salePriceEur.value ? Number(form.salePriceEur.value) : "",
    saleActive: form.saleActive.checked,
    featured: form.featured.checked,
    bestseller: form.bestseller.checked,
    newArrival: form.newArrival.checked,
    active: form.active.checked,
    inStock: form.inStock.checked,
    stockQty: Number(form.stockQty.value || 0),
    images,
    mainImage: form.mainImage.value || images[0] || "",
    galleryImages: images.filter(src => src !== (form.mainImage.value || images[0])),
    imageCount: images.length,
    deleted: false
  };
  adminEdits[slug] = product;
  saveAdminEdits();
  location.href = `/admin/products/edit/${slug}`;
}

const orderStatuses = ["New", "Awaiting Payment", "Paid", "In Production", "Shipped", "Completed", "Cancelled", "Refunded"];
const paymentStatuses = ["Awaiting Payment", "Paid", "Refunded"];
const shippingStatuses = ["Not shipped", "Preparing", "Shipped", "Delivered", "Returned"];

function adminOrderRow(order) {
  return `<tr><td><strong>${order.orderNumber}</strong><small>${new Date(order.orderDate).toLocaleString("de-DE")}</small></td><td>${order.customerName}<small>${order.email}</small></td><td>${order.products.length} products</td><td>${euro(order.total)}</td><td><span class="status-pill">${order.orderStatus}</span><small>Payment: ${order.paymentStatus || "Awaiting Payment"}</small></td><td><a class="ghost" href="/admin/orders/${order.orderNumber}">Open</a><a class="ghost" href="/admin/orders/${order.orderNumber}/invoice">Invoice</a></td></tr>`;
}

function renderAdminOrders() {
  adminShell("Orders", `<section class="admin-tools"><input id="orderSearch" placeholder="Search order, customer, email"><select id="orderStatus"><option>All</option>${orderStatuses.map(status => `<option>${status}</option>`).join("")}</select></section><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody id="orderRows"></tbody></table></div>`);
  const refresh = () => {
    const query = document.querySelector("#orderSearch").value.toLowerCase();
    const status = document.querySelector("#orderStatus").value;
    const filtered = orders.filter(order => {
      const haystack = `${order.orderNumber} ${order.customerName} ${order.email}`.toLowerCase();
      return haystack.includes(query) && (status === "All" || order.orderStatus === status);
    });
    document.querySelector("#orderRows").innerHTML = filtered.length ? filtered.map(adminOrderRow).join("") : `<tr><td colspan="6">No local demo orders yet.</td></tr>`;
  };
  document.querySelectorAll("#orderSearch,#orderStatus").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function renderAdminOrderDetail(orderNumber) {
  const order = orderByNumber(orderNumber);
  if (!order) {
    adminShell("Order not found", `<section class="admin-empty"><p>No order found for ${orderNumber}.</p></section>`);
    return;
  }
  adminShell(`Order ${order.orderNumber}`, `<section class="order-detail-grid"><article class="admin-empty"><h2>Customer</h2><p><strong>${order.customerName}</strong><br>${order.email}<br>${order.phone}</p><h3>Shipping</h3><p>${order.shippingAddress}</p><p><strong>Country:</strong> ${order.shippingCountry || "Deutschland"}<br><strong>Zone:</strong> ${order.shippingZone || shippingZone(order.shippingCountry || "Deutschland").label}<br><strong>Method:</strong> ${order.shippingMethod || "DHL Standard"}</p><h3>Billing</h3><p>${order.billingAddress}</p></article><article class="admin-empty"><h2>Status</h2><label>Order status<select id="detailStatus">${orderStatuses.map(status => `<option${status === order.orderStatus ? " selected" : ""}>${status}</option>`).join("")}</select></label><label>Internal note<textarea id="detailNote">${order.internalNote || ""}</textarea></label><button class="button" onclick="saveOrderDetail('${order.orderNumber}')">Save order</button><button class="ghost" onclick="createPurchaseOrderFromOrder('${order.orderNumber}')">Create supplier PO</button><a class="ghost" href="/admin/orders/${order.orderNumber}/invoice">Invoice preview</a></article></section><section class="order-detail-grid"><article class="admin-empty"><h2>Shipping Management</h2><label>Carrier<select id="detailCarrier">${carrierOptions.map(carrier => `<option${carrier === (order.shippingCarrier || "DHL") ? " selected" : ""}>${carrier}</option>`).join("")}</select></label><label>Shipping status<select id="detailShippingStatus">${shippingStatuses.map(status => `<option${status === (order.shippingStatus || "Not shipped") ? " selected" : ""}>${status}</option>`).join("")}</select></label><label>Tracking number<input id="detailTracking" value="${order.trackingNumber || ""}" placeholder="Tracking number placeholder"></label><label>Tracking URL<input id="detailTrackingUrl" value="${order.trackingUrl || ""}" placeholder="https://tracking.example/..."></label></article><article class="admin-empty"><h2>Payment</h2><p><strong>${order.paymentMethod}</strong><br>${order.paymentNotice || "Diese Zahlungsart ist vorbereitet und wird vor dem Livegang final aktiviert."}</p><label>Payment status<select id="detailPaymentStatus">${paymentStatuses.map(status => `<option${status === (order.paymentStatus || "Awaiting Payment") ? " selected" : ""}>${status}</option>`).join("")}</select></label><label>Payment reference<input id="detailPaymentReference" value="${order.paymentReference || ""}" placeholder="Transaction/reference placeholder"></label><div class="payment-actions"><button class="button" onclick="markOrderPaid('${order.orderNumber}')">Mark as paid</button><button class="ghost danger" onclick="markOrderRefunded('${order.orderNumber}')">Mark as refunded</button></div></article></section><section class="order-detail-grid">${paymentNoticeBlock(order)}<article class="payment-instructions"><h3>Tracking placeholder</h3><p>${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "Tracking will be added after shipment."}</p><p>${order.trackingUrl ? `<a href="${order.trackingUrl}" target="_blank" rel="noreferrer">Open tracking URL</a>` : "No tracking URL yet."}</p></article></section><section class="admin-empty"><h2>Products</h2><ul class="order-lines">${order.products.map(item => `<li>${item.quantity} x ${item.title}<span>${euro(item.lineTotal)}</span></li>`).join("")}</ul><dl class="totals"><div><dt>Subtotal</dt><dd>${euro(order.subtotal)}</dd></div><div><dt>VAT</dt><dd>${euro(order.VAT)}</dd></div><div><dt>Shipping</dt><dd>${euro(order.shipping)}</dd></div></dl><strong>${euro(order.total)}</strong></section><section class="email-preview-grid">${emailPreview("order", order)}${emailPreview("shipping", order)}${emailPreview("payment", order)}</section>`);
}

function saveOrderDetail(orderNumber) {
  updateOrder(orderNumber, {
    orderStatus: document.querySelector("#detailStatus").value,
    paymentStatus: document.querySelector("#detailPaymentStatus")?.value || "Awaiting Payment",
    paymentReference: document.querySelector("#detailPaymentReference")?.value || "",
    trackingNumber: document.querySelector("#detailTracking").value,
    trackingUrl: document.querySelector("#detailTrackingUrl")?.value || "",
    shippingCarrier: document.querySelector("#detailCarrier")?.value || "",
    shippingStatus: document.querySelector("#detailShippingStatus")?.value || "Not shipped",
    internalNote: document.querySelector("#detailNote").value
  });
  adminNotice(`Order ${orderNumber} updated.`);
  renderAdminOrderDetail(orderNumber);
}

function markOrderPaid(orderNumber) {
  const reference = document.querySelector("#detailPaymentReference")?.value || `PAID-${orderNumber}`;
  updateOrder(orderNumber, { paymentStatus: "Paid", orderStatus: "Paid", paymentReference: reference });
  renderAdminOrderDetail(orderNumber);
  adminNotice(`Order ${orderNumber} marked as paid.`);
}

function markOrderRefunded(orderNumber) {
  const reference = document.querySelector("#detailPaymentReference")?.value || `REFUND-${orderNumber}`;
  updateOrder(orderNumber, { paymentStatus: "Refunded", orderStatus: "Refunded", paymentReference: reference });
  renderAdminOrderDetail(orderNumber);
  adminNotice(`Order ${orderNumber} marked as refunded.`);
}

function emailPreview(type, order) {
  const map = {
    order: ["Order confirmation email", `Hallo ${order.customerName}, vielen Dank fuer deine Bestellung ${order.orderNumber}. Gesamtbetrag: ${euro(order.total)}.`],
    shipping: ["Shipping confirmation email", `Deine Bestellung ${order.orderNumber} wurde versendet. Tracking: ${order.trackingNumber || "wird ergaenzt"}.`],
    payment: ["Payment reminder email", `Bitte begleiche deine Bestellung ${order.orderNumber} per ${order.paymentMethod}. Betrag: ${euro(order.total)}.`]
  };
  const [title, text] = map[type];
  return `<article class="email-preview"><h3>${title}</h3><p>${text}</p></article>`;
}

function renderInvoice(orderNumber) {
  const order = orderByNumber(orderNumber);
  if (!order) {
    adminShell("Invoice not found", `<section class="admin-empty"><p>No order found for ${orderNumber}.</p></section>`);
    return;
  }
  adminShell(`Invoice ${order.invoiceNumber}`, `<section class="invoice-actions"><button class="button" onclick="window.print()">Print invoice</button><a class="ghost" href="/admin/orders/${order.orderNumber}">Back to order</a></section><section class="invoice-sheet"><header><div><h2>${adminSettings.storeName}</h2><p>${adminSettings.storeEmail}<br>${adminSettings.whatsapp}</p></div><div><p><strong>Invoice number</strong><br>${order.invoiceNumber}</p><p><strong>Invoice date</strong><br>${new Date().toLocaleDateString("de-DE")}</p><p><strong>Order number</strong><br>${order.orderNumber}</p></div></header><section class="invoice-address"><h3>Customer address</h3><p>${order.customerName}<br>${order.billingAddress}<br>${order.email}</p><p><strong>Delivery country:</strong> ${order.shippingCountry || "Deutschland"}<br><strong>Shipping method:</strong> ${order.shippingMethod || "DHL Standard"}<br><strong>Carrier:</strong> ${order.shippingCarrier || "DHL"}</p></section><table class="invoice-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${order.products.map(item => `<tr><td>${item.title}</td><td>${item.quantity}</td><td>${euro(item.unitPrice)}</td><td>${euro(item.lineTotal)}</td></tr>`).join("")}</tbody></table><dl class="totals invoice-totals"><div><dt>Subtotal</dt><dd>${euro(order.subtotal)}</dd></div><div><dt>VAT</dt><dd>${euro(order.VAT)}</dd></div><div><dt>Shipping to ${order.shippingCountry || "Deutschland"}</dt><dd>${euro(order.shipping)}</dd></div><div><dt>Total</dt><dd>${euro(order.total)}</dd></div></dl><section class="invoice-payment"><p><strong>Payment method:</strong> ${order.paymentMethod}</p><p><strong>Payment status:</strong> ${order.paymentStatus || "Awaiting Payment"}</p>${order.paymentReference ? `<p><strong>Payment reference:</strong> ${order.paymentReference}</p>` : ""}${bankTransferBlock(order)}</section></section>`);
}

function renderAdminPaymentSettings() {
  const payments = { ...defaultPaymentSettings(), ...(adminSettings.payments || {}) };
  adminShell("Payment Settings", `<form class="admin-form payment-settings-form" onsubmit="saveAdminPaymentSettingsForm(event)">
    <section>
      <h2>Payment provider placeholders</h2>
      <p class="form-help">These fields prepare future integrations only. No live payment API is connected and no real transaction is processed.</p>
      <div class="payment-settings-grid">
        <article><label class="check"><input name="paypalEnabled" type="checkbox" ${payments.paypalEnabled ? "checked" : ""}> PayPal enabled</label><label>PayPal client ID placeholder<input name="paypalClientId" value="${payments.paypalClientId || ""}"></label></article>
        <article><label class="check"><input name="stripeEnabled" type="checkbox" ${payments.stripeEnabled ? "checked" : ""}> Stripe enabled</label><label>Stripe publishable key placeholder<input name="stripePublishableKey" value="${payments.stripePublishableKey || ""}"></label></article>
        <article><label class="check"><input name="klarnaEnabled" type="checkbox" ${payments.klarnaEnabled ? "checked" : ""}> Klarna enabled</label><label>Klarna merchant ID placeholder<input name="klarnaMerchantId" value="${payments.klarnaMerchantId || ""}"></label></article>
      </div>
    </section>
    <section>
      <h2>Bank transfer / Vorkasse</h2>
      <label class="check"><input name="bankTransferEnabled" type="checkbox" ${payments.bankTransferEnabled ? "checked" : ""}> Bank transfer enabled</label>
      <div class="two"><label>Bank account owner<input name="bankAccountOwner" value="${payments.bankAccountOwner || ""}"></label><label>Bank name<input name="bankName" value="${payments.bankName || ""}"></label></div>
      <div class="two"><label>IBAN<input name="iban" value="${payments.iban || ""}"></label><label>BIC<input name="bic" value="${payments.bic || ""}"></label></div>
      <label>Payment instruction text<textarea name="paymentInstructionText">${payments.paymentInstructionText || ""}</textarea></label>
    </section>
    <div class="admin-form-actions"><button class="button">Save payment settings</button><a class="ghost" href="/admin/settings">Back to settings</a></div>
  </form>`);
}

function saveAdminPaymentSettingsForm(event) {
  event.preventDefault();
  const form = event.target;
  adminSettings.payments = {
    paypalEnabled: form.paypalEnabled.checked,
    paypalClientId: form.paypalClientId.value,
    stripeEnabled: form.stripeEnabled.checked,
    stripePublishableKey: form.stripePublishableKey.value,
    klarnaEnabled: form.klarnaEnabled.checked,
    klarnaMerchantId: form.klarnaMerchantId.value,
    bankTransferEnabled: form.bankTransferEnabled.checked,
    bankAccountOwner: form.bankAccountOwner.value,
    iban: form.iban.value,
    bic: form.bic.value,
    bankName: form.bankName.value,
    paymentInstructionText: form.paymentInstructionText.value
  };
  saveAdminSettings();
  renderAdminPaymentSettings();
  adminNotice("Payment settings saved locally. Live payment APIs are still disabled.");
}

function renderAdminShippingSettings() {
  const shipping = { ...defaultShippingSettings(), ...(adminSettings.shipping || {}) };
  const zoneForms = shippingZoneKeys.map(key => {
    const zone = { ...defaultShippingSettings()[key], ...(shipping[key] || {}) };
    return `<article class="shipping-zone-card">
      <h2>${shippingZoneLabels[key]}</h2>
      <label class="check"><input name="${key}Enabled" type="checkbox" ${zone.enabled ? "checked" : ""}> Enabled</label>
      <div class="two"><label>Shipping price<input name="${key}Price" type="number" step="0.01" value="${zone.price}"></label><label>Free shipping threshold<input name="${key}FreeThreshold" type="number" step="0.01" value="${zone.freeThreshold}"></label></div>
      <label>Estimated delivery time<input name="${key}Estimate" value="${zone.estimate || ""}"></label>
      <div class="carrier-grid"><span>Carrier options</span>${carrierOptions.map(carrier => `<label class="check"><input name="${key}Carriers" type="checkbox" value="${carrier}" ${zone.carriers?.includes(carrier) ? "checked" : ""}> ${carrier}</label>`).join("")}</div>
    </article>`;
  }).join("");
  adminShell("Shipping Settings", `<form class="admin-form shipping-settings-form" onsubmit="saveAdminShippingSettingsForm(event)">
    <section><h2>Shipping zones</h2><p class="form-help">Configure demo-ready shipping zones for Germany, EU delivery, and international shipping. These settings are stored locally until exported or connected to a backend later.</p></section>
    <section class="shipping-zone-grid">${zoneForms}</section>
    <div class="admin-form-actions"><button class="button">Save shipping settings</button><a class="ghost" href="/admin/settings">Back to settings</a></div>
  </form>`);
}

function saveAdminShippingSettingsForm(event) {
  event.preventDefault();
  const form = event.target;
  const shipping = {};
  shippingZoneKeys.forEach(key => {
    shipping[key] = {
      enabled: form[`${key}Enabled`].checked,
      price: Number(form[`${key}Price`].value || 0),
      freeThreshold: Number(form[`${key}FreeThreshold`].value || 0),
      estimate: form[`${key}Estimate`].value,
      carriers: Array.from(form.querySelectorAll(`input[name="${key}Carriers"]:checked`)).map(input => input.value)
    };
  });
  adminSettings.shipping = shipping;
  saveAdminSettings();
  renderAdminShippingSettings();
  adminNotice("Shipping settings saved locally.");
}

function renderAdminSettings() {
  adminShell("Settings", `<form class="admin-form" onsubmit="saveAdminSettingsForm(event)"><section><h2>Store</h2><div class="two"><label>Store name<input name="storeName" value="${adminSettings.storeName}"></label><label>Store email<input name="storeEmail" value="${adminSettings.storeEmail}"></label></div><div class="two"><label>WhatsApp number<input name="whatsapp" value="${adminSettings.whatsapp}"></label><label>Currency<input name="currency" value="${adminSettings.currency}"></label></div><div class="two"><label>VAT percentage<input name="vat" type="number" step="0.01" value="${adminSettings.vat}"></label><label>Default profit margin %<input name="defaultProfitMargin" type="number" step="0.01" value="${adminSettings.defaultProfitMargin || 55}"></label></div></section><section><h2>Shipping prices</h2><div class="two"><label>Germany<input name="shippingGermany" type="number" step="0.01" value="${adminSettings.shippingGermany}"></label><label>Austria<input name="shippingAustria" type="number" step="0.01" value="${adminSettings.shippingAustria}"></label></div><div class="two"><label>Belgium<input name="shippingBelgium" type="number" step="0.01" value="${adminSettings.shippingBelgium}"></label><label>Netherlands<input name="shippingNetherlands" type="number" step="0.01" value="${adminSettings.shippingNetherlands}"></label></div><div class="two"><label>Luxembourg<input name="shippingLuxembourg" type="number" step="0.01" value="${adminSettings.shippingLuxembourg}"></label><label>Free shipping threshold<input name="freeShippingThreshold" type="number" step="0.01" value="${adminSettings.freeShippingThreshold}"></label></div></section><button class="button">Save settings</button></form>`);
}

function saveAdminSettingsForm(event) {
  event.preventDefault();
  const form = event.target;
  adminSettings = {
    storeName: form.storeName.value,
    storeEmail: form.storeEmail.value,
    whatsapp: form.whatsapp.value,
    vat: Number(form.vat.value || 19),
    shippingGermany: Number(form.shippingGermany.value || 0),
    shippingAustria: Number(form.shippingAustria.value || 0),
    shippingBelgium: Number(form.shippingBelgium.value || 0),
    shippingNetherlands: Number(form.shippingNetherlands.value || 0),
    shippingLuxembourg: Number(form.shippingLuxembourg.value || 0),
    freeShippingThreshold: Number(form.freeShippingThreshold.value || 0),
    currency: form.currency.value || "EUR",
    defaultProfitMargin: Number(form.defaultProfitMargin.value || 55),
    payments: adminSettings.payments || defaultPaymentSettings(),
    shipping: adminSettings.shipping || defaultShippingSettings()
  };
  saveAdminSettings();
  renderAdminSettings();
}

const purchaseOrderStatuses = ["Draft", "Sent to Supplier", "Confirmed", "In Production", "Shipped", "Received"];

function createPurchaseOrderFromOrder(orderNumber) {
  const order = orderByNumber(orderNumber);
  if (!order) return;
  const existing = purchaseOrders.find(po => po.customerOrderNumber === orderNumber);
  if (existing) {
    adminNotice(`Purchase order already exists: ${existing.poNumber}`);
    return;
  }
  const expected = new Date();
  expected.setDate(expected.getDate() + 21);
  const po = {
    poNumber: nextPurchaseOrderNumber(),
    customerOrderNumber: order.orderNumber,
    supplierName: "Production partner placeholder",
    orderDate: new Date().toISOString(),
    products: (order.products || []).map(item => ({
      productId: item.productId,
      articleNumber: item.articleNumber,
      title: item.title,
      quantity: item.quantity,
      supplierCost: Math.round(productCostEstimate(item) * 100) / 100
    })),
    shippingCost: Number(order.shipping || 0),
    expectedDeliveryDate: expected.toISOString().slice(0, 10),
    status: "Draft",
    internalNote: ""
  };
  purchaseOrders = [po, ...purchaseOrders];
  savePurchaseOrders();
  renderAdminPurchaseOrders();
  adminNotice(`Purchase order ${po.poNumber} created from ${order.orderNumber}.`);
}

function renderAdminPurchaseOrders() {
  const orderOptions = orders.map(order => `<option value="${order.orderNumber}">${order.orderNumber} - ${order.customerName || order.email}</option>`).join("");
  adminShell("Purchase Orders", `<section class="admin-tools"><select id="poOrderSelect">${orderOptions || `<option>No customer orders available</option>`}</select><button class="button" onclick="createPurchaseOrderFromOrder(document.querySelector('#poOrderSelect').value)" ${orders.length ? "" : "disabled"}>Create supplier purchase order</button></section><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>PO</th><th>Customer order</th><th>Supplier</th><th>Products</th><th>Costs</th><th>Status</th><th>Expected</th></tr></thead><tbody>${purchaseOrders.length ? purchaseOrders.map(po => `<tr><td><strong>${po.poNumber}</strong><small>${new Date(po.orderDate).toLocaleDateString("de-DE")}</small></td><td>${po.customerOrderNumber || ""}</td><td><input value="${po.supplierName || ""}" onchange="updatePurchaseOrder('${po.poNumber}', {supplierName:this.value})"></td><td>${(po.products || []).map(item => `${item.quantity} x ${item.title}`).join("<br>")}</td><td>${euro((po.products || []).reduce((sum, item) => sum + Number(item.supplierCost || 0) * Number(item.quantity || 0), 0) + Number(po.shippingCost || 0))}<small>Shipping ${euro(po.shippingCost || 0)}</small></td><td><select onchange="updatePurchaseOrder('${po.poNumber}', {status:this.value})">${purchaseOrderStatuses.map(status => `<option${status === po.status ? " selected" : ""}>${status}</option>`).join("")}</select></td><td><input type="date" value="${po.expectedDeliveryDate || ""}" onchange="updatePurchaseOrder('${po.poNumber}', {expectedDeliveryDate:this.value})"></td></tr>`).join("") : `<tr><td colspan="7">No supplier purchase orders yet.</td></tr>`}</tbody></table></div>`);
}

function updatePurchaseOrder(poNumber, patch) {
  purchaseOrders = purchaseOrders.map(po => po.poNumber === poNumber ? { ...po, ...patch, updatedAt: new Date().toISOString() } : po);
  savePurchaseOrders();
  adminNotice(`Purchase order ${poNumber} updated locally.`);
}

function renderAdminProfits() {
  const range = new URLSearchParams(location.search).get("range") || "year";
  const metrics = businessMetrics(range);
  adminShell("Profit Tracking", `<section class="admin-tools report-filters">${["today","week","month","year"].map(value => `<a class="${range === value ? "button" : "ghost"}" href="/admin/profits?range=${value}">${titleCase(value)}</a>`).join("")}</section><section class="admin-stats business-stats"><article><b>${euro(metrics.revenue)}</b><span>Revenue</span></article><article><b>${euro(metrics.productCosts)}</b><span>Product costs</span></article><article><b>${euro(metrics.shippingCosts)}</b><span>Shipping costs</span></article><article><b>${euro(metrics.paymentFees)}</b><span>Payment fees</span></article><article><b>${euro(metrics.grossProfit)}</b><span>Gross profit</span></article><article><b>${euro(metrics.netProfit)}</b><span>Net profit</span></article></section><section class="admin-empty"><h2>Profit calculation basis</h2><p>Profit is calculated from local demo orders. Product cost uses landed/admin cost when available, otherwise a conservative local estimate for planning.</p></section>`);
}

function renderAdminCustomers() {
  const customers = customerSummaries();
  adminShell("Customers", `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Customer</th><th>Orders</th><th>Revenue</th><th>Last order</th><th>Order numbers</th></tr></thead><tbody>${customers.length ? customers.map(customer => `<tr><td><strong>${customer.name}</strong><small>${customer.email}${customer.phone ? ` - ${customer.phone}` : ""}</small></td><td>${customer.orders}</td><td>${euro(customer.revenue)}</td><td>${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("de-DE") : "No orders yet"}</td><td>${customer.orderNumbers.join(", ") || "-"}</td></tr>`).join("") : `<tr><td colspan="5">No customers yet.</td></tr>`}</tbody></table></div>`);
}

function renderAdminInventory() {
  const rows = inventoryRows();
  adminShell("Inventory", `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Reserved stock</th><th>Available stock</th><th>Warning</th></tr></thead><tbody>${rows.map(row => `<tr class="${row.available <= 3 ? "low-stock-row" : ""}"><td>${row.product.articleNumber || row.product.sku || row.product.slug}</td><td><strong>${titleCase(row.product.name)}</strong><small>${row.product.folder}</small></td><td>${row.stock}</td><td>${row.reserved}</td><td>${row.available}</td><td>${row.available <= 0 ? "Out of stock" : row.available <= 3 ? "Low stock" : "OK"}</td></tr>`).join("")}</tbody></table></div>`);
}

function reportRows(type) {
  if (type === "customers") return [["Customer", "Email", "Orders", "Revenue", "Last order"], ...customerSummaries().map(customer => [customer.name, customer.email, customer.orders, customer.revenue.toFixed(2), customer.lastOrderDate])];
  if (type === "products") return [["SKU", "Product", "Category", "Stock", "Reserved", "Available"], ...inventoryRows().map(row => [row.product.articleNumber || row.product.slug, titleCase(row.product.name), row.product.folder, row.stock, row.reserved, row.available])];
  if (type === "profits") return [["Order", "Revenue", "Product costs", "Shipping costs", "Payment fees", "Gross profit", "Net profit"], ...orders.map(order => {
    const costs = orderCostSummary(order);
    return [order.orderNumber, costs.revenue.toFixed(2), costs.productCosts.toFixed(2), costs.shippingCosts.toFixed(2), costs.paymentFees.toFixed(2), costs.grossProfit.toFixed(2), costs.netProfit.toFixed(2)];
  })];
  return [["Order", "Date", "Customer", "Status", "Payment status", "Total"], ...orders.map(order => [order.orderNumber, order.orderDate, order.customerName, order.orderStatus, order.paymentStatus, Number(order.total || 0).toFixed(2)])];
}

function exportReportCsv(type) {
  downloadCsv(`the-leather-atelier-${type}-report.csv`, reportRows(type));
}

function renderAdminReports() {
  const sales = reportRows("sales").slice(1, 8);
  const profit = reportRows("profits").slice(1, 8);
  const customers = reportRows("customers").slice(1, 8);
  const productReport = reportRows("products").slice(1, 8);
  const table = (headers, rows) => `<table class="mini-report"><thead><tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">No data yet.</td></tr>`}</tbody></table>`;
  adminShell("Reports", `<section class="report-grid">
    <article><h2>Sales report</h2><button class="ghost" onclick="exportReportCsv('sales')">Export CSV</button>${table(["Order","Date","Customer","Status","Payment","Total"], sales)}</article>
    <article><h2>Profit report</h2><button class="ghost" onclick="exportReportCsv('profits')">Export CSV</button>${table(["Order","Revenue","Costs","Shipping","Fees","Gross","Net"], profit)}</article>
    <article><h2>Customer report</h2><button class="ghost" onclick="exportReportCsv('customers')">Export CSV</button>${table(["Customer","Email","Orders","Revenue","Last order"], customers)}</article>
    <article><h2>Product report</h2><button class="ghost" onclick="exportReportCsv('products')">Export CSV</button>${table(["SKU","Product","Category","Stock","Reserved","Available"], productReport)}</article>
  </section>`);
}

function renderAdminProcurement() {
  const supplierList = activeSuppliers();
  const metrics = procurementMetrics();
  const selectedSupplier = supplierList[0];
  const reportTable = (headers, rows) => `<table class="mini-report"><thead><tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">No data yet.</td></tr>`}</tbody></table>`;
  const supplierCards = supplierList.map(supplier => `<article class="supplier-card"><div><h3>${supplier.name}</h3><p>${supplier.contactName}<br>${supplier.email}<br>${supplier.phone}</p></div><dl><div><dt>Lead time</dt><dd>${supplier.leadTimeDays} days</dd></div><div><dt>On-time</dt><dd>${supplier.onTimeRate}%</dd></div><div><dt>Rating</dt><dd>${supplier.rating}/5</dd></div></dl><label>Notes<textarea onchange="updateSupplier('${supplier.id}', {notes:this.value})">${supplier.notes || ""}</textarea></label></article>`).join("");
  const priceRows = (selectedSupplier.priceList || []).slice(0, 12).map(item => [item.sku, item.product, euro(item.costEur), item.currency || "EUR", item.lastUpdated || ""]);
  const marginRows = procurementReportRows("margin").slice(1, 9);
  const categoryRows = Object.entries(metrics.categoryProfit).map(([category, profit]) => [category, euro(profit)]);
  adminShell("Procurement", `<section class="admin-stats business-stats procurement-stats">
    <article><b>${metrics.openPurchaseOrders}</b><span>Open purchase orders</span></article>
    <article><b>${euro(metrics.supplierSpend)}</b><span>Supplier spend</span></article>
    <article><b>${Math.round(metrics.averageLeadTime)} days</b><span>Average lead time</span></article>
    <article><b>${euro(metrics.productProfit[0]?.profit || 0)}</b><span>Best profit per product</span></article>
    <article><b>${Object.keys(metrics.categoryProfit)[0] || "n/a"}</b><span>Top profit category</span></article>
    <article><b>${euro(metrics.inventoryValuation)}</b><span>Inventory valuation</span></article>
  </section>
  <section class="procurement-grid">
    <article class="admin-empty"><h2>Supplier management</h2><form class="supplier-form" onsubmit="saveSupplierForm(event)"><div class="two"><input name="name" required placeholder="Supplier name"><input name="contactName" placeholder="Contact person"></div><div class="two"><input name="email" type="email" placeholder="Email"><input name="phone" placeholder="Phone"></div><div class="two"><input name="leadTimeDays" type="number" value="21" placeholder="Lead time days"><input name="onTimeRate" type="number" value="90" placeholder="On-time %"></div><textarea name="notes" placeholder="Supplier notes"></textarea><button class="button">Add supplier</button></form></article>
    <article class="admin-empty"><h2>Purchase order generation</h2><p>Create supplier POs from customer orders, then print a purchase order PDF from the procurement module.</p><div class="admin-tools compact-tools"><select id="procOrderSelect">${orders.map(order => `<option value="${order.orderNumber}">${order.orderNumber} - ${order.customerName || order.email}</option>`).join("") || `<option>No orders available</option>`}</select><button class="button" onclick="createPurchaseOrderFromOrder(document.querySelector('#procOrderSelect').value)" ${orders.length ? "" : "disabled"}>Generate PO</button><button class="ghost" onclick="openProcurementPdf('procurement')">Purchase order PDF</button></div></article>
  </section>
  <section class="supplier-grid">${supplierCards}</section>
  <section class="report-grid procurement-reports">
    <article><h2>Supplier price lists</h2><div class="report-actions"><button class="ghost" onclick="exportProcurementCsv('cost')">Export CSV</button><button class="ghost" onclick="openProcurementPdf('cost')">Export PDF</button></div>${reportTable(["SKU","Product","Cost","Currency","Updated"], priceRows)}</article>
    <article><h2>Product cost tracking</h2>${reportTable(["Product","Category","Price","Cost","Profit","Margin %"], marginRows)}</article>
    <article><h2>Supplier performance</h2><div class="report-actions"><button class="ghost" onclick="exportProcurementCsv('supplier')">Supplier report CSV</button><button class="ghost" onclick="openProcurementPdf('supplier')">PDF</button></div>${reportTable(["Supplier","Contact","Email","Lead time","On-time","Rating"], procurementReportRows("supplier").slice(1))}</article>
    <article><h2>Product profitability by supplier</h2><div class="report-actions"><button class="ghost" onclick="exportProcurementCsv('margin')">Margin report CSV</button><button class="ghost" onclick="openProcurementPdf('margin')">PDF</button></div>${reportTable(["Product","Category","Price","Cost","Profit","Margin %"], marginRows)}</article>
    <article><h2>Profit per category</h2>${reportTable(["Category","Estimated profit"], categoryRows)}</article>
    <article><h2>Procurement report</h2><div class="report-actions"><button class="ghost" onclick="exportProcurementCsv('procurement')">Export CSV</button><button class="ghost" onclick="openProcurementPdf('procurement')">Export PDF</button></div>${reportTable(["PO","Supplier","Status","Order date","Expected","Spend"], procurementReportRows("procurement").slice(1, 8))}</article>
  </section>`);
}

function saveSupplierForm(event) {
  event.preventDefault();
  const form = event.target;
  const supplier = {
    id: slugify(form.name.value),
    name: form.name.value,
    contactName: form.contactName.value,
    email: form.email.value,
    phone: form.phone.value,
    leadTimeDays: Number(form.leadTimeDays.value || 0),
    rating: 4,
    onTimeRate: Number(form.onTimeRate.value || 0),
    notes: form.notes.value,
    priceList: []
  };
  suppliers = [supplier, ...activeSuppliers().filter(item => item.id !== supplier.id)];
  saveSuppliers();
  renderAdminProcurement();
  adminNotice(`Supplier ${supplier.name} saved locally.`);
}

function updateSupplier(id, patch) {
  suppliers = activeSuppliers().map(supplier => supplier.id === id ? { ...supplier, ...patch, updatedAt: new Date().toISOString() } : supplier);
  saveSuppliers();
  adminNotice("Supplier updated locally.");
}

function marketingFunnel(metrics) {
  const stages = [
    ["Product views", metrics.productViews],
    ["Wishlist intent", metrics.wishlistAdds],
    ["Added to cart", metrics.cartAdds],
    ["Leads captured", metrics.leads + metrics.subscribers],
    ["Orders", metrics.orders]
  ];
  const ceiling = Math.max(1, ...stages.map(([, value]) => value));
  return `<div class="funnel-chart">${stages.map(([label, value], index) => `<article><div><span>${String(index + 1).padStart(2, "0")}</span><strong>${label}</strong><b>${value}</b></div><i style="--funnel-width:${Math.max(6, value / ceiling * 100)}%"></i></article>`).join("")}</div>`;
}

function renderAdminMarketing() {
  const metrics = acquisitionMetrics();
  const pipeline = crmStatuses.map(status => ({ status, count: acquisitionLeads().filter(lead => lead.status === status).length }));
  adminShell("Marketing Dashboard", `<section class="admin-stats business-stats marketing-stats">
    <article><b>${metrics.subscribers}</b><span>Newsletter subscribers</span></article>
    <article><b>${metrics.contacts}</b><span>Contact inquiries</span></article>
    <article><b>${metrics.wholesale}</b><span>Wholesale leads</span></article>
    <article><b>${metrics.production}</b><span>Production requests</span></article>
    <article><b>${metrics.orders}</b><span>Orders</span></article>
    <article><b>${euro(metrics.revenue)}</b><span>Revenue</span></article>
  </section>
  <section class="acquisition-dashboard">
    <article class="admin-panel"><header><div><p class="eyebrow">Conversion funnel</p><h2>From product interest to order</h2></div><a class="ghost" href="/admin/analytics">Open analytics</a></header>${marketingFunnel(metrics)}<p class="panel-note">Local browser activity only. Connect consent-aware analytics before public launch.</p></article>
    <article class="admin-panel"><header><div><p class="eyebrow">Lead pipeline</p><h2>Commercial opportunities</h2></div><a class="ghost" href="/admin/leads">Manage leads</a></header><div class="pipeline-summary">${pipeline.map(item => `<div><strong>${item.count}</strong><span>${item.status}</span></div>`).join("")}</div><div class="quick-links"><a class="ghost" href="/admin/newsletter">Newsletter CRM</a><a class="ghost" href="/admin/inquiries">Contact requests</a><a class="ghost" href="/admin/segments">Customer segments</a></div></article>
  </section>
  <section class="admin-panel acquisition-actions"><header><div><p class="eyebrow">Revenue actions</p><h2>Next useful moves</h2></div></header><div class="action-card-grid">
    <article><span>01</span><h3>Welcome campaign</h3><p>${metrics.subscribers} subscribers can be segmented by brand for the ATELIER10 welcome message.</p><a href="/admin/newsletter">Build segment</a></article>
    <article><span>02</span><h3>Lead follow-up</h3><p>${acquisitionLeads().filter(lead => lead.status === "New").length} new leads are waiting for qualification or a first response.</p><a href="/admin/leads">Open pipeline</a></article>
    <article><span>03</span><h3>High-intent products</h3><p>Use view, wishlist and cart-add signals to prioritize campaigns and homepage placement.</p><a href="/admin/analytics">See product intent</a></article>
  </div></section>`);
}

function leadStatusOptions(current) {
  return crmStatuses.map(status => `<option${status === current ? " selected" : ""}>${status}</option>`).join("");
}

function saveManualLead(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  crmLeads.unshift({ id: `LEAD-${Date.now()}`, ...data, status: data.status || "New", createdAt: new Date().toISOString() });
  saveAcquisitionData();
  renderAdminLeads();
  adminNotice("Lead saved locally.");
}

function updateAcquisitionRecord(id, recordType, patch) {
  const stamp = { ...patch, updatedAt: new Date().toISOString() };
  if (recordType === "lead") crmLeads = crmLeads.map(item => item.id === id ? { ...item, ...stamp } : item);
  if (recordType === "contact") contactInquiries = contactInquiries.map(item => item.id === id ? { ...item, ...stamp } : item);
  if (recordType === "wholesale") wholesaleApplications = wholesaleApplications.map(item => item.id === id ? { ...item, ...stamp } : item);
  if (recordType === "production") productionRequests = productionRequests.map(item => item.id === id ? { ...item, ...(patch.notes !== undefined ? { adminNotes: patch.notes } : patch), updatedAt: stamp.updatedAt } : item);
  saveAcquisitionData();
  adminNotice("CRM record updated locally.");
}

function renderAdminLeads() {
  const sources = ["All", ...new Set(acquisitionLeads().map(lead => lead.source))];
  adminShell("Lead Management", `<section class="admin-panel lead-create"><header><div><p class="eyebrow">New opportunity</p><h2>Add lead</h2></div></header><form onsubmit="saveManualLead(event)"><input name="name" required placeholder="Name"><input name="email" type="email" required placeholder="Email"><input name="source" placeholder="Source" value="Manual"><input name="interest" required placeholder="Interest"><select name="status">${leadStatusOptions("New")}</select><input name="notes" placeholder="Notes"><button class="button">Add lead</button></form></section>
  <section class="admin-tools"><input id="leadSearch" placeholder="Search name, email or interest"><select id="leadSource">${sources.map(source => `<option>${source}</option>`).join("")}</select><select id="leadStatus"><option>All</option>${crmStatuses.map(status => `<option>${status}</option>`).join("")}</select></section>
  <div class="admin-table-wrap"><table class="admin-table crm-table"><thead><tr><th>Lead</th><th>Source</th><th>Interest</th><th>Status</th><th>Notes</th><th>Created</th></tr></thead><tbody id="leadRows"></tbody></table></div>`);
  const refresh = () => {
    const query = document.querySelector("#leadSearch").value.toLowerCase();
    const source = document.querySelector("#leadSource").value;
    const status = document.querySelector("#leadStatus").value;
    const rows = acquisitionLeads().filter(lead => `${lead.name} ${lead.email} ${lead.interest}`.toLowerCase().includes(query) && (source === "All" || lead.source === source) && (status === "All" || lead.status === status));
    document.querySelector("#leadRows").innerHTML = rows.length ? rows.map(lead => `<tr><td><strong>${escapeHtml(lead.name || "Unknown")}</strong><small>${escapeHtml(lead.email || "")}</small></td><td><span class="source-pill">${escapeHtml(lead.sourceLabel || lead.source)}</span></td><td>${escapeHtml(lead.interest || "")}</td><td><select onchange="updateAcquisitionRecord('${lead.id}', '${lead.recordType}', {status:this.value})">${leadStatusOptions(lead.status || "New")}</select></td><td><textarea onchange="updateAcquisitionRecord('${lead.id}', '${lead.recordType}', {notes:this.value})">${escapeHtml(lead.notes || "")}</textarea></td><td>${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("de-DE") : "-"}</td></tr>`).join("") : `<tr><td colspan="6">No leads match this view.</td></tr>`;
  };
  document.querySelectorAll("#leadSearch,#leadSource,#leadStatus").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function updateSubscriber(id, patch) {
  newsletterSubscribers = newsletterSubscribers.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item);
  saveAcquisitionData();
  adminNotice("Subscriber updated locally.");
}

function exportNewsletterCsv() {
  downloadCsv("loomingsthread-newsletter-subscribers.csv", [
    ["Email", "Brand segment", "Tags", "Status", "Subscribed"],
    ...newsletterSubscribers.map(item => [item.email, item.brand, (item.tags || []).join("; "), item.status, item.createdAt])
  ]);
}

function renderAdminNewsletter() {
  const segments = brandSegments.map(brand => ({ brand, count: newsletterSubscribers.filter(item => item.brand === brand && item.status !== "Unsubscribed").length }));
  adminShell("Newsletter CRM", `<section class="admin-stats business-stats segment-stats">${segments.map(item => `<article><b>${item.count}</b><span>${item.brand}</span></article>`).join("")}</section>
  <section class="admin-tools"><input id="subscriberSearch" placeholder="Search email or tag"><select id="subscriberBrand"><option>All segments</option>${brandSegments.map(brand => `<option>${brand}</option>`).join("")}</select><button class="button" onclick="exportNewsletterCsv()">Export CSV</button></section>
  <div class="admin-table-wrap"><table class="admin-table crm-table"><thead><tr><th>Subscriber</th><th>Brand segment</th><th>Tags</th><th>Status</th><th>Subscribed</th></tr></thead><tbody id="subscriberRows"></tbody></table></div>`);
  const refresh = () => {
    const query = document.querySelector("#subscriberSearch").value.toLowerCase();
    const brand = document.querySelector("#subscriberBrand").value;
    const items = newsletterSubscribers.filter(item => `${item.email} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query) && (brand === "All segments" || item.brand === brand));
    document.querySelector("#subscriberRows").innerHTML = items.length ? items.map(item => `<tr><td><strong>${escapeHtml(item.email)}</strong><small>${escapeHtml(item.id)}</small></td><td><select onchange="updateSubscriber('${item.id}', {brand:this.value})">${brandSegments.map(segment => `<option${segment === item.brand ? " selected" : ""}>${segment}</option>`).join("")}</select></td><td><input value="${escapeHtml((item.tags || []).join(", "))}" onchange="updateSubscriber('${item.id}', {tags:this.value.split(',').map(value=>value.trim()).filter(Boolean)})"></td><td><select onchange="updateSubscriber('${item.id}', {status:this.value})"><option${item.status !== "Unsubscribed" ? " selected" : ""}>Subscribed</option><option${item.status === "Unsubscribed" ? " selected" : ""}>Unsubscribed</option></select></td><td>${new Date(item.createdAt || Date.now()).toLocaleDateString("de-DE")}</td></tr>`).join("") : `<tr><td colspan="5">No newsletter subscribers yet.</td></tr>`;
  };
  document.querySelectorAll("#subscriberSearch,#subscriberBrand").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function renderAdminInquiries() {
  const types = ["All", "Contact request", "Product inquiry", "Wholesale inquiry"];
  adminShell("Contact Form Management", `<section class="admin-stats business-stats"><article><b>${contactInquiries.length}</b><span>Total contact requests</span></article>${types.slice(1).map(type => `<article><b>${contactInquiries.filter(item => item.type === type).length}</b><span>${type}</span></article>`).join("")}</section>
  <section class="admin-tools"><input id="inquirySearch" placeholder="Search name, email or subject"><select id="inquiryType">${types.map(type => `<option>${type}</option>`).join("")}</select><select id="inquiryStatus"><option>All</option>${crmStatuses.map(status => `<option>${status}</option>`).join("")}</select></section>
  <div class="admin-table-wrap"><table class="admin-table crm-table"><thead><tr><th>Contact</th><th>Type</th><th>Subject / Message</th><th>Status</th><th>Internal notes</th></tr></thead><tbody id="inquiryRows"></tbody></table></div>`);
  const refresh = () => {
    const query = document.querySelector("#inquirySearch").value.toLowerCase();
    const type = document.querySelector("#inquiryType").value;
    const status = document.querySelector("#inquiryStatus").value;
    const items = contactInquiries.filter(item => `${item.name} ${item.email} ${item.subject} ${item.message}`.toLowerCase().includes(query) && (type === "All" || item.type === type) && (status === "All" || item.status === status));
    document.querySelector("#inquiryRows").innerHTML = items.length ? items.map(item => `<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email)}${item.phone ? ` / ${escapeHtml(item.phone)}` : ""}</small></td><td><span class="source-pill">${escapeHtml(item.type)}</span></td><td><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.message)}</small></td><td><select onchange="updateAcquisitionRecord('${item.id}', 'contact', {status:this.value})">${leadStatusOptions(item.status || "New")}</select></td><td><textarea onchange="updateAcquisitionRecord('${item.id}', 'contact', {notes:this.value})">${escapeHtml(item.notes || "")}</textarea></td></tr>`).join("") : `<tr><td colspan="5">No contact requests yet.</td></tr>`;
  };
  document.querySelectorAll("#inquirySearch,#inquiryType,#inquiryStatus").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function activityTable(items, emptyText) {
  return `<table class="mini-report"><thead><tr><th>Product</th><th>Brand</th><th>Signals</th></tr></thead><tbody>${items.length ? items.slice(0, 8).map(item => `<tr><td>${escapeHtml(displayProductTitle(item.product))}</td><td>${escapeHtml(item.product.brand || "")}</td><td>${item.count}</td></tr>`).join("") : `<tr><td colspan="3">${emptyText}</td></tr>`}</tbody></table>`;
}

function renderAdminAnalytics() {
  const metrics = acquisitionMetrics();
  const wishlistRank = rankedProductActivity("wishlistAdds");
  const cartRank = rankedProductActivity("cartAdds");
  const viewRank = rankedProductActivity("productViews");
  adminShell("Analytics Dashboard", `<section class="admin-stats business-stats analytics-stats"><article><b>${metrics.orders}</b><span>Orders</span></article><article><b>${euro(metrics.revenue)}</b><span>Revenue</span></article><article><b>${metrics.productViews}</b><span>Products viewed</span></article><article><b>${metrics.wishlistAdds}</b><span>Wishlist adds</span></article><article><b>${metrics.cartAdds}</b><span>Cart adds</span></article></section>
  <section class="report-grid analytics-grid"><article><h2>Most viewed</h2>${activityTable(viewRank, "Product views will appear after storefront browsing.")}</article><article><h2>Most wishlisted</h2>${activityTable(wishlistRank, "Wishlist signals will appear after customer activity.")}</article><article><h2>Most added to cart</h2>${activityTable(cartRank, "Cart intent will appear after customer activity.")}</article><article><h2>Conversion funnel</h2>${marketingFunnel(metrics)}<p class="panel-note">This local dashboard is a first-party planning view, not a replacement for consent-aware production analytics.</p></article></section>`);
}

function renderAdminSegments() {
  const retail = customerSummaries();
  const wholesale = wholesaleApplications;
  const production = productionRequests;
  adminShell("Customer Segmentation", `<section class="segment-overview">
    <article><span>Retail customers</span><strong>${retail.length}</strong><p>Customers identified through local orders or the demo account.</p><a href="/admin/customers">Open customers</a></article>
    <article><span>Wholesale customers</span><strong>${wholesale.length}</strong><p>Distributor, MOQ, private-label and wholesale opportunities.</p><a href="/admin/leads">Open pipeline</a></article>
    <article><span>Production request customers</span><strong>${production.length}</strong><p>Custom manufacturing and logo customization prospects.</p><a href="/admin/leads">Open requests</a></article>
  </section>
  <section class="admin-panel"><header><div><p class="eyebrow">Segment readiness</p><h2>Audience groups for future campaigns</h2></div></header><div class="segment-table">
    <article><strong>Retail</strong><span>New buyers, repeat buyers, high-value customers</span><em>${retail.filter(customer => customer.orders > 1).length} repeat customers</em></article>
    <article><strong>Wholesale</strong><span>New, contacted, negotiating, approved, lost</span><em>${wholesale.filter(item => item.status === "Approved").length} approved accounts</em></article>
    <article><strong>Production</strong><span>Product type, quantity, target date, brand direction</span><em>${production.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} requested units</em></article>
    <article><strong>Newsletter</strong><span>Segmented by each LoomingsThread brand</span><em>${newsletterSubscribers.length} stored contacts</em></article>
  </div></section>`);
}

function imageProductionProducts() {
  const supportedBrands = ["Custom Denim Studio", "LoomingsThread Apparel", "The Leather Atelier", "Letta & Luna"];
  return products.filter(product => supportedBrands.includes(product.brand) && product.deleted !== true).map(product => {
    const isBoardSource = product.sourceType === "catalog-board";
    const galleryCompleteness = productGalleryCompleteness(product);
    const productionStatus = galleryCompleteness.items.some(item => item.status === "Rejected")
      ? "Rejected"
      : galleryCompleteness.readyForLaunch
        ? "Approved"
        : galleryCompleteness.items.every(item => item.exists)
          ? "Generated"
          : product.readyForGeneration === true
            ? "Needs Generation"
            : "Missing";
    return {
      ...product,
      imageStatus: product.imageStatus || (isBoardSource ? "board-source-disabled" : galleryCompleteness.readyForLaunch ? "complete" : "gallery-incomplete"),
      readyForGeneration: product.readyForGeneration === true,
      galleryCompleteness,
      missingViews: galleryCompleteness.missingViews,
      productionStatus
    };
  });
}

function exportImageProductionCsv() {
  const rows = imageProductionProducts();
  downloadCsv("loomingsthread-image-production-queue.csv", [
    ["Product", "SKU", "Brand", "Category", "Image Standard", "Required View", "File Exists", "Image File Path", "Status", "Asset Completeness", "Approval Completeness", "Ready For Launch"],
    ...rows.flatMap(product => product.galleryCompleteness.items.map(item => [
      displayProductTitle(product),
      product.articleNumber || product.sku || "",
      product.brand,
      product.collection || product.category,
      product.galleryCompleteness.standard.label,
      item.label,
      item.exists ? "Yes" : "No",
      item.path,
      item.status,
      `${product.galleryCompleteness.assetPercentage}%`,
      `${product.galleryCompleteness.percentage}%`,
      product.galleryCompleteness.readyForLaunch ? "Yes" : "No"
    ]))
  ]);
}

function renderAdminImageProduction() {
  const allProducts = imageProductionProducts();
  const ready = allProducts.filter(product => product.readyForGeneration);
  const completed = ready.filter(product => product.galleryCompleteness.readyForLaunch);
  const denimReady = ready.filter(product => product.brand === "Custom Denim Studio");
  const apparelReady = ready.filter(product => product.brand === "LoomingsThread Apparel");
  const approvedAll = allProducts.filter(product => product.galleryCompleteness.readyForLaunch);
  const rejectedAll = allProducts.filter(product => product.productionStatus === "Rejected");
  const completionPercentage = ready.length ? Math.round(completed.length / ready.length * 100) : 0;
  const categoryCounts = [...new Set(ready.map(product => `${product.brand}|${product.collection}`))].map(key => {
    const [brand, category] = key.split("|");
    return { brand, category, count: ready.filter(product => product.brand === brand && product.collection === category).length };
  });
  adminShell("Image Production", `<section class="image-production-hero">
    <div><p class="eyebrow">Professional product image standards</p><h2>Control every required view, local file and approval decision before launch.</h2><p>Requirements adapt to each product type. Image paths and workflow statuses are stored as admin production records without changing public product data.</p></div>
    <button class="button" onclick="exportImageProductionCsv()">Export image production queue CSV</button>
  </section>
  <section class="admin-stats image-production-stats">
    <article><b>${ready.length}</b><span>Total queued</span></article>
    <article><b>${completed.length}</b><span>Completed</span></article>
    <article><b>${Math.max(0, ready.length - completed.length)}</b><span>Remaining</span></article>
    <article><b>${completionPercentage}%</b><span>Complete</span></article>
    <article><b>${denimReady.length}</b><span>Custom Denim Studio</span></article>
    <article><b>${apparelReady.length}</b><span>LoomingsThread Apparel</span></article>
    <article><b>${approvedAll.length} / ${rejectedAll.length}</b><span>Approved / rejected</span></article>
  </section>
  <section class="production-category-grid">${categoryCounts.map(item => `<article><span>${item.brand}</span><strong>${item.count}</strong><p>${item.category}</p></article>`).join("")}</section>
  <section class="admin-tools image-production-filters"><input id="imageProductionSearch" placeholder="Search product, SKU or category"><select id="imageProductionBrand"><option>All brands</option><option value="Custom Denim Studio">Denim</option><option value="LoomingsThread Apparel">Apparel</option><option value="The Leather Atelier">Leather Atelier</option><option value="Letta & Luna">Letta & Luna</option></select><select id="imageProductionStatus"><option>All statuses</option>${imageProductionStatuses.map(status => `<option>${status}</option>`).join("")}<option value="launch-ready">Ready For Launch</option></select></section>
  <section class="production-status-legend">${imageProductionStatuses.map(status => `<span class="production-status status-${slugify(status)}">${status}</span>`).join("")}<small>Ready For Launch requires a valid local file and Approved status for every required view.</small></section>
  <div id="imageProductionRows" class="image-production-list"></div>`);
  const refresh = () => {
    const query = document.querySelector("#imageProductionSearch").value.toLowerCase();
    const brand = document.querySelector("#imageProductionBrand").value;
    const status = document.querySelector("#imageProductionStatus").value;
    imageProductionUiState = { ...imageProductionUiState, query, brand, status };
    const filtered = allProducts.filter(product => {
      const haystack = `${product.name} ${product.titleDe} ${product.articleNumber || ""} ${product.collection}`.toLowerCase();
      const statusMatch = status === "All statuses"
        || product.productionStatus === status
        || (status === "launch-ready" && product.galleryCompleteness.readyForLaunch);
      return haystack.includes(query) && (brand === "All brands" || product.brand === brand) && statusMatch;
    });
    document.querySelector("#imageProductionRows").innerHTML = filtered.map(product => {
      const gallery = product.galleryCompleteness;
      const encodedKey = encodeURIComponent(productProductionKey(product));
      return `<details class="production-product-card" data-production-key="${escapeHtml(productProductionKey(product))}"${imageProductionUiState.openProduct === productProductionKey(product) ? " open" : ""}>
        <summary>
          <span class="production-product-title"><strong>${escapeHtml(displayProductTitle(product))}</strong><small>${escapeHtml(product.articleNumber || product.sku || product.slug)} / ${escapeHtml(product.collection || product.category)}</small></span>
          <span><small>Brand</small><strong>${escapeHtml(productionBrandLabels[product.brand] || product.brand)}</strong></span>
          <span><small>Image standard</small><strong>${escapeHtml(gallery.standard.label)}</strong></span>
          <span class="production-completeness"><small>Assets / approved</small><strong>${gallery.assetPercentage}% / ${gallery.percentage}%</strong><i><b style="width:${gallery.percentage}%"></b></i></span>
          <span class="production-status status-${slugify(product.productionStatus)}">${escapeHtml(product.productionStatus)}</span>
          ${gallery.readyForLaunch ? `<span class="production-ready">Ready For Launch</span>` : `<span class="production-hold">Not Ready</span>`}
        </summary>
        <div class="production-checklist">
          <div class="production-checklist-head"><span>Required view</span><span>Exists</span><span>Image file path</span><span>Status</span></div>
          ${gallery.items.map(item => `<div class="production-checklist-row">
            <span class="production-view-name"><i class="${item.exists ? "exists" : "missing"}">${item.exists ? "✓" : "!"}</i><strong>${escapeHtml(item.label)}</strong></span>
            <span class="${item.exists ? "file-exists" : "file-missing"}">${item.exists ? "Exists" : "Missing"}</span>
            <input aria-label="${escapeHtml(item.label)} image path" value="${escapeHtml(item.path)}" placeholder="/products/brand/product/view.webp" onchange="updateImageProductionItem('${encodedKey}','${item.viewId}','path',this.value)">
            <select aria-label="${escapeHtml(item.label)} status" onchange="updateImageProductionItem('${encodedKey}','${item.viewId}','status',this.value)">${imageProductionStatuses.map(statusOption => `<option${item.status === statusOption ? " selected" : ""}>${statusOption}</option>`).join("")}</select>
          </div>`).join("")}
        </div>
      </details>`;
    }).join("") || `<section class="admin-empty"><h2>No products match these filters.</h2><p>Adjust the brand, status or search term.</p></section>`;
  };
  document.querySelector("#imageProductionSearch").value = imageProductionUiState.query;
  document.querySelector("#imageProductionBrand").value = imageProductionUiState.brand;
  document.querySelector("#imageProductionStatus").value = imageProductionUiState.status;
  document.querySelectorAll("#imageProductionSearch,#imageProductionBrand,#imageProductionStatus").forEach(input => input.addEventListener("input", refresh));
  refresh();
}

function renderAdminRoute() {
  if (!isAdminLoggedIn()) {
    renderAdminLogin();
    return;
  }
  const parts = location.pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
  if (!parts.length) renderAdminDashboard();
  else if (parts[0] === "dashboard") renderAdminDashboard();
  else if (parts[0] === "marketing") renderAdminMarketing();
  else if (parts[0] === "leads") renderAdminLeads();
  else if (parts[0] === "newsletter") renderAdminNewsletter();
  else if (parts[0] === "inquiries") renderAdminInquiries();
  else if (parts[0] === "analytics") renderAdminAnalytics();
  else if (parts[0] === "segments") renderAdminSegments();
  else if (parts[0] === "launch-center") renderAdminLaunchCenter();
  else if (parts[0] === "products" && !parts[1]) renderAdminProducts();
  else if (parts[0] === "image-production") renderAdminImageProduction();
  else if (parts[0] === "products" && parts[1] === "new") renderAdminProductForm();
  else if (parts[0] === "products" && parts[1] === "edit") renderAdminProductForm(parts[2]);
  else if (parts[0] === "ai-product-generator") renderAdminAiGenerator();
  else if (parts[0] === "pricing") renderAdminPricing();
  else if (parts[0] === "orders" && !parts[1]) renderAdminOrders();
  else if (parts[0] === "orders" && parts[2] === "invoice") renderInvoice(parts[1]);
  else if (parts[0] === "orders" && parts[1]) renderAdminOrderDetail(parts[1]);
  else if (parts[0] === "purchase-orders") renderAdminPurchaseOrders();
  else if (parts[0] === "procurement") renderAdminProcurement();
  else if (parts[0] === "profits") renderAdminProfits();
  else if (parts[0] === "customers") renderAdminCustomers();
  else if (parts[0] === "inventory") renderAdminInventory();
  else if (parts[0] === "reports") renderAdminReports();
  else if (parts[0] === "settings" && parts[1] === "payments") renderAdminPaymentSettings();
  else if (parts[0] === "settings" && parts[1] === "shipping") renderAdminShippingSettings();
  else if (parts[0] === "settings") renderAdminSettings();
  else renderAdminDashboard();
}

function renderConfirmation(orderNumber) {
  const order = orderByNumber(orderNumber) || orderByNumber(localStorage.getItem("atelierLastOrderNumber")) || orders[0];
  if (!order) {
    page("Danke fuer deine Bestellung.", `<section class="confirmation"><h2>Order confirmation</h2><p>Keine aktuelle Bestellung gefunden.</p><a class="button" href="#/shop">${t("continue")}</a></section>`);
    return;
  }
  page("Danke fuer deine Bestellung.", `<section class="confirmation order-confirmation"><p class="eyebrow">Order confirmation</p><h2>${order.orderNumber}</h2><p>Eine BestellbestÃ¤tigung wurde vorbereitet. E-Mail Versand wird spÃ¤ter mit echtem Backend aktiviert.</p><div class="confirmation-grid"><article><h3>Summary</h3><ul class="order-lines">${order.products.map(item => `<li>${item.quantity} x ${item.title}<span>${euro(item.lineTotal)}</span></li>`).join("")}</ul><dl class="totals"><div><dt>Subtotal</dt><dd>${euro(order.subtotal)}</dd></div><div><dt>VAT</dt><dd>${euro(order.VAT)}</dd></div><div><dt>Shipping</dt><dd>${euro(order.shipping)}</dd></div></dl><strong>${euro(order.total)}</strong></article><article><h3>Payment</h3><p>${order.paymentMethod}</p><p><strong>Status:</strong> ${order.paymentStatus || "Awaiting Payment"}</p><h3>Delivery estimate</h3><p>${order.deliveryEstimate}</p><h3>Shipping method</h3><p>${order.shippingMethod || "DHL Standard"}<br>${order.shippingCountry || "Deutschland"}</p><h3>Tracking</h3><p>${order.trackingNumber || "Tracking wird nach Versand ergaenzt."}</p><h3>Order status</h3><p>${order.orderStatus}</p></article></div>${paymentNoticeBlock(order)}<a class="button" href="#/shop">${t("continue")}</a></section>`);
}

function openQuickView(slug) {
  const product = getProduct(slug);
  if (!isPublicProduct(product)) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="quick-view" onclick="if(event.target.className==='quick-view') closeQuickView()"><div><button class="quick-close" onclick="closeQuickView()">Close</button><img src="${mainImage(product)}" alt="${product.name}"><section><p class="eyebrow">${titleCase(product.category)}</p><h2>${titleCase(product.name)}</h2><p>${shortDescription(product)}</p><p><strong>Material:</strong> ${product.materialDe || product.material}</p>${isLeatherProduct(product) ? `<p><strong>Lederart:</strong> ${leatherType(product) || "Wird geprueft"}</p>` : ""}<a class="button wide" href="#/product/${product.slug}" onclick="closeQuickView()">${t("details")}</a></section></div></div>`);
}

function closeQuickView() {
  document.querySelector(".quick-view")?.remove();
}

function route() {
  updateStaticText();
  if (location.pathname.startsWith("/admin")) {
    renderAdminRoute();
    window.scrollTo(0, 0);
    return;
  }
  document.body.classList.remove("admin-mode");
  const cleanParts = location.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
  if (!location.hash && cleanParts[0] === "brand") {
    renderBrandLanding(cleanParts[1]);
    window.scrollTo(0, 0);
    return;
  }
  if (!location.hash && cleanParts[0] === "collections") {
    renderCollection(cleanParts[1]);
    window.scrollTo(0, 0);
    return;
  }
  if (!location.hash && cleanParts[0] === "wholesale") {
    renderWholesale();
    window.scrollTo(0, 0);
    return;
  }
  if (!location.hash && cleanParts[0] === "production") {
    renderProductionRequest();
    window.scrollTo(0, 0);
    return;
  }
  const [pageName, arg] = location.hash.replace(/^#\/?/, "").split("/");
  if (!pageName) renderHome();
  else if (pageName === "shop") renderShop();
  else if (pageName === "brand") renderBrandLanding(arg);
  else if (pageName === "collections") renderCollection(arg);
  else if (pageName === "wholesale") renderWholesale();
  else if (pageName === "production") renderProductionRequest();
  else if (pageName === "product") renderProduct(arg);
  else if (pageName === "cart") renderCart();
  else if (pageName === "checkout") renderCheckout();
  else if (pageName === "wishlist") renderWishlist();
  else if (pageName === "login") renderLogin();
  else if (pageName === "register") renderRegister();
  else if (pageName === "account") renderAccount(arg);
  else if (pageName === "about") renderAbout();
  else if (pageName === "brand-story") renderBrandStory();
  else if (pageName === "brand-guidelines") renderBrandGuidelines();
  else if (pageName === "social") renderSocialKit(arg);
  else if (pageName === "marketing-assets") renderMarketingAssets();
  else if (pageName === "contact") renderContact();
  else if (pageName === "faq") renderFaq();
  else if (pageName === "blog" && arg) renderJournalPost(arg);
  else if (pageName === "blog") renderBlog();
  else if (pageName === "confirmation") renderConfirmation(arg);
  else if (pageName === "legal") renderLegal(arg);
  else renderHome();
  window.scrollTo(0, 0);
}

document.querySelector("#langToggle").addEventListener("click", () => {
  lang = lang === "de" ? "en" : "de";
  localStorage.setItem("atelierLang", lang);
  route();
});

window.addEventListener("hashchange", route);

Promise.all([
  fetch(`/data/products.json?v=${Date.now()}`).then(response => response.json()),
  fetch(`/data/local-image-manifest.json?v=${Date.now()}`).then(response => response.json())
])
  .then(([data, imageManifest]) => {
    localImageManifest = imageManifest;
    validLocalImagePaths = new Set((imageManifest.validImages || []).map(normalizeImagePath));
    placeholderImagePaths = new Set((imageManifest.placeholderImages || []).map(normalizeImagePath));
    rawProducts = data;
    const baseHasCleanLetta = data.some(product => product.brand === "Letta & Luna" && String(product.descriptionDe || "").includes("weiche Kidswear"));
    const baseHasCuratedFashion = data.some(product => product.brand === "Custom Denim Studio") && data.some(product => product.brand === "LoomingsThread Apparel");
    if (baseHasCleanLetta) {
      let removedStaleLettaEdits = false;
      data.filter(product => product.brand === "Letta & Luna").forEach(product => {
        const edit = adminEdits[product.slug];
        if (edit && !String(edit.descriptionDe || "").includes("weiche Kidswear")) {
          delete adminEdits[product.slug];
          removedStaleLettaEdits = true;
        }
      });
      if (removedStaleLettaEdits) {
        localStorage.setItem("atelierAdminProductEdits", JSON.stringify(adminEdits));
      }
    }
    const importedProductsJson = localStorage.getItem("atelierImportedProductsJson");
    if (importedProductsJson) {
      try {
        const imported = JSON.parse(importedProductsJson);
        const importedHasCleanLetta = imported.some(product => product.brand === "Letta & Luna" && String(product.descriptionDe || "").includes("weiche Kidswear"));
        const importedHasCuratedFashion = imported.filter(product => product.brand === "Custom Denim Studio").length >= 40
          && imported.filter(product => product.brand === "LoomingsThread Apparel").length >= 80;
        const importedIsCurrent = (!baseHasCleanLetta || importedHasCleanLetta) && (!baseHasCuratedFashion || importedHasCuratedFashion);
        if (importedIsCurrent) {
          rawProducts = imported;
        } else {
          localStorage.removeItem("atelierImportedProductsJson");
        }
      } catch {
        localStorage.removeItem("atelierImportedProductsJson");
      }
    }
    applyAdminEdits();
    route();
  })
  .catch(() => {
    page("Catalog error", `<section class="empty"><p>Produktdaten oder lokaler Bildindex konnten nicht geladen werden.</p></section>`);
  });

