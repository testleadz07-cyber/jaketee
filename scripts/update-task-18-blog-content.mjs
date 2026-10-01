import 'dotenv/config'
import mongoose from 'mongoose'
import { marked } from 'marked'

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required')

const newPosts = [
  {
    title: 'How to Wear a Letterman Jacket: Everyday Outfit Guide',
    slug: 'how-to-wear-a-letterman-jacket',
    excerpt: 'Learn how to style a letterman jacket with jeans, layers, smart-casual pieces, and balanced colors for everyday wear.',
    categorySlug: 'style-guides',
    tags: ['how to wear a letterman jacket', 'letterman jacket outfits', 'varsity jacket style'],
    seoTitle: 'How to Wear a Letterman Jacket | Outfit Guide',
    seoDescription: 'Learn how to wear a letterman jacket with jeans, layers and smart-casual outfits. Get practical fit, color and styling advice for everyday wear.',
    content: `
## How to wear a letterman jacket without looking overdone

A letterman jacket already has a strong shape: ribbed trim, a snap front, contrasting panels, and often patches or embroidery. The easiest way to wear one is to let that structure lead the outfit. Start with simple clothes, repeat one or two colors from the jacket, and avoid adding several competing graphics.

You do not need to be a student or athlete to wear the style. Modern [custom letterman jackets](/custom-letterman-jackets) can be understated, traditional, oversized, or built around personal artwork rather than a school award. The right outfit depends more on fit, color, and decoration than on age.

## Start with the fit

A classic letterman jacket should leave enough room for a T-shirt, knit, or light sweatshirt without pulling across the chest. The shoulder line and sleeve length should still look deliberate. If the jacket is heavily insulated or made from structured wool and leather, a little ease helps it move comfortably.

An [oversized varsity jacket](/varsity-jackets/oversized) works best when the rest of the outfit has controlled proportions. Straight or relaxed trousers usually balance the jacket better than extremely wide layers everywhere. If you prefer a fitted jacket, check that the ribbed waistband does not ride up and that the snaps close without strain. Use the store size guide and your measurements rather than choosing solely from the size label on another brand.

## The reliable everyday outfit

Pair the jacket with a plain T-shirt, straight jeans, and clean sneakers or boots. Dark denim makes bright school colors easier to wear, while washed blue denim suits cream, green, burgundy, navy, and traditional wool-and-leather combinations. A simple base gives chest letters, sleeve numbers, and back artwork enough visual space.

Black, navy, charcoal, cream, and white are useful base colors because they connect easily to most rib trim and sleeve combinations. For a concrete starting style, see the [black wool and white leather letterman jacket](/varsity-jackets/wool-leather/black-wool-and-white-leather-sleeves-letterman-jacket), then compare other current [varsity jackets](/varsity-jackets).

## Layer it over a hoodie or knit

A hoodie makes a letterman jacket feel casual and practical, but the neckline can become crowded. Choose a lighter hoodie with a hood that sits cleanly outside the jacket. Keep its color close to the body, sleeves, or ribbing rather than introducing another unrelated accent.

Crewneck sweatshirts and fine knits create a cleaner neckline. They are useful when the jacket already has large patches or a detailed back. Leave enough room in the selected size for the intended layer and remember that wool, leather, satin, and cotton twill do not drape in the same way.

## Make it smart casual

For a neater outfit, choose a jacket with restrained decoration and pair it with a plain knit, Oxford shirt, polo, chinos, or straight trousers. Tonal body and sleeve colors generally read more quietly than high-contrast school colors. Leather shoes, minimal sneakers, or simple boots keep the result intentional.

A letterman jacket is not a substitute for formal tailoring, but it can work for creative offices, dinners, campus events, and relaxed business settings. Avoid combining a highly decorated jacket with a patterned shirt and heavily distressed trousers; choose one visual focus.

## Styling ideas for different wardrobes

Women can balance the jacket with straight jeans, tailored trousers, a midi skirt, or a simple dress. A cropped or fitted base layer defines the silhouette beneath a roomy jacket, while shoes can shift the result from casual to polished.

Men can pair the jacket with tees, knit polos, button-down shirts, chinos, dark denim, or clean cargo trousers. The same principle applies across wardrobes: repeat a jacket color once, keep the base relatively calm, and choose trousers that support the jacket's volume.

## Work with color and decoration

If the jacket uses two bright school colors, repeat only one in the outfit and keep everything else neutral. If it is tonal, texture can provide interest through denim, wool, leather, or knitwear. The [materials and colors guide](/materials-colors) explains how common varsity materials affect weight and appearance.

Patches also change how the jacket should be styled. One chest letter leaves room for a stronger shoe or trouser choice. A full back composition usually looks best with a quieter base. Names, numbers, and graduation years make the jacket personal, so they do not need another slogan competing beside them.

## Dress for the material and season

Wool-and-leather jackets suit cool weather and structured layers. Satin is lighter and works with tees or thin knits. Cotton twill can be practical in milder weather, while fleece feels softer and more casual. Follow the care instructions for the exact materials, especially when the jacket combines wool, leather, ribbing, lining, and raised patches.

## Common styling mistakes

- Choosing a size that restricts movement just to create a fitted appearance.
- Wearing several large graphics that compete with the jacket artwork.
- Mixing too many unrelated accent colors.
- Covering important back decoration with a bulky hood or bag.
- Treating every letterman jacket as a costume instead of adapting it to your wardrobe.

The most useful approach is simple: choose the jacket as the main piece, build a clean outfit underneath it, and adjust the proportions for how you actually move and layer.

## Frequently asked questions

### What do you wear under a letterman jacket?

A plain T-shirt, crewneck sweatshirt, fine knit, hoodie, polo, or button-down can work. Choose the layer according to the jacket's room, material, and the setting.

### Can you wear a letterman jacket with jeans?

Yes. Straight dark or washed denim is one of the easiest pairings because it supports both traditional school colors and quieter modern designs.

### Can a letterman jacket be smart casual?

It can suit many smart-casual settings when the colors and decoration are restrained and the jacket is paired with clean trousers, knitwear, or a collared shirt.

### Should a letterman jacket fit tightly or loosely?

It should allow comfortable movement and the layers you intend to wear. A classic fit is neither restrictive nor excessively loose; an oversized fit should use deliberate proportions.

### Can adults wear letterman jackets?

Yes. Adults can wear traditional, minimal, vintage-inspired, or personally customized versions. Styling and artwork determine whether the result feels current and relevant.
`,
  },
  {
    title: 'How Much Does a Letterman Jacket Cost?',
    slug: 'how-much-does-a-letterman-jacket-cost',
    excerpt: 'Understand what determines a custom letterman jacket price, from materials and patches to personalization, quantity, and shipping.',
    categorySlug: 'buying-guides',
    tags: ['how much does a letterman jacket cost', 'letterman jacket price', 'custom varsity jacket cost'],
    seoTitle: 'How Much Does a Letterman Jacket Cost? | Jacketee',
    seoDescription: 'See what affects letterman jacket cost, including wool, leather, patches, embroidery, personalization and quantity, then prepare an accurate quote.',
    content: `
## Why letterman jacket prices vary

There is no honest single price for every letterman jacket. A plain wool style and an all-leather jacket with chenille artwork, individual names, sleeve details, and custom lining are different products. The final cost depends on the starting jacket, materials, construction, decoration, quantity, and delivery requirements.

Current product prices in the [varsity jacket collection](/varsity-jackets) provide a starting reference for the jacket shown. A customized order should be quoted against the exact specification. This is especially important for a [custom letterman jacket](/custom-letterman-jackets), where several apparently small design choices can change the production work.

## Starting price versus final custom price

A product-page price describes the listed starting style and its included specification. It should not be treated as the guaranteed total for every combination of patches, embroidery, materials, sizes, and personalized details. For example, the [black wool and white leather letterman jacket](/varsity-jackets/wool-leather/black-wool-and-white-leather-sleeves-letterman-jacket) provides a live reference for one wool-and-leather construction, while an all-leather or heavily decorated project needs a different calculation.

Build the quote from the jacket outward: select the closest starting construction, list every requested change, and confirm what is included before approving production.

## Body and sleeve materials

Material is one of the largest cost factors. Melton wool gives the traditional structured body. Genuine leather sleeves introduce hide selection, cutting, and material-specific handling. Faux leather can provide a similar visual contrast with different performance and cost. Satin, fleece, and cotton twill create lighter alternatives, while an all-leather shell uses leather across a much larger area.

The exact leather type, wool weight, lining, rib trim, and color availability also matter. Review the [materials and colors guide](/materials-colors) and request confirmation for the chosen combination instead of assuming that every color costs or performs the same.

## Construction and lining

The familiar letterman shape includes body panels, sleeves, pockets, snap closure, ribbed collar, cuffs, waistband, and lining. Changes to that structure can affect the quote. A hood, special pocket, unusual panel arrangement, upgraded lining, custom hardware, or a fully bespoke fit adds work beyond selecting standard colors.

If the goal is an oversized or altered silhouette, describe the intended measurements and proportions. Simply choosing a larger standard size is not always equivalent to changing the pattern.

## Chenille, embroidery, and tackle twill

Decoration price depends on technique, size, detail, colors, and placement count. Chenille is commonly used for raised school letters and mascots. Embroidery handles names, text, and detailed marks. Tackle twill builds broad fabric lettering. A small chest letter and a multi-color full-back composition do not require the same materials or production time.

List every front, back, and sleeve element when requesting a price. The [patches and embroidery guide](/patches-embroidery) can help distinguish the techniques before artwork is reviewed.

## Names, numbers, and individual details

Personalization can vary within a group order. Each student or member may have a different name, number, graduation year, activity, or award detail. This adds data preparation and production variation even when the base jacket is shared.

Use one verified roster with exact spelling, capitalization, size, and placement instructions. A clean final roster supports a more accurate quote and reduces corrections after the mockup stage.

## Quantity and group pricing

Jacketee has no minimum order, so one jacket can be requested. A coordinated group may receive project pricing because several units share materials and setup, but the final per-jacket amount still depends on how much personalization varies. Ask for a [bulk-order quote](/bulk-orders) using the realistic quantity rather than an aspirational estimate.

If additional jackets may be needed later, ask how a reorder would be handled. Material availability and setup can change, so a later unit should not automatically be assumed to have the original group price.

## Artwork, mockups, and revisions

Jacketee provides a free design mockup before production. The mockup lets you check colors, spelling, scale, and placement, but the artwork still needs to be production-ready or suitable for conversion. Complex low-resolution images may need more preparation than clean vector artwork or straightforward text.

Consolidate feedback into one approval round where possible. For schools, teams, and organizations, appoint one coordinator with authority to approve the shared design.

## Shipping and destination

Shipping is separate from production choices. One jacket currently has a confirmed $30 USD shipping charge. Two or more jackets require a shipping quote based on quantity and package weight. International service, charges, customs processing, and estimates are confirmed for the destination. Custom items do not automatically receive free shipping based on order value; free shipping applies only when an eligible coupon is accepted at checkout.

## How to request an accurate price

Provide the jacket style, body and sleeve materials, colors, lining, quantity, size breakdown, artwork, decoration techniques, placement list, personalization roster, and delivery country. State the required event date, but wait for the production and delivery schedule to be confirmed before treating it as guaranteed.

Compare quotes by specification, not by a percentage-off badge or an unsupported previous price. Confirm what materials, decoration, proofing, personalization, and shipping are included.

## Frequently asked questions

### What makes a letterman jacket more expensive?

Premium materials, structural changes, larger or more numerous decorations, complex artwork, custom lining, and individual personalization can all increase the price.

### Is genuine leather more expensive than faux leather?

The selected genuine leather will generally have a different cost from faux leather, but the exact difference must be quoted for the jacket, color, and quantity.

### Do chenille patches change the price?

Yes. Patch size, shape, colors, detail, quantity, and placement are part of the project specification and quote.

### Can I order one custom letterman jacket?

Yes. There is no minimum order requirement, although one custom jacket and a coordinated bulk order are priced differently.

### How do I get an exact bulk price?

Submit the realistic quantity, materials, artwork, placement list, size breakdown, personalization roster, and destination through the bulk-order process.
`,
  },
]

