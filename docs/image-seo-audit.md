# Image SEO Audit

Live catalog scope: 108 products and 460 product images.

## Changes

- Replaced every exact product-name alt value with a differentiated label.
- Used filename evidence for back, side, front, sleeve, lining, collar, pocket, patch, and numbered detail views.
- Used `primary product view` for a main image and `additional product view` when the filename does not identify the angle. No unsupported visual detail was invented.
- Updated the catalog importer and new-product admin flow to generate the same labels for future images.
- Product and category LCP images use Next.js priority loading with responsive `sizes`.
- Product gallery thumbnails, cards, and other below-fold images retain Next.js lazy loading defaults.
- Removed remaining `unoptimized` exceptions from public Cloudinary images.
- Next.js is configured to negotiate AVIF and WebP and supplies responsive image widths through the Image component.

## Manual Review

Neutral `detail view` and `additional product view` labels should be replaced manually when a person can confidently identify a specific feature such as embroidery, a patch, rib trim, lining, pocket, or closure. The migration deliberately avoids guessing from image pixels or an ambiguous filename.
