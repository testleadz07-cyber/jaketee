# Task 18 Blog Content Outlines

Status: Approved and implemented

Inventory checked against the live `blogposts` collection on September 29, 2026.

## Topic Inventory

| Requested topic | Existing coverage | Decision |
| --- | --- | --- |
| How to wear a letterman jacket | No dedicated article. Existing workwear and college articles cover only narrow situations. | Create a new draft. |
| Varsity jacket vs letterman jacket | Published at `/blog/varsity-jacket-vs-letterman-jacket`. | Refresh with contextual links and an FAQ block. |
| How much does a letterman jacket cost | No letterman-specific article. The existing custom-jacket pricing guide targets a broader query. | Create a new draft and link the two pricing guides contextually. |
| How long does it take to make a letterman jacket | The published custom-jacket timeline guide covers varsity construction and this intent. | Refresh the existing article rather than create a competing page. |

## New Draft 1: How to Wear a Letterman Jacket

Proposed slug: `how-to-wear-a-letterman-jacket`

Primary keyword: `how to wear a letterman jacket`

Search intent: Practical styling advice for owners and shoppers, without limiting the article to work or college.

Outline:

1. What makes a letterman jacket easy to style
2. Start with fit: classic, fitted, or oversized
3. Everyday outfit: T-shirt, straight jeans, and simple sneakers
4. Layered outfit: hoodie or knitwear without crowding the jacket
5. Smart-casual outfit: restrained colors, trousers, and clean footwear
6. Styling for women: denim, trousers, skirts, and proportion balance
7. Styling for men: tees, shirts, chinos, denim, and footwear
8. How to wear bright school colors without visual clutter
9. How patches, names, and back artwork change the rest of the outfit
10. Seasonal guidance for wool, leather, satin, and cotton twill
11. Common styling mistakes to avoid
12. Choosing or customizing a jacket around your wardrobe

Required contextual links:

- `/varsity-jackets`
- `/varsity-jackets/oversized`
- `/varsity-jackets/vintage`
- `/materials-colors`
- One relevant live product selected when the draft is created

FAQ questions:

- What do you wear under a letterman jacket?
- Can you wear a letterman jacket with jeans?
- Can a letterman jacket be smart casual?
- Should a letterman jacket fit tightly or loosely?
- Can adults wear letterman jackets?

## New Draft 2: How Much Does a Letterman Jacket Cost?

Proposed slug: `how-much-does-a-letterman-jacket-cost`

Primary keyword: `how much does a letterman jacket cost`

Search intent: Explain the components that determine a letterman jacket quote without inventing universal price ranges.

Outline:

1. Why there is no single price for every letterman jacket
2. Starting-product price versus final customized price
3. Body and sleeve materials: wool, genuine leather, faux leather, satin, fleece, and twill
4. Construction and lining choices
5. Chenille letters, embroidery, tackle twill, and patch complexity
6. Names, numbers, graduation years, and other individual details
7. How quantity affects a group quote
8. Artwork setup, revisions, and the free mockup process
9. Shipping destination and any applicable order costs
10. How to request an accurate quote
11. Comparing value without relying on a misleading compare-at price
12. A checklist of information to prepare before contacting Jacketee

Required contextual links:

- `/custom-letterman-jackets`
- `/varsity-jackets`
- `/patches-embroidery`
- `/bulk-orders`
- The existing custom-jacket pricing guide
- One relevant live product selected when the draft is created

FAQ questions:

- What makes a letterman jacket more expensive?
- Is genuine leather more expensive than faux leather?
- Do chenille patches change the price?
- Can I order one custom letterman jacket?
- How do I get an exact bulk price?

Content guardrail: the article will use current product prices only where they can be fetched from verified live data. It will not publish unsupported universal price ranges or fixed delivery promises.

## Existing Article Refreshes

### Varsity Jacket vs Letterman Jacket

- Preserve the existing URL and primary topic.
- Add contextual links to `/varsity-jackets`, `/custom-letterman-jackets`, and `/patches-embroidery`.
- Add an FAQ covering terminology, construction, school use, non-athlete use, and customization.
- Keep the answer concise and avoid creating a second comparison article.

### How Long Does a Custom Jacket Order Take?

- Preserve the existing URL to avoid overlapping timeline articles.
- Reframe fixed timeline claims around the configured production and shipping windows already used by the store.
- Add explicit letterman-jacket construction context.
- Add contextual links to `/custom-letterman-jackets`, `/bulk-orders`, and `/shipping`.
- Retain and align the FAQ with the visible timing guidance.

## Implementation Result

- Created `how-to-wear-a-letterman-jacket` with `draft` status.
- Created `how-much-does-a-letterman-jacket-cost` with `draft` status.
- Refreshed the published varsity-versus-letterman article in place with contextual links and an FAQ block.
- Refreshed the published production-timeline article in place with contextual links, an FAQ block, and timing language aligned with the fulfillment configuration.
- Attached a real in-stock letterman product to all four records for relevant product discovery.
