# Compare-at Price Audit

Latest pricing update: 2026-09-29.

- Live products updated: 108
- Discount applied: 15%
- Products with verified compare-at prices: 108
- Products discounted by more than 20%: 0
- Rounding rule: nearest cent

## Applied Rule

For every live product, the former selling price became the compare-at price. The new selling price is 85% of that value:

`new price = round(previous selling price * 0.85, 2)`

Every compare-at price was marked verified based on the owner's confirmation that this store-wide promotion is genuine and documented.

## Confirmed Examples

| Product | New price | Verified compare-at | Discount |
| --- | ---: | ---: | ---: |
| Black Wool and White Leather Sleeves Varsity Hoodie Jacket | $169.15 | $199.00 | 15% |
| Luxurious All-Black Nappa Leather Letterman Jacket | $140.25 | $165.00 | 15% |

## Source Behavior

The product importer treats each record's source `price` as the base price, calculates the 15% sale price, and marks the resulting compare-at price as verified. This calculation is idempotent because it always derives prices from the unchanged source base price rather than a previously discounted database value.

