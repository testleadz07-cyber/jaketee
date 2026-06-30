# Professional E-Commerce Missing Features Checklist

This document tracks the features currently missing, simulated, or requiring improvements to elevate this platform to a professional, production-grade e-commerce store (similar to Shopify or custom Enterprise platforms).

## 💳 1. Checkout & Payments
- [ ] **Credit Card Integration (Stripe)**: Currently, the store only supports PayPal. Direct credit card processing via Stripe Elements, Apple Pay, and Google Pay is essential for maximizing checkout conversions.
- [ ] **Dynamic Tax Calculation**: No sales tax calculation engine exists. Integration with a service like Avalara or Stripe Tax is needed to calculate taxes at checkout based on region.
- [ ] **Advanced Shipping API**: Currently uses flat shipping rules. Needs integration with carrier APIs (USPS, FedEx, UPS, DHL) to compute real-time shipping fees based on product weights and destination zip codes.

## 🏷️ 2. Marketing & Promotions
- [ ] **Discount & Coupon Code Engine**:
  - [ ] Database schema for promo codes (percentage off, fixed amount, free shipping, minimum order value).
  - [ ] Coupon validation input field on checkout and cart components.
- [ ] **Newsletter Subscription**: Footer/Pop-up email collection linked to marketing service providers (Klaviyo, Mailchimp, or SendGrid).
- [ ] **Product Recommendations**:
  - [ ] "Frequently Bought Together" bundle offers on product details pages.
  - [ ] "You May Also Like" carousel powered by category matches or custom tags.

## 📦 3. Admin & Inventory Management
- [ ] **Bulk Product Editor**: A spreadsheet-style grid view in the admin panel to quickly update stock levels, edit pricing, or toggle visibility for dozens of products simultaneously.
- [ ] **Low-Stock Alert System**: Automated dashboard notifications or email warnings when products drop below a set threshold.
- [ ] **Multi-Category Assignment / Tags**: Products are currently limited to a single category. Adding support for custom tags (e.g. `New Arrival`, `Summer Sale`) and dynamic smart collections.
- [ ] **Refund & Return Processing**: Missing buttons in the admin orders dashboard to process partial or full refunds and update inventory levels accordingly.

## 🚀 4. Customer Experience (UX)
- [x] **Order Tracking Dashboard**: Customer-facing status progression (e.g., *Order Placed*, *Shipped*, *In Transit*, *Delivered*) with integrated carrier tracking numbers.
- [x] **Advanced Reviews & Ratings**:
  - [x] Review moderation panel in admin dashboard.
  - [x] Customer photo/video uploads in product review submissions.
  - [x] Filter reviews by star rating.
- [x] **Product Search Auto-Complete**: Live search suggestions in the header dropdown as the user types (with thumbnail and price matches).

## 📈 5. SEO, Analytics & Tracking
- [ ] **JSON-LD Schema Markup**: Structured data integration on `product/[slug]` templates to enable search engines to display rich snippets (price, stock status, ratings) directly in search results.
- [ ] **Conversion Pixels**: Trigger events (e.g., `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) for Google Analytics (GA4), Facebook Pixel, and TikTok Pixel.