const existingUpdates = [
  {
    slug: 'varsity-jacket-vs-letterman-jacket',
    content: `
## Varsity jacket vs letterman jacket: what is the difference?

The terms varsity jacket and letterman jacket usually describe the same recognizable garment: a snap-front jacket with ribbed trim, a structured body, contrasting or matching sleeves, and space for letters, patches, names, and numbers. The difference is mainly historical context and how the wearer uses the jacket, not a universal construction rule.

## Where the term letterman jacket comes from

Letterman jacket refers to the American school tradition of awarding a varsity letter for achievement in athletics, academics, music, or another recognized activity. The chenille school initial became the central feature, and the person who earned it was a letterman. Names, graduation years, numbers, award bars, and activity symbols could be added as the student's achievements developed.

That context still matters. A modern [custom letterman jacket](/custom-letterman-jackets) often emphasizes the earned letter, school identity, and personal record even when its base shape is identical to a fashion-focused varsity jacket.

## Why people say varsity jacket

Varsity originally refers to a school's principal team or competitive level. As the silhouette moved into general fashion, varsity jacket became the broader term. A jacket can now use varsity proportions without representing a school or an earned award. Brands, creative groups, companies, and individuals use the shape for original color blocking and artwork.

The current [varsity jacket collection](/varsity-jackets) includes several material and style directions, showing why the broader label is useful.

## Is the construction different?

Not necessarily. Traditional versions often use a melton wool body, genuine leather sleeves, striped rib trim, snap buttons, and quilted lining. Both names can also describe all-wool, faux-leather-sleeve, satin, cotton-twill, fleece, hooded, or all-leather designs.

Look at the stated materials rather than assuming that the product name guarantees one construction. The body, sleeves, lining, trim, fit, and decoration method determine how the jacket feels and performs.

## What matters when ordering

Choose the jacket around climate, intended use, fit, material preference, and artwork. For a traditional school piece, start with official colors and authorized marks, then decide which achievements belong on the chest, sleeves, and back. For a personal or brand jacket, establish an original visual hierarchy rather than copying an institution.

The [patches and embroidery guide](/patches-embroidery) explains chenille, embroidery, and other common decoration choices. Jacketee provides a free mockup so the visible colors, scale, spelling, and placement can be approved before production.

## Which term should you use?

Use letterman jacket when the school-letter and achievement tradition is central. Use varsity jacket when discussing the broader silhouette, fashion styling, or non-school customization. When requesting a quote, either term is understood; the detailed specification matters more than the label.

## Frequently asked questions

### Are varsity jackets and letterman jackets the same?

In modern use, they usually refer to the same basic jacket shape. Letterman emphasizes the earned school-letter tradition, while varsity is the broader style term.

### Does a letterman jacket have to use wool and leather?

No. Wool with leather sleeves is traditional, but all-wool, faux leather, satin, fleece, cotton twill, hooded, and all-leather versions also exist.

### Can non-athletes wear a letterman jacket?

Yes. School letters can represent academic, arts, or activity achievements, and modern custom jackets can also use personal or original artwork without claiming an award.

### Can I customize a varsity jacket without a school letter?

Yes. Names, numbers, original logos, patches, embroidery, and color combinations can be planned without using a school identity.

### Which term should I search for when buying one?

Search both terms, then compare the actual materials, measurements, decoration options, and pricing rather than relying on the product label alone.
`,
  },
  {
    slug: 'how-long-does-a-custom-jacket-order-take-production-shipping-timelines-explained',
    content: `
## How long does a custom jacket order take?

The reliable answer depends on the approved design, materials, decoration, quantity, current production capacity, and destination. Jacketee confirms the production and delivery schedule for individual and custom orders before production begins. A fixed promise made before those details are known would be misleading.

For bulk orders of 10 or more jackets, the current configured estimate is typically 3–4 weeks total, including production and delivery. This remains an estimate rather than a guaranteed date, and the actual schedule is confirmed for the order.

## Stage 1: prepare the design brief

Choose the jacket style, materials, colors, quantity, and intended decoration. Supply usable artwork and list every front, back, and sleeve placement. For a letterman jacket, include the chest letter, names, numbers, graduation years, activities, and any individual differences.

The [custom letterman jacket guide](/custom-letterman-jackets) explains the main design decisions. A complete brief allows the team to assess feasibility and timing more accurately than a request containing only an event date.

## Stage 2: review the free mockup

Jacketee provides a free design mockup before production. Check spelling, colors, scale, placement, and the relationship between patches and seams. Groups should appoint one coordinator and consolidate feedback. Production does not begin until the design and order details are approved, so delayed or conflicting feedback moves the starting point.

## Stage 3: confirm sizes and personalization

For one jacket, confirm the selected size against current measurements and intended layers. For a team or class order, submit one verified roster containing each size, name, number, role, year, and optional detail. Corrections made after approval can affect the schedule.

The [bulk-order page](/bulk-orders) outlines the information needed for a coordinated project. Collecting it before approval is one of the most useful ways to avoid preventable delay.

## Stage 4: materials and production

Material availability and construction affect production planning. A standard jacket with simple embroidery differs from a wool-and-leather letterman jacket with custom chenille, a full back design, sleeve decoration, and unique details for every wearer.

The confirmed schedule accounts for those choices. If a selected material or color is not immediately available, the team can discuss an alternative or provide a revised estimate rather than hiding the change inside a generic timeline.

## Stage 5: quality review

Before dispatch, the finished order should be checked against the approved design and roster. Construction, visible artwork, spelling, sizes, quantities, and finish all need attention. A large personalized order requires more individual checks than one repeated design.

Quality review belongs inside the production plan. It should not be removed simply to support an unconfirmed rush date.

## Stage 6: shipping and delivery

One jacket currently has a $30 USD shipping charge. Two or more jackets require a quote based on quantity and package weight. Delivery timing for the United States, United Kingdom, Canada, and other destinations varies with the selected service, address, and customs processing. The available service, charge, and current estimate are confirmed for the destination.

See the [shipping information](/shipping) for the current rules. Tracking can show movement after dispatch, but customs and carrier events remain outside the production schedule.

## How to plan around an event date

Share the required date before approving the order and wait for written confirmation of the schedule. Allow time for internal design approval, size collection, and unexpected corrections. Schools and organizations should avoid announcing a distribution date based solely on a general article.

If the date is close, contact Jacketee before placing the order. Rush handling may not be available for the selected construction, quantity, or destination. Changing to a simpler material or decoration plan may help only when the team confirms that option.

## Frequently asked questions

### How long does one custom letterman jacket take?

The production and delivery window is confirmed after the design, materials, customization, and destination are known. There is no universal fixed promise for individual custom orders.

### How long does a bulk jacket order take?

Orders of 10 or more jackets typically take 3–4 weeks total, including production and delivery, under the current store configuration. The actual schedule is confirmed for the project.

### Does the mockup add time?

Design review happens before production. Prompt, consolidated feedback helps establish the production start date, while multiple revision rounds can move it.

### Do chenille patches affect production planning?

They can. Patch size, colors, complexity, quantity, and placement are considered alongside the jacket construction and other decoration.

### Is international delivery time guaranteed?

No. The service and estimate are confirmed for the destination, while carrier operations and customs processing can affect delivery after dispatch.

### Can an order be rushed?

Contact Jacketee before ordering. Availability depends on current capacity, materials, design complexity, quantity, and destination and should never be assumed.
`,
  },
]

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db

