# The Leather Atelier by Looming Threads

Local German/English ecommerce demo for **The Leather Atelier**, parent company **Looming Threads**, primary market Germany.

## Run

```bash
npm start
```

Open:

```text
http://localhost:4173
```

The website runs from local files and local product images. Payment providers are placeholders only.

## Structure

- `public/products/*`: locally downloaded supplier images, grouped by category
- `data/products.json`: imported listing/category catalog
- `data/categories.json`: generated category summary
- `data/import-report.json`: import statistics
- `pages/product/<slug>/index.html`: SEO-friendly generated product pages
- `scripts/crawl-hjleather.js`: listing/category importer and image downloader
- Product images are stored per product in `public/products/<category>/<product-slug>/`
- Product detail pages include a local image gallery with thumbnails, zoom, and mobile swipe support

## Import

```bash
npm run import
```

The importer continues even when product detail pages are blocked. Products with blocked details are saved with:

```json
{
  "needsManualReview": true,
  "detailPageBlocked": true
}
```

Safe placeholder text is used when detail-page description/material data is unavailable:

```text
Handmade leather product. Final material, size and price to be confirmed with supplier.
```

Gallery fields in `data/products.json`:

```json
{
  "images": ["/products/category/product-slug/image-1.jpg"],
  "mainImage": "/products/category/product-slug/image-1.jpg",
  "galleryImages": [],
  "imageCount": 1,
  "needsGalleryReview": true
}
```

When HJ Leather product detail pages are blocked, the importer continues using listing/category page images and marks products for gallery review when only one image is found.
