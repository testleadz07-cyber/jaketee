# Fulfillment Configuration

The storefront uses these optional environment variables:

| Variable | Current fallback |
| --- | --- |
| `NEXT_PUBLIC_INDIVIDUAL_PRODUCTION_WINDOW` | Confirmed after the design and order details are approved. |
| `NEXT_PUBLIC_INDIVIDUAL_DELIVERY_WINDOW` | Confirmed for the destination before production begins. |
| `NEXT_PUBLIC_BULK_PRODUCTION_DELIVERY_WINDOW` | Orders of 10 or more jackets typically take 3-4 weeks total, including production and delivery. |

Confirmed shipping rules shown to customers:

- One jacket: $30 USD shipping.
- Two or more jackets: quote required based on quantity and package weight.
- Free shipping: only when an eligible free-shipping coupon is accepted at checkout.
- United States, United Kingdom, and Canada: timing varies by destination and customs processing; the service, charge, and current estimate are confirmed for the destination.
- Individual/custom order timing: confirmed before production. No unverified fixed window is displayed.
