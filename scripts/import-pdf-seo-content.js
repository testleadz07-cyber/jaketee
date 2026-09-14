require('dotenv').config({ path: '.env', quiet: true })

const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL

const now = new Date()

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function paragraph(text) {
  return `<p>${text}</p>`
}

function section(title, paragraphs, bullets = []) {
  const body = paragraphs.map(paragraph).join('\n')
  const list = bullets.length ? `<ul>${bullets.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''
  return `<h2>${title}</h2>\n${body}\n${list}`
}

const blogCategoryDefinitions = [
  {
    name: 'Varsity Jacket Guides',
    slug: 'varsity-jacket-guides',
    description: 'Sizing, styling, meaning, and buying guides for varsity jackets.',
  },
  {
    name: 'Bulk Orders',
    slug: 'bulk-orders',
    description: 'Guides for school, team, corporate, and event jacket orders.',
  },
  {
    name: 'Private Label',
    slug: 'private-label',
    description: 'Manufacturing and branding guides for private label jacket programs.',
  },
  {
    name: 'Corporate Style',
    slug: 'corporate-style',
    description: 'Professional styling ideas for branded jackets and workplace apparel.',
  },
]

const blogPosts = [
  {
    title: 'Can You Wear a Varsity Jacket After High School or College?',
    slug: 'can-you-wear-a-varsity-jacket-after-high-school-or-college',
    category: 'Varsity Jacket Guides',
    excerpt:
      'Yes, adults can wear varsity jackets after high school or college. The key is choosing mature colors, clean patches, and the right fit for everyday style.',
    seoTitle: 'Can You Wear a Varsity Jacket After High School? | Jacketee',
    seoDescription:
      'Wondering if adults can wear varsity jackets after school? Learn how to style letterman jackets after high school or college without looking out of place.',
    tags: ['varsity jacket', 'letterman jacket', 'adult varsity jacket', 'college varsity jacket'],
    content: [
      section('The short answer', [
        'Yes, you can wear a varsity jacket after high school or college. A varsity jacket is no longer limited to school athletes or graduating seniors. Today, it works as a casual outerwear piece, a personal milestone jacket, a club jacket, or a branded team uniform.',
        'The difference is in how you wear it. A school-style letterman jacket with heavy patches can feel nostalgic, while a cleaner varsity jacket with refined colors looks more modern. Jacketee customers often choose simple initials, year patches, chenille letters, or embroidered logos so the jacket feels personal without looking too busy.',
      ]),
      section('How to make it look grown up', [
        'For an adult varsity jacket, start with a balanced color palette. Navy and cream, black and white, forest green and beige, charcoal and black, or burgundy and off-white all look mature. Keep the body length slightly cropped at the hip, the shoulders clean, and the sleeves comfortable enough to layer over a tee or lightweight hoodie.',
        'If you want patches, choose meaning over quantity. One chest letter, one name embroidery, or a clean back logo usually looks better than covering every panel.',
      ]),
      section('Best ways to style it', [
        'For daily wear, pair a varsity jacket with straight denim, a plain tee, and sneakers. For a sharper look, wear it over a knit polo or Oxford shirt with dark trousers. If the jacket has bold school colors, keep the rest of the outfit neutral so the jacket stays the focus.',
      ], [
        'Choose a regular or relaxed fit if you plan to layer hoodies.',
        'Choose wool body and leather sleeves for a classic letterman look.',
        'Choose satin or twill for lightweight everyday wear.',
        'Keep custom patches focused on initials, team names, departments, or achievements.',
      ]),
      section('When a custom jacket makes sense', [
        'A custom varsity jacket is useful when you want the piece to represent something specific: a university club, a startup team, a private group, a school alumni order, or a personal achievement. Jacketee can help with colors, patch placement, embroidery, and bulk order planning so the jacket feels intentional from the first sample.',
      ]),
      section('Bottom line', [
        'Wearing a varsity jacket after high school is completely normal. Keep the fit clean, the colors intentional, and the customization tasteful. That is what turns a school memory into a wearable jacket for adult life.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Is It Weird to Wear a Letterman Jacket in College?',
    slug: 'is-it-weird-to-wear-a-letterman-jacket-in-college',
    category: 'Varsity Jacket Guides',
    excerpt:
      'A letterman jacket can work in college when it fits your style, represents a real achievement, or is customized for a club, society, or team.',
    seoTitle: 'Is It Weird to Wear a Letterman Jacket in College? | Jacketee',
    seoDescription:
      'Learn when a letterman jacket works in college, how to style it, and when to choose a custom college varsity jacket instead.',
    tags: ['letterman jacket college', 'college varsity jacket', 'varsity jacket style'],
    content: [
      section('It depends on the jacket and the context', [
        'It is not weird to wear a letterman jacket in college, but the context matters. If the jacket is very tied to a high school identity, it can feel nostalgic. If it is styled well or customized for your college club, department, team, or organization, it can look confident and intentional.',
        'College students often use varsity jackets for student societies, esports teams, fraternity or sorority groups, dance crews, music clubs, and alumni events. In those settings, the jacket works because it belongs to the group identity.',
      ]),
      section('How to avoid the high school look', [
        'Use fewer patches, cleaner colors, and better materials. A college varsity jacket with a single chest logo, sleeve year, or back embroidery usually feels more current than a jacket covered in unrelated awards. Modern letterman jackets also work well in satin, wool-blend, faux leather, and all-wool builds.',
      ], [
        'Swap loud contrast sleeves for tonal sleeves if you want a cleaner look.',
        'Use college colors without copying official marks unless you have permission.',
        'Add your club name, department, batch year, or team logo.',
        'Keep the fit relaxed but not oversized.',
      ]),
      section('What to wear with it on campus', [
        'For everyday campus style, wear the jacket with jeans, cargo pants, joggers, or chinos. Use a plain hoodie, tee, or sweatshirt underneath. If the jacket has bright colors, avoid adding more graphic-heavy items. Let the jacket do the talking.',
      ]),
      section('When to order a new college jacket', [
        'If the old jacket no longer represents you, a custom college varsity jacket is a better choice. Jacketee can create group jackets for university clubs, societies, teams, and batch orders with matching patches, embroidered names, numbers, and size ranges.',
      ]),
      section('Bottom line', [
        'A letterman jacket in college is fine when it feels connected to who you are now. Keep it simple, style it casually, and consider a custom version if you want the jacket to represent your current college life.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Varsity Jackets for Academic Achievement: Not Just Sports',
    slug: 'varsity-jackets-for-academic-achievement-not-just-sports',
    category: 'Varsity Jacket Guides',
    excerpt:
      'Varsity jackets can celebrate academics, leadership, debate, music, robotics, arts, and student organizations, not only sports.',
    seoTitle: 'Varsity Jackets for Academic Achievement | Jacketee',
    seoDescription:
      'See how schools and students use varsity jackets for academic achievement, clubs, leadership, robotics, debate, music, and more.',
    tags: ['academic varsity jacket', 'school achievement jacket', 'custom letterman jacket'],
    content: [
      section('Varsity jackets are bigger than athletics', [
        'The classic varsity jacket started with sports culture, but schools now use custom jackets to recognize many types of achievement. Academic honors, debate teams, robotics clubs, music groups, student leadership, drama clubs, art societies, and volunteer organizations can all be represented with a varsity or letterman-style jacket.',
        'This makes the jacket more inclusive. Students who build the school culture outside the field can still receive a meaningful wearable award.',
      ]),
      section('What to put on an academic varsity jacket', [
        'Academic jackets usually work best with clear symbols: the school initial, club logo, graduation year, student name, honor title, or subject-related patch. A robotics club might use a gear patch. A debate team might use a microphone or crest. A science society might use a clean embroidered emblem.',
      ], [
        'Student name or initials on the chest.',
        'School or club letter patch.',
        'Achievement year on the sleeve.',
        'Back embroidery for society, batch, or department.',
        'Optional patches for events, competitions, or leadership roles.',
      ]),
      section('Best materials for school programs', [
        'Wool-blend bodies with faux leather or leather sleeves create a traditional letterman look. Satin jackets are lighter and often easier for warm climates. Cotton twill and fleece options can work well for daily student wear. Jacketee helps schools compare materials before placing a group order.',
      ]),
      section('Planning a school achievement order', [
        'Start with the number of students, size range, colors, and patch requirements. Then approve a sample layout before production. For schools, a consistent design system matters: one base jacket, one official logo position, and clear rules for names, years, and achievements.',
      ]),
      section('Bottom line', [
        'Varsity jackets can celebrate much more than sports. When designed carefully, they become a school tradition that recognizes academic excellence, creativity, leadership, and belonging.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Do Colleges and Universities Still Use Varsity Jackets?',
    slug: 'do-colleges-and-universities-still-use-varsity-jackets',
    category: 'Bulk Orders',
    excerpt:
      'Colleges still use varsity jackets for sports teams, clubs, societies, alumni groups, events, and custom merchandise programs.',
    seoTitle: 'Do Colleges Still Use Varsity Jackets? | Jacketee',
    seoDescription:
      'Explore how colleges and universities use varsity jackets for clubs, teams, alumni, events, and custom student apparel.',
    tags: ['college varsity jackets', 'university varsity jackets', 'school bulk jackets'],
    content: [
      section('Yes, but the use has expanded', [
        'Colleges and universities still use varsity jackets, but not only in the old athletic sense. Today, custom varsity jackets appear in sports teams, student societies, alumni events, club uniforms, department merchandise, graduation gifts, and limited campus drops.',
        'The jacket works because it carries identity. A hoodie is useful, but a varsity jacket feels more permanent and ceremonial.',
      ]),
      section('Popular college varsity jacket use cases', [
        'A university may order jackets for a basketball team, but a business society, design club, music department, or engineering batch may also want their own jacket. Many groups use varsity jackets for photoshoots, competitions, tours, reunions, and welcome kits.',
      ], [
        'Team jackets for sports and esports.',
        'Batch jackets for graduating classes.',
        'Society jackets for clubs and student organizations.',
        'Alumni jackets for reunions and fundraising.',
        'Limited merchandise for campus stores or events.',
      ]),
      section('What makes a university jacket look official', [
        'A strong university jacket uses consistent colors, clean logo placement, readable embroidery, and durable materials. If the college has brand guidelines, those should guide colors and logo usage. If the group is independent, choose a design that feels connected to campus without misusing protected marks.',
      ]),
      section('How Jacketee helps with college orders', [
        'Jacketee can support size collection, material guidance, patch placement, embroidery planning, and production for group orders. Schools and clubs can start with one approved layout, then add individual names, numbers, or roles for each student.',
      ]),
      section('Bottom line', [
        'Varsity jackets still make sense for colleges and universities. They work best when the design is specific to the group, useful beyond one event, and built with durable materials.',
      ]),
    ].join('\n'),
  },
  {
    title: 'What Does a Varsity Jacket Represent Today?',
    slug: 'what-does-a-varsity-jacket-represent-today',
    category: 'Varsity Jacket Guides',
    excerpt:
      'A varsity jacket represents achievement, belonging, team identity, personal style, and custom storytelling.',
    seoTitle: 'What Does a Varsity Jacket Represent? | Jacketee',
    seoDescription:
      'Understand the meaning of varsity jackets today, from school achievement and team identity to fashion, branding, and personal milestones.',
    tags: ['varsity jacket meaning', 'letterman jacket meaning', 'custom varsity jacket'],
    content: [
      section('A symbol of achievement and belonging', [
        'A varsity jacket traditionally represented school achievement and team membership. The letter on the chest showed that the wearer had earned a place in a group. That meaning still matters, but the jacket now represents more than athletics.',
        'Today, a varsity jacket can represent a graduating class, a creative crew, a business team, a private label brand, a club, or a personal milestone.',
      ]),
      section('Why people still connect with it', [
        'The jacket has a strong shape: contrast sleeves, ribbed cuffs, button front, and bold patches. Those details make it instantly recognizable. When you customize it with names, dates, logos, or embroidery, it becomes a story people can wear.',
      ]),
      section('Modern meanings of varsity jackets', [
        'For schools, it can mean recognition. For companies, it can mean team culture. For fashion brands, it can mean limited-edition identity. For individuals, it can mean memory, confidence, or personal style.',
      ], [
        'Achievement: awards, honors, competitions, and milestones.',
        'Community: teams, clubs, societies, and crews.',
        'Branding: private label drops, corporate events, and campaigns.',
        'Style: classic outerwear with a strong silhouette.',
      ]),
      section('How customization changes the meaning', [
        'A blank varsity jacket is a style piece. A customized varsity jacket becomes specific. A name on the chest, a batch year on the sleeve, a back logo, or a special patch can turn it into a keepsake. Jacketee helps customers plan those details so the final jacket feels personal and polished.',
      ]),
      section('Bottom line', [
        'A varsity jacket represents identity. Whether it is for a school, brand, team, company, or personal wardrobe, the value comes from what the jacket says about the person or group wearing it.',
      ]),
    ].join('\n'),
  },
  {
    title: 'How to Style a Varsity Jacket for Work or Business Casual',
    slug: 'how-to-style-a-varsity-jacket-for-work-or-business-casual',
    category: 'Corporate Style',
    excerpt:
      'A varsity jacket can work in business casual settings when the fit, colors, and styling are polished and minimal.',
    seoTitle: 'How to Style a Varsity Jacket for Work | Jacketee',
    seoDescription:
      'Learn how adults can style varsity jackets for work, business casual outfits, corporate events, and team apparel.',
    tags: ['varsity jacket work outfit', 'business casual varsity jacket', 'corporate varsity jacket'],
    content: [
      section('Can a varsity jacket be business casual?', [
        'A varsity jacket can work in a business casual outfit, especially in creative offices, startup environments, campus teams, agencies, and branded events. It is not the same as a blazer, but with the right design it can look neat, intentional, and professional enough for many relaxed workplaces.',
        'The key is restraint. Use cleaner colors, fewer patches, and a better fit.',
      ]),
      section('Choose the right jacket design', [
        'For work, choose black, navy, grey, cream, brown, or deep green instead of very bright school colors. Tonal sleeves look more refined than high-contrast sleeves. Small embroidery on the chest usually looks more professional than oversized graphics.',
      ], [
        'Best fit: structured shoulders with room to move.',
        'Best colors: neutrals, navy, charcoal, cream, burgundy, forest green.',
        'Best details: small logo, name embroidery, or simple back mark.',
        'Best materials: wool blend, faux leather, suede-style, cotton twill, or satin.',
      ]),
      section('Outfit ideas for men and women', [
        'For men, a varsity jacket works with a knit polo, plain tee, Oxford shirt, chinos, dark jeans, or clean sneakers. For women, it pairs well with straight trousers, denim, midi skirts, ribbed knits, button-down shirts, and minimal shoes. Keep the base outfit clean so the jacket feels elevated.',
      ]),
      section('Corporate branding tips', [
        'If the jacket is for a company, avoid making it look like a giveaway item. Use strong materials, thoughtful logo placement, and subtle colors. Jacketee can create corporate varsity jackets for team gifts, company retreats, launches, staff uniforms, or brand campaigns.',
      ]),
      section('Bottom line', [
        'A varsity jacket can be styled for work when it is simple, well-fitted, and paired with clean basics. For corporate orders, focus on quality and subtle branding rather than loud decoration.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Are Varsity Jackets Professional Enough for Business Events?',
    slug: 'are-varsity-jackets-professional-enough-for-business-events',
    category: 'Corporate Style',
    excerpt:
      'Varsity jackets can be professional for business events when used as branded apparel, team uniforms, or premium event merchandise.',
    seoTitle: 'Are Varsity Jackets Professional for Business Events? | Jacketee',
    seoDescription:
      'See when varsity jackets are appropriate for business events, corporate gifting, staff uniforms, launches, and branded campaigns.',
    tags: ['corporate varsity jackets', 'business event jackets', 'branded jackets'],
    content: [
      section('They can be, with the right design', [
        'Varsity jackets are not formal businesswear, but they can be professional for business events when designed correctly. They work especially well for conferences, product launches, employee gifts, agency events, campus recruiting, startup teams, music events, and brand activations.',
        'The goal is to make the jacket feel like premium branded apparel, not a cheap promotional item.',
      ]),
      section('Where corporate varsity jackets work best', [
        'A custom varsity jacket is useful when the event has a strong community or identity. Staff can wear matching jackets, VIP guests can receive them as gifts, or a brand can sell them as limited merchandise.',
      ], [
        'Product launch uniforms.',
        'Company retreat apparel.',
        'Employee milestone gifts.',
        'Creator or influencer campaign jackets.',
        'Conference team jackets.',
        'Private label brand drops.',
      ]),
      section('Professional design rules', [
        'Use premium materials, controlled colors, and a clear logo hierarchy. Put the main logo on the chest or back, then keep sleeve details optional. Avoid too many slogans. For large teams, confirm size charts and name spellings before production begins.',
      ]),
      section('Ordering tips', [
        'Before ordering, decide whether the jacket is for staff, customers, VIPs, or resale. That decision affects material, price point, packaging, and customization. Jacketee can help with samples, patch placement, embroidery, labels, and group production planning.',
      ]),
      section('Bottom line', [
        'Varsity jackets can be professional enough for business events when the design is polished and the purpose is clear. Treat them as premium apparel, and they can become one of the most memorable pieces in your event plan.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Private Label Varsity Jackets: How Brands Can Build Their Own Jacket Line',
    slug: 'private-label-varsity-jackets-how-brands-can-build-their-own-jacket-line',
    category: 'Private Label',
    excerpt:
      'Private label varsity jackets help brands create custom jacket lines with labels, patches, embroidery, colors, packaging, and repeatable production.',
    seoTitle: 'Private Label Varsity Jackets for Brands | Jacketee',
    seoDescription:
      'Learn how private label varsity jackets work, from samples and custom labels to patches, packaging, minimum orders, and reorders.',
    tags: ['private label varsity jackets', 'custom jacket manufacturer', 'brand jacket line'],
    content: [
      section('What private label varsity jackets mean', [
        'Private label varsity jackets are custom jackets made for your brand, usually with your labels, tags, design details, patches, colors, and packaging. Instead of buying a blank jacket and adding a logo, you build a product that feels like it belongs to your own collection.',
        'This is useful for fashion brands, streetwear labels, school stores, merch companies, clubs, creators, and corporate gift programs.',
      ]),
      section('What can be customized', [
        'A private label program can include body fabric, sleeve material, rib colors, snap buttons, lining, embroidery, chenille patches, woven neck labels, hang tags, poly bags, and packaging inserts. The more details you define, the more consistent your product line becomes.',
      ], [
        'Custom neck label and size label.',
        'Chest, sleeve, and back embroidery.',
        'Chenille or woven patches.',
        'Brand colors and contrast sleeves.',
        'Custom lining or inside label.',
        'Hang tags and packaging.',
      ]),
      section('Sample first, then scale', [
        'A smart private label jacket order starts with a sample. The sample confirms fit, material, logo placement, stitching quality, and color accuracy. After approval, the production order can be repeated more confidently. Jacketee can support small brand planning and larger bulk production workflows.',
      ]),
      section('Common mistakes to avoid', [
        'Do not overload the first jacket with too many details. Start with a strong base design, one clear logo story, and durable materials. Also confirm your size chart, label artwork, spelling, and color codes before production. Small mistakes become expensive when repeated across a full batch.',
      ]),
      section('Bottom line', [
        'Private label varsity jackets are a strong product for brands because they combine recognizable style with deep customization. With the right sample, labels, and production plan, your jacket can become a repeatable signature product.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Private Label vs Custom Jacket Orders: What Is the Difference?',
    slug: 'private-label-vs-custom-jacket-orders-what-is-the-difference',
    category: 'Private Label',
    excerpt:
      'Custom jacket orders personalize a design. Private label jacket orders build a brand-ready product with labels, packaging, and repeatable specs.',
    seoTitle: 'Private Label vs Custom Jacket Orders | Jacketee',
    seoDescription:
      'Compare private label varsity jackets and custom jacket orders so you can choose the right production path for your brand, team, or event.',
    tags: ['private label jackets', 'custom varsity jacket', 'jacket production'],
    content: [
      section('The simple difference', [
        'A custom jacket order usually means you personalize a jacket with colors, patches, names, numbers, or embroidery. A private label jacket order goes further. It is built as a brand product with your labels, tags, packaging, and repeatable production details.',
        'Both options can use the same varsity jacket base, but the goal is different.',
      ]),
      section('Choose custom if you need personalization', [
        'Custom jacket orders are best for schools, teams, clubs, family groups, events, and individual buyers. You might choose a wool body, faux leather sleeves, a name on the chest, a year on the sleeve, and a logo on the back. The jacket is personal, but it does not need full brand packaging.',
      ]),
      section('Choose private label if you need a product line', [
        'Private label is better for brands that plan to sell jackets, reorder them, or build a consistent collection. You may need neck labels, size labels, hang tags, packaging, SKU planning, and fixed specifications for future batches.',
      ], [
        'Custom order: personalization, team identity, event use.',
        'Private label: brand identity, labels, packaging, repeat production.',
        'Custom order: flexible designs per person.',
        'Private label: consistent specs across a collection.',
      ]),
      section('Cost and timeline differences', [
        'Private label orders usually require more planning because labels, packaging, samples, and approvals are involved. Custom orders can be simpler if the design is already clear. In both cases, final pricing depends on material, quantity, patches, embroidery, and timeline.',
      ]),
      section('Bottom line', [
        'If you want jackets for a group, choose custom. If you want jackets that look and feel like your own retail product, choose private label. Jacketee can help you decide which path fits your order.',
      ]),
    ].join('\n'),
  },
  {
    title: 'Varsity Jacket Brand Launch Checklist: Labels, Samples, Packaging, and Reorders',
    slug: 'varsity-jacket-brand-launch-checklist-labels-samples-packaging-and-reorders',
    category: 'Private Label',
    excerpt:
      'Use this varsity jacket launch checklist to plan labels, samples, materials, packaging, size charts, product pages, and future reorders.',
    seoTitle: 'Varsity Jacket Brand Launch Checklist | Jacketee',
    seoDescription:
      'Launching a private label varsity jacket? Use this checklist for samples, labels, patches, packaging, sizing, photos, and reorders.',
    tags: ['varsity jacket brand launch', 'private label checklist', 'custom jacket brand'],
    content: [
      section('Start with the product idea', [
        'Before you order private label varsity jackets, define the product clearly. Is it a premium wool-and-leather jacket, a lightweight satin jacket, a team-inspired drop, or a fashion collection piece? A clear concept helps every later decision: material, patch style, price, packaging, and photography.',
      ]),
      section('Confirm the design details', [
        'Your production file should include colors, materials, logo files, patch sizes, embroidery placement, rib colors, lining, buttons, and label artwork. The more specific the file, the fewer surprises you will have in sampling.',
      ], [
        'Body and sleeve materials.',
        'Chest, back, and sleeve artwork.',
        'Neck label, size label, and care label.',
        'Hang tag and packaging notes.',
        'Size chart and fit notes.',
        'Quantity by size and color.',
      ]),
      section('Approve a sample before production', [
        'The sample is where you check real-world details: fit, weight, logo scale, stitching, patch texture, sleeve length, and comfort. Take photos of the sample, compare it to your product plan, and request revisions before confirming the bulk order.',
      ]),
      section('Plan packaging and customer experience', [
        'Packaging does not need to be complicated, but it should be intentional. A hang tag, clean poly bag, size sticker, and simple insert can make the jacket feel retail-ready. If you are selling online, prepare product photos, care instructions, and sizing notes before launch day.',
      ]),
      section('Think about reorders early', [
        'If the jacket sells well, you will want a repeatable spec sheet. Save your approved sample details, label files, color codes, and size ratios. Jacketee can help keep production details organized so future reorders stay consistent.',
      ]),
      section('Bottom line', [
        'A strong private label varsity jacket launch depends on planning. Get the sample right, confirm the labels, prepare packaging, and document the final specs so your brand can reorder with confidence.',
      ]),
    ].join('\n'),
  },
]

const faqItems = [
  {
    question: 'Can you wear a varsity jacket after high school?',
    category: 'Varsity Jackets',
    answer: [
      'Yes. Adults can wear varsity jackets after high school when the jacket fits well and the design feels current. Choose cleaner colors, fewer patches, and quality materials if you want a mature everyday look.',
      'A custom Jacketee varsity jacket can also be designed around a club, company, university group, or personal milestone instead of only a school sports memory.',
    ],
    bullets: ['Use simple color combinations.', 'Keep patches meaningful.', 'Choose a fit that works over tees or hoodies.'],
    displayPages: ['/faq', '/varsity-jackets'],
  },
  {
    question: 'Is it weird to wear a letterman jacket in college?',
    category: 'Varsity Jackets',
    answer: [
      'No, it is not weird if the jacket fits your current style or represents a college club, team, society, or achievement. A very old high school jacket may feel nostalgic, but a clean college varsity jacket can look intentional.',
      'For campus wear, keep the outfit simple and let the jacket be the main piece.',
    ],
    bullets: ['Use college group artwork or initials.', 'Avoid too many unrelated patches.', 'Pair it with denim, chinos, cargos, or simple sneakers.'],
    displayPages: ['/faq', '/varsity-jackets'],
  },
  {
    question: 'Can adults wear varsity jackets?',
    category: 'Varsity Jackets',
    answer: [
      'Yes. Varsity jackets are now worn by adults, brands, companies, creators, teams, and schools. The adult version usually looks best with refined colors, subtle embroidery, and a clean fit.',
    ],
    bullets: ['Black, navy, charcoal, cream, burgundy, and forest green work well.', 'Tonal sleeves can look more professional.', 'Small embroidery often feels more mature than oversized graphics.'],
    displayPages: ['/faq', '/varsity-jackets'],
  },
  {
    question: 'Do colleges offer varsity jackets?',
    category: 'School & University Orders',
    answer: [
      'Many colleges, university clubs, teams, societies, and alumni groups still use varsity jackets. They may be ordered for sports teams, student organizations, batch events, campus merchandise, or reunions.',
      'Jacketee can help university groups plan colors, logos, patch placement, embroidery, and group sizing.',
    ],
    bullets: ['Sports teams and esports teams.', 'Student societies and departments.', 'Graduating classes and alumni events.'],
    displayPages: ['/faq', '/bulk-orders/schools'],
  },
  {
    question: 'Can you get a varsity jacket for academic achievement?',
    category: 'School & University Orders',
    answer: [
      'Yes. Varsity jackets can recognize academics, debate, robotics, music, leadership, art, volunteer work, and other achievements. They are not limited to athletics.',
      'Schools often use letters, year patches, club logos, and name embroidery to make academic achievement jackets feel official.',
    ],
    bullets: ['Academic honors.', 'Robotics and STEM clubs.', 'Debate, music, art, drama, and leadership groups.'],
    displayPages: ['/faq', '/bulk-orders/schools'],
  },
  {
    question: 'Who qualifies for a varsity jacket?',
    category: 'School & University Orders',
    answer: [
      'Qualification depends on the school, team, club, or organization. Some groups award jackets for athletic participation, while others use them for academic achievement, leadership, membership, graduation, or event participation.',
      'For custom Jacketee orders, your group can define its own qualification rules before placing the order.',
    ],
    bullets: ['Team membership.', 'Academic or club achievement.', 'Graduation batch participation.', 'Corporate or event team participation.'],
    displayPages: ['/faq', '/bulk-orders/schools'],
  },
  {
    question: 'What does a varsity jacket represent?',
    category: 'Varsity Jackets',
    answer: [
      'A varsity jacket represents identity, achievement, belonging, and personal style. Traditionally it represented school athletics, but today it can also represent a club, company, private brand, university group, or personal milestone.',
    ],
    bullets: ['Achievement and recognition.', 'Team or community identity.', 'Custom branding or personal storytelling.'],
    displayPages: ['/faq', '/varsity-jackets'],
  },
  {
    question: 'Are varsity jackets still in style?',
    category: 'Varsity Jackets',
    answer: [
      'Yes. Varsity jackets remain popular because the silhouette is recognizable and easy to customize. They work for streetwear, campus apparel, corporate gifting, school groups, and private label fashion drops.',
      'For a modern look, choose balanced colors, clean embroidery, and a fit that matches how you plan to layer it.',
    ],
    bullets: ['Classic wool and leather styles stay timeless.', 'Satin and twill versions feel lighter and more casual.', 'Minimal branding makes the jacket easier to wear.'],
    displayPages: ['/faq', '/varsity-jackets'],
  },
  {
    question: 'Can I wear a varsity jacket to work?',
    category: 'Corporate Orders',
    answer: [
      'You can wear a varsity jacket to work in many casual, creative, startup, campus, retail, and event environments. It is not formal businesswear, but a clean design can look polished in relaxed workplaces.',
    ],
    bullets: ['Choose subtle colors.', 'Keep logos and patches minimal.', 'Pair it with chinos, dark denim, trousers, polos, or clean tees.'],
    displayPages: ['/faq', '/bulk-orders/corporate'],
  },
  {
    question: 'Are varsity jackets business casual?',
    category: 'Corporate Orders',
    answer: [
      'Varsity jackets can fit business casual settings when the design is simple and the workplace dress code is relaxed. A tonal wool-blend jacket with small embroidery looks more professional than a loud school-style jacket.',
      'For corporate orders, Jacketee recommends subtle branding, durable materials, and clear size planning.',
    ],
    bullets: ['Best for creative offices and team events.', 'Use neutral or brand-aligned colors.', 'Avoid overcrowded patch layouts.'],
    displayPages: ['/faq', '/bulk-orders/corporate'],
  },
  {
    question: 'Can companies order branded varsity jackets?',
    category: 'Corporate Orders',
    answer: [
      'Yes. Companies can order branded varsity jackets for staff uniforms, corporate gifting, events, retreats, launches, VIP merchandise, and creator campaigns.',
      'Branding options can include chest embroidery, back logos, sleeve patches, names, departments, and custom color combinations.',
    ],
    bullets: ['Employee gifts.', 'Launch event apparel.', 'Conference team jackets.', 'Limited branded merchandise.'],
    displayPages: ['/faq', '/bulk-orders/corporate'],
  },
  {
    question: 'What is a private label varsity jacket?',
    category: 'Private Label',
    answer: [
      'A private label varsity jacket is produced for your brand with your design details, labels, tags, packaging, patches, embroidery, and repeatable specifications. It is different from a simple custom jacket because it is built as a brand-ready product.',
    ],
    bullets: ['Custom neck labels.', 'Custom hang tags.', 'Brand colors and patches.', 'Repeatable specs for future production.'],
    displayPages: ['/faq', '/bulk-orders/private-label'],
  },
  {
    question: 'Can I add custom neck labels or hang tags?',
    category: 'Private Label',
    answer: [
      'Yes. Private label orders can include custom neck labels, size labels, care labels, hang tags, packaging inserts, and other brand details. These elements help the jacket feel ready for resale or branded distribution.',
    ],
    bullets: ['Prepare logo files clearly.', 'Confirm label size and placement.', 'Approve label artwork before production.'],
    displayPages: ['/faq', '/bulk-orders/private-label'],
  },
  {
    question: 'What is the minimum order for private label jackets?',
    category: 'Private Label',
    answer: [
      'Minimum order quantity depends on the material, label requirements, customization level, and production plan. Simple custom jackets may require fewer units than full private label jackets with labels and packaging.',
      'Contact Jacketee with your design idea, quantity, sizes, and branding requirements so the team can confirm the best production route.',
    ],
    bullets: ['Quantity by size and color.', 'Material choice.', 'Label and packaging requirements.', 'Patch and embroidery complexity.'],
    displayPages: ['/faq', '/bulk-orders/private-label'],
  },
  {
    question: 'Can I reorder the same private label jacket later?',
    category: 'Private Label',
    answer: [
      'Yes. Reorders are possible when the approved sample, specs, label files, colors, and size chart are documented. Keeping a clear production record helps future batches stay consistent.',
      'Jacketee recommends saving your final artwork files, material notes, color references, and approved sample photos.',
    ],
    bullets: ['Save final artwork files.', 'Keep approved sample notes.', 'Use the same size chart and color references.', 'Plan reorder timing before inventory runs out.'],
    displayPages: ['/faq', '/bulk-orders/private-label'],
  },
]

async function main() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI or DATABASE_URL')
  }

  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  const db = mongoose.connection.db

  const categoryByName = new Map()
  for (const category of blogCategoryDefinitions) {
    const result = await db.collection('blogcategories').findOneAndUpdate(
      { slug: category.slug },
      {
        $set: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: 'after' }
    )
    const categoryDoc = result.value || result
    categoryByName.set(category.name, categoryDoc._id)
  }

  let createdPosts = 0
  let updatedPosts = 0
  for (const post of blogPosts) {
    const slug = slugify(post.slug || post.title)
    const existing = await db.collection('blogposts').findOne({ slug })
    const categoryId = categoryByName.get(post.category)
    await db.collection('blogposts').updateOne(
      { slug },
      {
        $set: {
          title: post.title,
          slug,
          excerpt: post.excerpt,
          content: post.content,
          categories: categoryId ? [categoryId] : [],
          tags: post.tags,
          status: 'published',
          publishedAt: existing?.publishedAt || now,
          author: { name: 'Jacketee Team' },
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          taggedProducts: existing?.taggedProducts || [],
          views: existing?.views || 0,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    )
    if (existing) updatedPosts += 1
    else createdPosts += 1
  }

  const maxOrderByCategory = new Map()
  const faqOrderRows = await db
    .collection('faqs')
    .aggregate([{ $group: { _id: '$category', maxOrder: { $max: '$order' } } }])
    .toArray()
  faqOrderRows.forEach((row) => maxOrderByCategory.set(row._id, row.maxOrder || 0))

  let createdFaqs = 0
  let updatedFaqs = 0
  for (const faq of faqItems) {
    const existing = await db.collection('faqs').findOne({ question: faq.question })
    const nextOrder = (maxOrderByCategory.get(faq.category) || 0) + 1
    if (!existing) maxOrderByCategory.set(faq.category, nextOrder)

    await db.collection('faqs').updateOne(
      { question: faq.question },
      {
        $set: {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          bullets: faq.bullets || [],
          ordered: faq.ordered || [],
          image: existing?.image || { src: '', alt: '' },
          order: existing?.order ?? nextOrder,
          displayPages: faq.displayPages,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    )
    if (existing) updatedFaqs += 1
    else createdFaqs += 1
  }

  const forbidden = await Promise.all([
    db.collection('blogposts').countDocuments({
      slug: { $in: blogPosts.map((post) => slugify(post.slug || post.title)) },
      $or: [
        { title: /luxe/i },
        { excerpt: /luxe/i },
        { content: /luxe/i },
        { seoTitle: /luxe/i },
        { seoDescription: /luxe/i },
      ],
    }),
    db.collection('faqs').countDocuments({
      question: { $in: faqItems.map((faq) => faq.question) },
      $or: [{ question: /luxe/i }, { answer: /luxe/i }, { bullets: /luxe/i }],
    }),
  ])

  console.log(
    JSON.stringify(
      {
        blogPosts: { created: createdPosts, updated: updatedPosts, totalImported: blogPosts.length },
        faqs: { created: createdFaqs, updated: updatedFaqs, totalImported: faqItems.length },
        forbiddenLuxeMatches: forbidden[0] + forbidden[1],
        slugs: blogPosts.map((post) => slugify(post.slug || post.title)),
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