const categorySlugs = [...new Set(newPosts.map((post) => post.categorySlug))]
const categories = await db.collection('blogcategories').find({ slug: { $in: categorySlugs } }).toArray()
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
for (const slug of categorySlugs) if (!categoryBySlug.has(slug)) throw new Error(`Missing blog category: ${slug}`)

const product = await db.collection('products').findOne({ slug: 'black-wool-and-white-leather-sleeves-letterman-jacket', inStock: true })
if (!product) throw new Error('Required in-stock letterman product was not found')

for (const post of newPosts) {
  const category = categoryBySlug.get(post.categorySlug)
  await db.collection('blogposts').updateOne(
    { slug: post.slug },
    {
      $set: {
        title: post.title,
        excerpt: post.excerpt,
        content: await marked.parse(post.content.trim()),
        categories: [category._id],
        tags: post.tags,
        status: 'draft',
        author: { name: 'Jacketee Team' },
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        taggedProducts: [product._id],
        updatedAt: new Date(),
      },
      $setOnInsert: { slug: post.slug, views: 0, createdAt: new Date() },
    },
    { upsert: true },
  )
  console.log(`Draft upserted: ${post.slug}`)
}

for (const post of existingUpdates) {
  const result = await db.collection('blogposts').updateOne(
    { slug: post.slug },
    {
      $set: {
        content: await marked.parse(post.content.trim()),
        taggedProducts: [product._id],
        updatedAt: new Date(),
      },
    },
  )
  if (result.matchedCount !== 1) throw new Error(`Existing article not found: ${post.slug}`)
  console.log(`Published article refreshed: ${post.slug}`)
}

await mongoose.disconnect()
