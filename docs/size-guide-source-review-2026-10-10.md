# Size guide source review — 10 October 2026

The popup and `/size-guide` share `InternationalSizeChart` and the data in `src/lib/international-sizing.ts`. Both provide Male (Men), Female (Women), US, UK, European labels, and inches/centimeters. Jackets and vests use the body reference; no finished vest dimensions are inferred.

## Sources checked through web search and official pages

- [Belstaff official size guide](https://belstaff.com/en-us/pages/customer-service-size-guide): Men's Outerwear & Tops table. Transcribed XS–3XL UK/US and EU/IT labels, chest and waist ranges in centimeters. XXL is displayed as 2XL. Overlapping ranges are retained exactly; they have not been rounded into invented size boundaries.
- [Barbour official size guide](https://www.barbour.com/us/customer_service/size-and-fit-guides.html): Women's measurements and Size Conversion Chart. Transcribed XS–XXL (UK 8–18), US 4–14, EU 36–46, and associated bust, waist and hip ranges in centimeters. The source distinguishes EU from DE; DE values are not presented as EU values.

These brands disagree on sizing conventions. The UI identifies the source and labels the values as regional body references, not verified Jacketee specifications. The existing Jacketee planning body/finished-jacket charts and estimator remain unchanged. Their dimensions cannot be confirmed against Jacketee manufacturing from a third-party website. No sleeve, shoulder or finished vest measurements were invented, and no unsupported sizes were extrapolated.

Unit conversion uses 1 inch = 2.54 centimeters and rounds display values to two decimal places. The original centimeter values remain the source data.

## Validation

- `node scripts/test-size-guide.mjs`: every new source row, gender switching, regional columns, unit conversion, shared components, jacket/vest charts and measurement instructions.
- `node scripts/test-product-sizes.mjs`: existing size selection, availability, price adjustments and cart/checkout behavior.
- ESLint on changed components, data and page.

No database updates or deployment are part of this change.
