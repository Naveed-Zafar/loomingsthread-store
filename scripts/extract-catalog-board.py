from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\R2G\OneDrive\Desktop\Pictures for canva to seperate.png")
PRODUCTS_FILE = PROJECT_ROOT / "data" / "products.json"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "products" / "catalog-board"
MANIFEST_FILE = PROJECT_ROOT / "data" / "catalog-board-import-report.json"


@dataclass(frozen=True)
class BoardRow:
    brand: str
    brand_slug: str
    sku_prefix: str
    y1: int
    y2: int
    x1: int
    x2: int
    items: list[tuple[str, str, str]]


ROWS = [
    BoardRow(
        "Custom Denim Studio",
        "custom-denim-studio",
        "CDS-BRD",
        29,
        194,
        257,
        1534,
        [
            ("Slim Fit Indigo", "Jeans", "Men"),
            ("Straight Fit Vintage", "Jeans", "Men"),
            ("Relaxed Fit Light Blue", "Jeans", "Unisex"),
            ("Black Denim", "Jeans", "Unisex"),
            ("Raw Selvedge", "Jeans", "Men"),
            ("Classic Trucker Jacket", "Denim Jackets", "Unisex"),
            ("Vintage Blue Jacket", "Denim Jackets", "Unisex"),
            ("Black Denim Jacket", "Denim Jackets", "Unisex"),
            ("Oversized Denim Jacket", "Denim Jackets", "Women"),
            ("Sherpa Lined Jacket", "Denim Jackets", "Unisex"),
            ("Indigo Denim Shirt", "Denim Shirts", "Men"),
            ("Light Wash Shirt", "Denim Shirts", "Unisex"),
            ("Western Denim Shirt", "Denim Shirts", "Men"),
            ("Denim Overshirt", "Denim Shirts", "Unisex"),
            ("Black Denim Shirt", "Denim Shirts", "Unisex"),
        ],
    ),
    BoardRow(
        "LoomingsThread Apparel",
        "loomingsthread-apparel",
        "LTA-BRD",
        254,
        420,
        257,
        1534,
        [
            ("Classic Black Hoodie", "Hoodies", "Unisex"),
            ("Grey Melange Hoodie", "Hoodies", "Unisex"),
            ("Navy Blue Hoodie", "Hoodies", "Unisex"),
            ("Beige Hoodie", "Hoodies", "Unisex"),
            ("Olive Green Hoodie", "Hoodies", "Unisex"),
            ("Black Sweatshirt", "Sweatshirts", "Unisex"),
            ("Grey Melange Sweatshirt", "Sweatshirts", "Unisex"),
            ("Navy Sweatshirt", "Sweatshirts", "Unisex"),
            ("Cream Sweatshirt", "Sweatshirts", "Unisex"),
            ("Green Sweatshirt", "Sweatshirts", "Unisex"),
            ("Classic White Tee", "T-Shirts", "Unisex"),
            ("Black Tee", "T-Shirts", "Unisex"),
            ("Navy Tee", "T-Shirts", "Unisex"),
            ("Beige Tee", "T-Shirts", "Unisex"),
            ("Olive Tee", "T-Shirts", "Unisex"),
        ],
    ),
    BoardRow(
        "LoomingsThread Apparel",
        "loomingsthread-apparel",
        "LTA-WBRD",
        470,
        626,
        257,
        1534,
        [
            ("Ribbed Tank Top", "Women's Collection", "Women"),
            ("Black Ribbed Tank Top", "Women's Collection", "Women"),
            ("Fitted Long Sleeve Top", "Women's Collection", "Women"),
            ("Black Fitted Long Sleeve Top", "Women's Collection", "Women"),
            ("Oversized T-Shirt", "Women's Collection", "Women"),
            ("Fine Knit Sweater", "Women's Collection", "Women"),
            ("V-Neck Sweater", "Women's Collection", "Women"),
            ("Oversized Sweater", "Women's Collection", "Women"),
            ("Turtleneck Sweater", "Women's Collection", "Women"),
            ("Neutral Cardigan", "Women's Collection", "Women"),
            ("T-Shirt Dress", "Women's Collection", "Women"),
            ("Slip Dress", "Women's Collection", "Women"),
            ("Wide Leg Pants", "Women's Collection", "Women"),
            ("Relaxed Joggers", "Women's Collection", "Women"),
            ("Essential Leggings", "Women's Collection", "Women"),
        ],
    ),
    BoardRow(
        "Letta & Luna",
        "letta-luna",
        "LL-BRD",
        686,
        811,
        257,
        1534,
        [
            ("Baby Romper", "Baby", "Baby"),
            ("Baby Bodysuit", "Baby", "Baby"),
            ("Baby Set", "Baby", "Baby"),
            ("Baby Dress", "Baby", "Baby"),
            ("Toddler Set", "Toddler", "Toddler"),
            ("Toddler Dress", "Toddler", "Toddler"),
            ("Toddler Shirt", "Toddler", "Toddler"),
            ("Toddler Shorts", "Toddler", "Toddler"),
            ("Boys T-Shirt", "Boys", "Boys"),
            ("Boys Shirt", "Boys", "Boys"),
            ("Boys Shorts", "Boys", "Boys"),
            ("Boys Set", "Boys", "Boys"),
            ("Boys Pants", "Boys", "Boys"),
            ("Girls Dress", "Girls", "Girls"),
            ("Girls Top", "Girls", "Girls"),
            ("Girls Skirt", "Girls", "Girls"),
            ("Girls Set", "Girls", "Girls"),
            ("Girls Leggings", "Girls", "Girls"),
        ],
    ),
    BoardRow(
        "The Leather Atelier",
        "the-leather-atelier",
        "TLA-BRD",
        861,
        994,
        257,
        1534,
        [
            ("Leather Wallet", "wallets", "Unisex"),
            ("Leather Card Holder", "cardholders", "Unisex"),
            ("Leather Belt", "belts", "Unisex"),
            ("Leather Duffle Bag", "duffle-bags", "Unisex"),
            ("Leather Backpack", "other", "Unisex"),
            ("Leather Tote Bag", "ladies-bags", "Women"),
            ("Leather Messenger Bag", "laptop-bags", "Unisex"),
            ("Leather Briefcase", "laptop-bags", "Unisex"),
            ("Leather Passport Holder", "wallets", "Unisex"),
            ("Leather Key Holder", "other", "Unisex"),
        ],
    ),
]


def slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def fit_square(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGB", (2000, 2000), background)
    source = image.convert("RGB")
    scale = min(1540 / source.width, 1540 / source.height)
    target_size = (
        max(1, round(source.width * scale)),
        max(1, round(source.height * scale)),
    )
    source = source.resize(target_size, Image.Resampling.LANCZOS)
    x = (2000 - source.width) // 2
    y = (2000 - source.height) // 2
    canvas.paste(source, (x, y))
    return canvas


def detail_square(image: Image.Image, background: tuple[int, int, int]) -> Image.Image:
    source = image.convert("RGB")
    width, height = source.size
    crop_width = max(1, int(width * 0.62))
    crop_height = max(1, int(height * 0.62))
    left = (width - crop_width) // 2
    top = (height - crop_height) // 2
    detail = source.crop((left, top, left + crop_width, top + crop_height))
    return fit_square(detail, background)


def descriptions(brand: str, name: str) -> tuple[str, str]:
    if brand == "The Leather Atelier":
        return (
            f"{name} mit ruhiger, hochwertiger Lederoptik. Produktdetails, Material und Masse werden vor dem Livegang final geprueft.",
            f"{name} with a refined premium leather appearance. Product details, material and dimensions will be verified before launch.",
        )
    if brand == "Letta & Luna":
        return (
            f"{name} fuer bequeme Familienmomente und unkomplizierte Alltagslooks. Die genaue Materialzusammensetzung wird vor dem Livegang geprueft.",
            f"{name} designed for comfortable family moments and easy everyday wear. Exact fabric composition will be verified before launch.",
        )
    if brand == "Custom Denim Studio":
        return (
            f"{name} mit klarer Denim-Silhouette und moderner Heritage-Aesthetik. Passform und Materialdetails werden vor dem Livegang geprueft.",
            f"{name} with a clean denim silhouette and modern heritage character. Fit and material details will be verified before launch.",
        )
    return (
        f"{name} als cleanes Premium-Basic fuer eine moderne Garderobe. Die genaue Materialzusammensetzung wird vor dem Livegang geprueft.",
        f"{name} as a clean premium basic for a modern wardrobe. Exact fabric composition will be verified before launch.",
    )


def price_for(category: str) -> float:
    prices = {
        "Jeans": 119.0,
        "Denim Jackets": 149.0,
        "Denim Shirts": 109.0,
        "Hoodies": 89.0,
        "Sweatshirts": 79.0,
        "T-Shirts": 45.0,
        "Women's Collection": 99.0,
        "Baby": 39.0,
        "Toddler": 49.0,
        "Boys": 45.0,
        "Girls": 49.0,
        "wallets": 79.0,
        "cardholders": 49.0,
        "belts": 69.0,
        "duffle-bags": 249.0,
        "ladies-bags": 189.0,
        "laptop-bags": 219.0,
        "other": 59.0,
    }
    return prices.get(category, 89.0)


def product_record(
    row: BoardRow,
    name: str,
    category: str,
    gender: str,
    article_number: str,
    front_path: str,
    detail_path: str,
) -> dict:
    description_de, description_en = descriptions(row.brand, name)
    is_kids = row.brand == "Letta & Luna"
    sizes = (
        ["56", "62", "68", "74", "80"]
        if category == "Baby"
        else ["86", "92", "98", "104"]
        if category == "Toddler"
        else ["98", "104", "110", "116", "122", "128"]
        if is_kids
        else ["XS", "S", "M", "L", "XL"]
        if row.brand != "The Leather Atelier"
        else ["Standard"]
    )
    missing_views = ["back", "left-side", "right-side", "lifestyle"]
    if row.brand == "The Leather Atelier":
        missing_views.extend(["stitching-closeup", "hardware-closeup"])
    elif row.brand == "Custom Denim Studio":
        missing_views.extend(["pocket-closeup", "label-closeup"])
    else:
        missing_views.extend(["fabric-closeup", "model-lifestyle"])

    return {
        "articleNumber": article_number,
        "sku": article_number,
        "productName": name,
        "name": name,
        "titleDe": name,
        "titleEn": name,
        "slug": f"board-{row.brand_slug}-{slugify(name)}",
        "brand": row.brand,
        "category": category,
        "categoryLabel": category,
        "folder": "kidswear" if is_kids else "denim" if row.brand == "Custom Denim Studio" else "apparel" if row.brand == "LoomingsThread Apparel" else category,
        "collection": category,
        "collections": ["Catalog Board", category, "New Arrivals"],
        "gender": gender,
        "ageGroup": gender if is_kids else "Adult",
        "season": "All Season",
        "colorOptions": ["As shown"],
        "sizeOptions": sizes,
        "materialDe": "Materialzusammensetzung wird geprueft",
        "materialEn": "Material composition under review",
        "material": "Material composition under review",
        "descriptionDe": description_de,
        "descriptionEn": description_en,
        "description": description_de,
        "shortDescription": description_de,
        "careInstructionsDe": "Pflegehinweise werden nach Materialpruefung finalisiert.",
        "careInstructionsEn": "Care instructions will be finalized after material verification.",
        "priceEur": price_for(category),
        "retailPriceEUR": price_for(category),
        "images": [front_path, detail_path],
        "mainImage": front_path,
        "frontImage": front_path,
        "detailImages": [detail_path],
        "galleryImages": [detail_path],
        "thumbnailImages": [front_path, detail_path],
        "imageSlots": {
            "front": front_path,
            "detail": detail_path,
            "back": None,
            "leftSide": None,
            "rightSide": None,
            "lifestyle": None,
        },
        "imageCount": 2,
        "needsGalleryReview": True,
        "needsManualReview": True,
        "missingGalleryViews": missing_views,
        "sourceType": "catalog-board",
        "sourceBoardFile": SOURCE.name,
        "active": True,
        "inStock": True,
        "stockQty": 10,
        "featured": False,
        "bestseller": False,
        "newArrival": True,
        "styleTags": [row.brand, category, gender, "catalog-board"],
        "tags": [row.brand, category, gender, "catalog-board"],
        "seoTitle": f"{name} | {row.brand}",
        "seoDescription": description_de[:155],
        "openGraphTitle": f"{name} | {row.brand}",
        "openGraphDescription": description_en[:155],
        "openGraphImage": front_path,
    }


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source board not found: {SOURCE}")

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    source_image = Image.open(SOURCE).convert("RGB")
    records: list[dict] = []
    extracted: list[dict] = []

    for row in ROWS:
        cell_width = (row.x2 - row.x1) / len(row.items)
        for index, (name, category, gender) in enumerate(row.items, start=1):
            raw_left = row.x1 + (index - 1) * cell_width
            raw_right = row.x1 + index * cell_width
            x_pad = max(3, round(cell_width * 0.08))
            left = round(raw_left) + x_pad
            right = round(raw_right) - x_pad
            crop = source_image.crop((left, row.y1, right, row.y2))
            slug = slugify(name)
            product_dir = OUTPUT_ROOT / row.brand_slug / slug
            product_dir.mkdir(parents=True, exist_ok=True)
            front_file = product_dir / "front.webp"
            detail_file = product_dir / "detail.webp"
            background = (247, 242, 236)
            fit_square(crop, background).save(front_file, "WEBP", quality=94, method=6)
            detail_square(crop, background).save(detail_file, "WEBP", quality=94, method=6)
            article_number = f"{row.sku_prefix}-{index:04d}"
            front_path = "/" + front_file.relative_to(PROJECT_ROOT / "public").as_posix()
            detail_path = "/" + detail_file.relative_to(PROJECT_ROOT / "public").as_posix()
            records.append(
                product_record(
                    row,
                    name,
                    category,
                    gender,
                    article_number,
                    front_path,
                    detail_path,
                )
            )
            extracted.append(
                {
                    "articleNumber": article_number,
                    "name": name,
                    "brand": row.brand,
                    "front": front_path,
                    "detail": detail_path,
                    "crop": [left, row.y1, right, row.y2],
                }
            )

    products = json.loads(PRODUCTS_FILE.read_text(encoding="utf-8"))
    products = [product for product in products if product.get("sourceType") != "catalog-board"]
    products.extend(records)
    PRODUCTS_FILE.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")

    report = {
        "source": str(SOURCE),
        "sourceSize": {"width": source_image.width, "height": source_image.height},
        "productsCreated": len(records),
        "frontImagesCreated": len(records),
        "detailImagesCreated": len(records),
        "totalImagesCreated": len(records) * 2,
        "productsNeedingGalleryReview": len(records),
        "missingAuthenticViews": [
            "back",
            "left-side",
            "right-side",
            "product-specific lifestyle",
            "category-specific closeups",
        ],
        "note": "The source board contains front-facing product tiles only. Missing views were not fabricated or duplicated.",
        "products": extracted,
    }
    MANIFEST_FILE.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    source_copy = PROJECT_ROOT / "docs" / "catalog-board-source.png"
    source_copy.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SOURCE, source_copy)
    print(json.dumps({key: report[key] for key in report if key != "products"}, indent=2))


if __name__ == "__main__":
    main()
