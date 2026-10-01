export interface CustomLandingConfig {
  path: string
  keyword: string
  title: string
  description: string
  categorySlug: string
  categoryHref: string
  intro: string
  optionsIntro: string
  options: Array<{ title: string; text: string }>
  audienceIntro: string
  guideTitle: string
  guide: string[]
  faqs: Array<{ question: string; answer: string }>
  guides: Array<{ title: string; slug: string }>
}

const commonGuides = [
  { title: 'Design your custom jacket online', slug: 'design-your-own-custom-jacket-online' },
  { title: 'How to write a clear design brief', slug: 'how-to-write-design-brief-custom-jacket-order' },
  { title: 'Custom jacket pricing guide', slug: 'what-does-a-custom-jacket-cost-pricing-guide-for-schools-teams-brands' },
]

export const CUSTOM_JACKET_LANDINGS: Record<string, CustomLandingConfig> = {
  'custom-bomber-jackets': {
    path: '/custom-bomber-jackets', keyword: 'Custom Bomber Jackets',
    title: 'Custom Bomber Jackets | Jacketee',
    description: 'Custom bomber jackets in leather, suede, satin and nylon. Add embroidery, logos or patches and approve a free design mockup before production.',
    categorySlug: 'bomber-jackets', categoryHref: '/bomber-jackets',
    intro: 'Build a custom bomber jacket around your colors, artwork, and intended use. Jacketee offers leather, suede, satin, nylon, and softshell starting points for individuals, teams, event crews, and clothing brands, with a free design mockup supplied for approval before production.',
    optionsIntro: 'A bomber jacket can move from understated uniform to detailed statement piece depending on its shell and decoration. Start with the setting and season, then choose the construction that supports the artwork.',
    options: [
      { title: 'Shell materials', text: 'Choose leather or suede for a substantial finish, satin for a smooth shine, nylon for a classic lightweight bomber, or softshell for practical everyday wear.' },
      { title: 'Embroidery and patches', text: 'Add a chest logo, name, sleeve detail, or larger back artwork. Embroidery suits clean marks and text, while patches give bold shapes more structure.' },
      { title: 'Color and trim', text: 'Coordinate the shell, lining, ribbed collar, cuffs, waistband, zipper, and thread colors so the complete jacket follows one visual system.' },
    ],
    audienceIntro: 'Bomber jackets work well for company uniforms, event merchandise, sports groups, creative crews, and private-label collections. A restrained chest mark can suit staff, while larger back artwork and sleeve details can support a brand release.',
    guideTitle: 'Planning a bomber jacket that works',
    guide: [
      'Begin with climate and use. Satin and nylon are useful when you want a lighter layer, while leather and suede create more weight and structure. Softshell is practical for teams that expect to wear the jacket outdoors. Think about what will be worn underneath and use the size guide instead of relying on another brand’s label.',
      'Prepare artwork at the size and placement you expect to see on the garment. Small lettering may need embroidery rather than a complex patch. Large back designs need enough open space around seams and panels. Jacketee reviews these details in the free mockup, where colors, scale, spelling, and placement can be corrected before production begins.',
      'For a group order, collect sizes and approved artwork before requesting the final quote. Quantity, shell material, decoration count, and individual personalization all affect the price. Production and delivery timing also depend on those choices and the destination, so the confirmed schedule is supplied for the actual project rather than presented as one fixed promise.',
      'One jacket is welcome, and there is no minimum order requirement. Schools, businesses, and brands can still request bulk pricing when several jackets share a specification. Browse the current bomber collection for a starting shape, then contact the team when your project needs coordinated colors, logos, names, or packaging.',
    ],
    faqs: [
      { question: 'Can I order one custom bomber jacket?', answer: 'Yes. There is no minimum order requirement, so you can request one jacket or plan a coordinated group order.' },
      { question: 'Which bomber jacket materials are available?', answer: 'Current starting styles include leather, suede, satin, nylon, and softshell. Availability is confirmed for your chosen design and colors.' },
      { question: 'Can my logo be embroidered on a bomber jacket?', answer: 'Yes. Logos, names, and text can be reviewed for embroidery or patch production depending on detail, size, and placement.' },
      { question: 'Will I see the design before production?', answer: 'Yes. Jacketee provides a free design mockup for review and approval before production begins.' },
      { question: 'How is custom bomber jacket pricing calculated?', answer: 'Price depends on the starting jacket, material, quantity, decoration method, placement count, and personalization. Current product prices provide a starting reference, and a project quote confirms the total.' },
      { question: 'How long will my bomber jacket order take?', answer: 'Timing depends on material availability, design complexity, quantity, approval speed, and destination. Jacketee confirms the project schedule before production.' },
    ],
    guides: [{ title: 'Leather or coated bomber jackets', slug: 'leather-vs-coated-bomber-jacket' }, { title: 'Bomber or coach jacket for uniforms', slug: 'coach-jacket-vs-bomber-jacket-corporate-uniforms' }, commonGuides[0]],
  },
  'custom-coach-jackets': {
    path: '/custom-coach-jackets', keyword: 'Custom Coach Jackets', title: 'Custom Coach Jackets | Jacketee',
    description: 'Custom coach jackets for teams, staff, events and brands. Plan colors, embroidery or printed logos and approve a free mockup before production.',
    categorySlug: 'coach-jackets', categoryHref: '/coach-jackets',
    intro: 'Create custom coach jackets for sidelines, staff uniforms, events, clubs, or a branded apparel range. Choose a practical starting style, share your colors and artwork, and review a free design mockup before Jacketee begins production.',
    optionsIntro: 'Coach jackets are clean, lightweight layers with broad front and back areas for decoration. Their simple shape makes artwork hierarchy especially important: decide what must be visible at a distance and what can remain a smaller detail.',
    options: [
      { title: 'Logo decoration', text: 'Use embroidery for compact logos and names, or discuss print options for larger artwork with fine detail and broader color coverage.' },
      { title: 'Team colors', text: 'Coordinate the jacket body, closure, lining, drawcord, thread, and artwork colors around a school, club, event, or company identity.' },
      { title: 'Names and roles', text: 'Add individual names, departments, staff roles, player numbers, or event information when each jacket needs a personal identifier.' },
    ],
    audienceIntro: 'This style is useful for coaches, school staff, outdoor event teams, venue crews, corporate groups, and streetwear labels. It can remain simple enough for daily uniform use or carry a strong back graphic for merchandise.',
    guideTitle: 'Keep the coach jacket brief clear',
    guide: [
      'A successful coach jacket starts with a clear use case. Sideline staff may prioritize easy layering and visible school colors. Event crews often need a logo that reads quickly. A brand may focus on fit, trim, labels, and a back graphic. Naming the priority helps the team recommend suitable decoration and placement.',
      'Supply the best artwork available and note where each element should sit. Front chest marks should remain readable without crowding the closure. Back designs need to account for seams and folds. Individual names or roles should follow one agreed format. The free mockup brings these choices together before production so the group can approve one consistent design.',
      'Use measured sizes for every wearer and decide whether the jacket will sit over a shirt, sweatshirt, or heavier layer. For groups, collect the size list in one document and identify any personalized entries clearly. This reduces avoidable changes after the design and order details have been approved.',
      'There is no minimum order requirement. Live product prices show the current starting points, while the final quote reflects jacket choice, quantity, decoration, and personalization. Timing is confirmed after the full brief is reviewed because a simple embroidered jacket and a multi-placement group order do not follow the same production schedule.',
    ],
    faqs: [
      { question: 'Is there a minimum for custom coach jackets?', answer: 'No. You can order one jacket or request bulk pricing for a team, organization, event, or brand.' },
      { question: 'Can coach jackets have printed logos?', answer: 'Printed artwork may be suitable for some designs, while embroidery is often used for compact logos and text. The team will confirm the appropriate method.' },
      { question: 'Can each jacket have a different name?', answer: 'Yes. Individual names, numbers, or staff roles can be included in the project brief and shown in the approval process.' },
      { question: 'Do you provide a mockup?', answer: 'Yes. A free design mockup is provided for approval before production.' },
      { question: 'What affects the price?', answer: 'The jacket style, material, quantity, artwork method, number of placements, and individual details affect the final price.' },
      { question: 'When will my order be ready?', answer: 'The schedule is confirmed from your quantity, artwork, production requirements, approval timing, and delivery destination.' },
    ],
    guides: [{ title: 'Coach jacket or bomber jacket', slug: 'coach-jacket-vs-bomber-jacket-corporate-uniforms' }, { title: 'Ordering jackets for outdoor staff', slug: 'order-staff-jackets-large-outdoor-event' }, commonGuides[1]],
  },
  'custom-denim-jackets': {
    path: '/custom-denim-jackets', keyword: 'Custom Denim Jackets', title: 'Custom Denim Jackets | Jacketee',
    description: 'Custom denim jackets with embroidery, patches, names and back artwork. Order one or plan a coordinated group run with a free mockup before production.',
    categorySlug: 'denim-jackets', categoryHref: '/denim-jackets',
    intro: 'Make a custom denim jacket with embroidery, patches, names, lettering, or larger back artwork. Jacketee supports personal pieces, group jackets, event merchandise, and branded collections, with no minimum order and a free design mockup before production.',
    optionsIntro: 'Denim provides a familiar, durable base with visible seams and panels that can frame custom artwork. Good results come from using those construction lines deliberately rather than treating the jacket like a flat canvas.',
    options: [
      { title: 'Embroidery', text: 'Add names, compact logos, dates, or lettering on the chest, back, collar area, or sleeves where the denim construction allows.' },
      { title: 'Patches and lettering', text: 'Use chenille, embroidered, felt, or tackle twill elements to build texture and make larger initials or symbols stand out.' },
      { title: 'Back artwork', text: 'Plan a centered statement graphic or a balanced arrangement of patches while keeping important details clear of seams and folds.' },
    ],
    audienceIntro: 'Custom denim works for musicians, clubs, graduating groups, creative teams, event merchandise, gifts, and streetwear brands. A single jacket can be highly personal, while a group run can share one core design with different names or numbers.',
    guideTitle: 'Design around the denim construction',
    guide: [
      'Start by choosing the jacket wash and silhouette. Dark denim gives bright thread and patches strong contrast, while lighter washes create a softer casual result. Consider how the jacket will be layered and whether the intended fit is close, standard, or relaxed. Always compare measurements with the size guide.',
      'Map the design to real garment panels. Chest pockets, yokes, center seams, and waist tabs can interrupt fine artwork. A compact chest logo may work best above or beside a pocket, while a larger design can use the central back panel. Sleeve text should be sized for the narrow available area. The free mockup lets you review that composition before it is made.',
      'Decoration choice changes the character of the jacket. Embroidery is clean and integrated. Chenille adds depth and a collegiate feel. Felt or tackle twill lettering can create broad shapes without dense stitching. Mixed techniques are possible, but a focused material palette usually gives a more coherent result.',
      'There is no minimum order. Current products supply genuine starting prices, and Jacketee quotes the final design using the chosen jacket, decoration count, quantities, and personal details. Production timing is confirmed for the approved specification and destination instead of relying on a generic promise.',
    ],
    faqs: [
      { question: 'Can I order a single custom denim jacket?', answer: 'Yes. Jacketee has no minimum order requirement for custom jackets.' },
      { question: 'Can you embroider over denim pockets?', answer: 'Placement depends on the pocket and panel construction. The mockup and artwork review identify a practical position before production.' },
      { question: 'Can I combine patches and embroidery?', answer: 'Yes. Multiple decoration methods can be considered when they suit the design and available garment area.' },
      { question: 'Can the back carry a large design?', answer: 'Yes. Back artwork can be planned around the yoke, center seams, and usable panel area.' },
      { question: 'Is the design mockup free?', answer: 'Yes. You receive a free mockup to review before production starts.' },
      { question: 'How are price and timing confirmed?', answer: 'They are based on the jacket, artwork, decoration methods, quantity, personalization, approval, and shipping destination.' },
    ],
    guides: [commonGuides[0], { title: 'Personalize beyond the standard letter', slug: '7-ways-personalise-varsity-jacket-beyond-standard-letter' }, { title: 'Choosing the right jacket fit', slug: 'why-jacket-fit-matters-how-to-get-it-right' }],
  },
  'custom-puffer-jackets': {
    path: '/custom-puffer-jackets', keyword: 'Custom Puffer Jackets', title: 'Custom Puffer Jackets | Jacketee',
    description: 'Custom puffer jackets for staff, teams, events and cold-weather groups. Add your logo and approve a free design mockup before production begins.',
    categorySlug: 'puffer-jackets', categoryHref: '/puffer-jackets',
    intro: 'Plan custom puffer jackets for staff, teams, outdoor events, clubs, or branded winter apparel. Select a current insulated style, add suitable logo decoration, and approve a free design mockup before the order moves into production.',
    optionsIntro: 'Puffer construction adds warmth but also creates quilted channels, filled panels, and technical shell surfaces. Decoration should respect those features so the jacket keeps its shape and the logo remains clear.',
    options: [
      { title: 'Insulated starting styles', text: 'Compare current puffer shapes, lengths, colors, closures, and hood options based on the weather and layering needs of the wearer.' },
      { title: 'Logo placement', text: 'Compact chest or sleeve branding often suits quilted jackets. Placement is reviewed against panel seams, pockets, and insulation channels.' },
      { title: 'Group identification', text: 'Coordinate staff, department, team, or sponsor details while keeping the primary logo easy to recognize on a structured outer layer.' },
    ],
    audienceIntro: 'Puffers suit cold-weather staff, school groups, sports teams, travel crews, venues, and outdoor promotions. They can also support a winter merchandise range when the branding is planned around the insulated construction.',
    guideTitle: 'Prioritize warmth, fit, and usable panels',
    guide: [
      'Choose the base jacket for the actual conditions. Think about hood preference, expected layering, movement, and how long the wearer will be outdoors. A group using jackets for short arrivals has different needs from staff working through an outdoor event. Check garment measurements with the layers people expect to wear underneath.',
      'Keep logos focused. Puffer channels and pockets reduce the uninterrupted decoration area, so a small, legible chest mark can be more effective than oversized detail. The team reviews the chosen artwork and placement, then presents it on a free mockup. Production begins after the design has been approved.',
      'For groups, agree on one jacket specification before collecting sizes. Record any role, name, or department variations in a structured list. Confirm the delivery destination and needed-by date at the inquiry stage. These details affect production planning and make the final schedule more useful than a broad estimate.',
      'There is no minimum order requirement. The products shown on this page provide current price starting points, while insulation, style, quantity, and decoration determine the confirmed quote. Bulk orders can be priced together when they share the same base jacket and artwork.',
    ],
    faqs: [
      { question: 'Can a logo be added to a puffer jacket?', answer: 'Yes. Suitable logo methods and placement are reviewed against the shell, quilting, pockets, and insulation.' },
      { question: 'Can I order one custom puffer?', answer: 'Yes. There is no minimum order requirement.' },
      { question: 'Can staff names be added?', answer: 'Individual names or roles can be discussed and included in the approved order specification.' },
      { question: 'Do I approve a mockup first?', answer: 'Yes. Jacketee provides a free design mockup before production.' },
      { question: 'What determines the final price?', answer: 'The selected puffer, insulation and construction, quantity, decoration, placements, and personalization determine the quote.' },
      { question: 'How should a group choose sizes?', answer: 'Use the published size guide, account for winter layers, and collect each wearer’s measured size before approving the order.' },
    ],
    guides: [{ title: 'Puffer or fleece for cold weather', slug: 'puffer-vs-fleece-hoodie-cold-weather-group-orders' }, { title: 'Managing group sizes and approvals', slug: 'group-jacket-orders-manage-approvals-sizes-payments' }, commonGuides[2]],
  },
  'custom-hoodies': {
    path: '/custom-hoodies', keyword: 'Custom Hoodies', title: 'Custom Leavers Hoodies With Names & Patches | Jacketee',
    description: 'Custom hoodies and leavers hoodies with names, embroidery, chenille and tackle twill. No minimum order, with a free mockup before production.',
    categorySlug: 'fleece-hoodies', categoryHref: '/fleece-hoodies',
    intro: 'Create custom hoodies and leavers hoodies with names, graduation years, team colors, embroidery, chenille, tackle twill, or printed artwork. Order one or organize a full group, and review a free design mockup before production.',
    optionsIntro: 'A hoodie offers broad front and back areas plus sleeves and hood details. The best design establishes one main element, then uses names, numbers, dates, or smaller marks as supporting information.',
    options: [
      { title: 'Leavers details', text: 'Build the school or group name, graduation year, individual name, and optional list of classmates into a clear shared format.' },
      { title: 'Chenille and tackle twill', text: 'Use textured letters and broad fabric shapes for collegiate initials, years, team names, and other high-impact elements.' },
      { title: 'Embroidery and print', text: 'Choose embroidery for durable compact details or discuss print for artwork that needs fine lines, tonal shading, or larger coverage.' },
    ],
    audienceIntro: 'Custom hoodies fit leavers and seniors, school clubs, sports teams, workplaces, events, community groups, and branded merchandise. Shared artwork can be combined with a different name or number for each wearer.',
    guideTitle: 'Organize a hoodie order without confusion',
    guide: [
      'Start with one decision-maker and one approved design brief. Record the hoodie color, artwork files, wording, placement, and decoration preference. For leavers groups, confirm the final spelling of every name and decide whether the year appears on the front, back, sleeve, or more than one location.',
      'Collect sizes from the published guide rather than asking people for their usual brand size. Keep size and personalization data in matching rows so a name cannot be applied to the wrong garment. A group can review the free mockup together, but final approval should come through one named contact to avoid conflicting changes.',
      'Choose decoration for the visual result and artwork. Chenille is raised and traditional. Tackle twill produces broad fabric lettering. Embroidery works well for crests, names, and compact detail. Print can support fine or larger graphic work where appropriate. Combining methods can work when the hierarchy remains simple.',
      'Jacketee has no minimum order requirement. Live hoodie prices are the starting reference; quantity, decoration, placements, and individual names determine the final quote. The production and delivery schedule is confirmed after all details and the destination are known.',
    ],
    faqs: [
      { question: 'Is there a minimum order for custom hoodies?', answer: 'No. You can order one custom hoodie or request a coordinated quote for a full group.' },
      { question: 'Can every leavers hoodie have a different name?', answer: 'Yes. Individual names and numbers can be organized within one shared group design.' },
      { question: 'Can you make chenille letters for hoodies?', answer: 'Yes. Chenille, tackle twill, embroidery, and other suitable methods can be reviewed for the design.' },
      { question: 'Will our group receive a mockup?', answer: 'Yes. A free design mockup is provided for approval before production.' },
      { question: 'What should we prepare for a group order?', answer: 'Prepare approved artwork and wording, a size list, personalization list, quantity, delivery destination, and needed-by date.' },
      { question: 'How is the schedule confirmed?', answer: 'Jacketee reviews the quantity, decoration, personalization, approval timing, and destination before confirming production and delivery timing.' },
    ],
    guides: [{ title: 'How to collect group sizes', slug: 'how-to-collect-sizes-from-your-team-bulk-jacket-order' }, { title: 'Managing group approvals and payments', slug: 'group-jacket-orders-manage-approvals-sizes-payments' }, { title: 'Puffer or fleece hoodie', slug: 'puffer-vs-fleece-hoodie-cold-weather-group-orders' }],
  },
  'custom-letterman-jackets': {
    path: '/custom-letterman-jackets', keyword: 'Custom Letterman Jackets', title: 'Custom Letterman Jackets | Jacketee',
    description: 'Custom letterman jackets for school awards, teams and individuals. Choose materials, chenille letters and embroidery with a free design mockup.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Design custom letterman jackets for earned letters, school awards, teams, graduating classes, clubs, or personal milestones. Choose the body and sleeve materials, colors, chenille, names, numbers, and embroidery, then approve a free mockup before production.',
    optionsIntro: 'The letterman tradition is built around meaningful placement. A chest letter, graduation year, sport, position, award bars, name, and back identity each tell part of the story. The jacket should feel collected and personal rather than crowded.',
    options: [
      { title: 'Body and sleeves', text: 'Compare wool bodies with genuine or faux leather sleeves, all-wool builds, satin, cotton twill, fleece, hooded styles, and all-leather options.' },
      { title: 'Chenille and award details', text: 'Plan school letters, mascots, years, numbers, activity symbols, award bars, and other patches around their meaning and traditional locations.' },
      { title: 'Names and embroidery', text: 'Add a student name, team name, position, achievement, graduation year, or smaller logo with thread colors coordinated to the jacket.' },
    ],
    audienceIntro: 'Letterman jackets serve students who have earned an academic, athletic, arts, or activity award, but they also work for alumni, clubs, teams, senior classes, and individuals who value the traditional silhouette. Schools can establish one shared specification while preserving personal achievements.',
    guideTitle: 'Build a letterman jacket with meaning',
    guide: [
      'Begin with the school or team color system and choose the construction. Wool with leather sleeves is the familiar letterman combination. All-wool offers a consistent fabric surface. Faux leather provides the sleeve look without genuine leather. Satin and cotton twill create lighter alternatives, while a hood changes the traditional neckline and layering style.',
      'List every patch and piece of lettering before arranging placement. The main school letter often sits on the chest. Names, years, numbers, sports, activities, and achievements can use the opposite chest, sleeves, or back. Leave enough space between elements and decide which detail should be read first. The patches and embroidery guide explains the available techniques.',
      'Use the free mockup as an approval document. Check school colors, letter shapes, names, numbers, spelling, placement, and proportions. For a group order, one coordinator should gather the final size and personalization list and secure internal approval before confirming the production version.',
      'There is no minimum order requirement, so one student can order a jacket and a school can also coordinate a full program. Current varsity products provide live starting prices. Material, patch count, embroidery, quantity, and individual details determine the final quote, while the approved specification and destination determine timing.',
    ],
    faqs: [
      { question: 'What is the difference between a varsity and letterman jacket?', answer: 'The terms often describe the same jacket shape. “Letterman” emphasizes the tradition of earning and displaying a school letter or achievement.' },
      { question: 'Can I order one letterman jacket?', answer: 'Yes. Jacketee has no minimum order requirement for an individual custom jacket.' },
      { question: 'Can schools create one design with different student details?', answer: 'Yes. A shared jacket specification can include different names, numbers, letters, or achievements for each student.' },
      { question: 'Which patches can be added?', answer: 'Chenille letters, embroidered patches, felt or tackle twill elements, names, numbers, years, mascots, and activity details can be reviewed.' },
      { question: 'Do I approve the letterman design first?', answer: 'Yes. Jacketee supplies a free mockup for review before production.' },
      { question: 'How are price and production timing decided?', answer: 'They depend on materials, patch and embroidery details, quantity, personalization, approval timing, and delivery destination.' },
    ],
    guides: [{ title: 'Varsity jacket vs letterman jacket', slug: 'varsity-jacket-vs-letterman-jacket' }, { title: 'Letterman patches explained', slug: 'letterman-patches-chenille-embroidery-guide' }, { title: 'What to put on a varsity jacket', slug: 'what-to-put-on-a-varsity-jacket' }],
  },
  'oversized-varsity-jackets': {
    path: '/varsity-jackets/oversized', keyword: 'Oversized Varsity Jackets', title: 'Oversized Varsity Jackets | Custom Fit & Design | Jacketee',
    description: 'Design an oversized varsity jacket with custom colors, patches, names and embroidery. Review a free mockup before production with no minimum order.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Create an oversized varsity jacket with a relaxed silhouette, roomy layers, and artwork planned for the larger proportions. Choose a varsity starting style, share your preferred fit, colors, patches, and embroidery, then approve a free design mockup before production begins.',
    optionsIntro: 'An oversized result should come from deliberate proportions, not simply choosing an unsuitable size. Shoulder position, body length, sleeve volume, rib trim, and the clothing worn underneath all influence how the finished jacket hangs.',
    options: [
      { title: 'Relaxed proportions', text: 'Discuss the intended shoulder drop, body room, sleeve shape, and length so the pattern supports the look without making cuffs, pockets, or artwork feel misplaced.' },
      { title: 'Materials and layering', text: 'Choose wool and leather for structure, satin or cotton twill for a lighter drape, or fleece for softness. Allow room for hoodies and seasonal layers when needed.' },
      { title: 'Scaled decoration', text: 'Use larger chenille, back patches, names, numbers, and embroidery where the roomy panels permit it, while keeping margins clear of seams, ribbing, and pocket openings.' },
    ],
    audienceIntro: 'Oversized varsity jackets suit streetwear wardrobes, dance crews, graduating classes, creative teams, and branded collections. Individuals can order one statement jacket, while groups can establish one relaxed fit direction and personalize names or numbers.',
    guideTitle: 'Plan an oversized fit with purpose',
    guide: [
      'Start by describing the silhouette rather than relying on the word oversized alone. A mildly relaxed jacket and a strongly dropped-shoulder streetwear shape require different measurements. Note the wearer measurements, preferred finished length, usual layering, and any reference fit. The size guide gives a consistent baseline, while the project discussion confirms whether the goal is extra ease, added length, broader sleeves, or a combination.',
      'Material affects the appearance of volume. Wool and leather hold a defined varsity shape, while satin and cotton twill can fall more softly. Ribbed cuffs and waistbands draw the volume back toward the body, so their tension and position matter. A hooded starting style adds another layer around the neckline. Review the current varsity collection to identify the construction closest to the result before requesting modifications.',
      'Artwork should match the larger visual field. A standard chest mark may look intentionally minimal, but a back composition can often use more scale. Map every letter, patch, number, name, and sleeve detail before approval. The free mockup lets you check hierarchy, spelling, color contrast, and the distance from seams. It also gives a group one shared reference for collecting final approval.',
      'One jacket can be produced because Jacketee does not require a minimum order. For crews, classes, or brands, the quote reflects the selected construction, quantity, decoration methods, placement count, and individual personalization. Timing is confirmed after the specification and destination are known. That keeps fit, price, and delivery expectations attached to the actual design rather than a generic oversized label.',
    ],
    faqs: [
      { question: 'How should I choose an oversized varsity jacket size?', answer: 'Use your body measurements, intended layers, and preferred finished silhouette. Share a fit reference when possible so extra room and length can be planned deliberately.' },
      { question: 'Can an oversized varsity jacket still have fitted cuffs?', answer: 'Yes. Ribbed cuffs and waistbands can frame a roomy body and sleeves while keeping the classic varsity finish.' },
      { question: 'Which material works best for an oversized fit?', answer: 'Wool and leather create more structure, while satin, cotton twill, and fleece offer lighter or softer drape. The best choice depends on season and styling.' },
      { question: 'Can I add large back patches and sleeve details?', answer: 'Yes. Artwork is reviewed against panel size, seams, pockets, and rib trim, then shown on the free mockup before production.' },
      { question: 'Is there a minimum order?', answer: 'No. You can request one oversized varsity jacket or ask for bulk pricing for a coordinated group or brand order.' },
      { question: 'Will I approve the fit and design before production?', answer: 'You will receive a free design mockup for visual details. Measurements and the chosen size or fit specification should also be confirmed before production.' },
    ],
    guides: [{ title: 'Varsity jacket sizing guide', slug: 'varsity-jacket-size-guide' }, { title: 'What to put on a varsity jacket', slug: 'what-to-put-on-a-varsity-jacket' }, commonGuides[0]],
  },
  'vintage-varsity-jackets': {
    path: '/varsity-jackets/vintage', keyword: 'Vintage Varsity Jackets', title: 'Vintage Varsity Jackets | Retro Custom Designs | Jacketee',
    description: 'Create a vintage varsity jacket with retro colors, chenille patches and custom embroidery. Get a free design mockup and order one or in bulk.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Build a vintage varsity jacket inspired by classic school, athletic, and mid-century teamwear. Select the materials, aged or heritage color direction, chenille lettering, names, and embroidery, then review a free mockup before the jacket enters production.',
    optionsIntro: 'A convincing vintage direction comes from the complete combination of shape, material, color, lettering, and restraint. It does not require copying an existing trademark or pretending a newly made jacket is an antique.',
    options: [
      { title: 'Heritage construction', text: 'Use a wool body with leather or faux-leather sleeves for a traditional letterman profile, or consider satin and lighter fabrics for retro athletic styling.' },
      { title: 'Period-aware color', text: 'Combine school colors, off-white accents, striped rib trim, and thread tones with enough contrast to remain readable and intentional.' },
      { title: 'Chenille and lettering', text: 'Plan a chest letter, mascot, year, number, name, award bars, or back identity using artwork that evokes the era without using protected marks without permission.' },
    ],
    audienceIntro: 'Vintage-inspired varsity jackets work for alumni groups, school programs, reunions, clubs, creative productions, fashion labels, and individuals. Shared colors can unify a group while years, names, and earned details keep each jacket personal.',
    guideTitle: 'Create a retro jacket without losing clarity',
    guide: [
      'Choose the era and reference points first. A traditional school letterman jacket, a satin athletic jacket, and a modern retro streetwear piece are related but visually different. Identify the collar, waistband, sleeve treatment, pocket shape, and overall fit that matter most. Current products provide practical starting constructions, and the final design can then focus on color and decoration rather than an unclear request to make everything look old.',
      'Classic wool with contrasting sleeves gives chenille letters a substantial backdrop. Satin creates shine and a lighter sports feel, while cotton twill can suit warmer conditions. Vintage color does not have to mean faded production. Deep school colors, cream accents, striped ribbing, and period-style typography can communicate heritage while the materials remain new and serviceable. Any distressed or aged effect should be discussed and confirmed for the selected material.',
      'Use meaningful decoration sparingly. A primary chest letter, graduation year, small name, sleeve number, and back mascot each compete for attention. Decide which detail leads and leave clear space around it. Supply original artwork or marks you are authorized to use. Jacketee translates the approved arrangement into a free mockup so spelling, proportion, placement, and thread or patch colors can be checked together.',
      'Individual orders have no minimum. Schools, alumni groups, productions, and clothing brands can also request coordinated quantities with controlled personalization. Final price depends on construction, material, patch and embroidery count, artwork complexity, and quantity. Production timing is confirmed for the approved design and delivery location. The result is a newly made custom jacket with a considered vintage influence, not an unsupported claim of historical origin.',
    ],
    faqs: [
      { question: 'Are these original vintage jackets?', answer: 'No. These are newly made custom jackets designed with vintage-inspired materials, colors, lettering, and varsity details.' },
      { question: 'Which construction looks most traditional?', answer: 'A wool body with contrasting leather or faux-leather sleeves is the familiar letterman combination, often finished with striped rib trim and chenille.' },
      { question: 'Can you reproduce an old school jacket?', answer: 'A reference can guide the design, but you should have permission to use school, team, brand, or other protected artwork.' },
      { question: 'Can I add a graduation year and name?', answer: 'Yes. Years, names, numbers, letters, mascots, award details, and back artwork can be planned together.' },
      { question: 'Do I receive a mockup first?', answer: 'Yes. A free mockup is provided so you can approve the visible design details before production.' },
      { question: 'Can I order one vintage-inspired varsity jacket?', answer: 'Yes. There is no minimum order, and bulk quotes are also available for groups and brands.' },
    ],
    guides: [{ title: 'Varsity jacket vs letterman jacket', slug: 'varsity-jacket-vs-letterman-jacket' }, { title: 'Letterman patches explained', slug: 'letterman-patches-chenille-embroidery-guide' }, commonGuides[0]],
  },
  'sorority-fraternity-jackets': {
    path: '/bulk-orders/sorority-fraternity', keyword: 'Sorority and Fraternity Jackets', title: 'Custom Sorority & Fraternity Jackets | Jacketee',
    description: 'Plan custom sorority and fraternity jackets with Greek letters, chapter details and names. Get group pricing and approve a free mockup before production.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Create coordinated sorority and fraternity jackets for chapter members, new-member classes, alumni, service events, and milestone celebrations. Choose the jacket, colors, authorized letters, names, and chapter details, then approve a free group mockup before production.',
    optionsIntro: 'Greek organization apparel carries identity and responsibility. A chapter order should follow the organization’s current brand, licensing, and approval requirements while making every name, line name, number, and initiation detail accurate.',
    options: [
      { title: 'Authorized letters and marks', text: 'Provide approved artwork and confirm permission for Greek letters, crests, chapter names, mottos, and other protected organization identifiers.' },
      { title: 'Member personalization', text: 'Plan individual names, line names, numbers, roles, initiation years, or chapter details in a controlled spreadsheet to reduce transcription errors.' },
      { title: 'Shared jacket standard', text: 'Set one body, sleeve, rib, lining, and decoration specification so the chapter looks unified even when selected details differ by member.' },
    ],
    audienceIntro: 'This ordering path supports collegiate and alumni chapters, councils, service groups, step teams, and authorized campus organizations. One coordinator can manage the common design while each member confirms size and approved personalization.',
    guideTitle: 'Coordinate a chapter order responsibly',
    guide: [
      'Begin with authorization. Many Greek-letter organizations control how their names, letters, crests, colors, and symbols may be reproduced. Confirm chapter and national requirements before submitting artwork, and use a licensed process where required. Jacketee can manufacture from approved instructions, but the ordering group remains responsible for its right to use supplied marks. This early check prevents a polished design from reaching approval with artwork that cannot be used.',
      'Next, establish the shared specification. Choose a varsity, bomber, coach, denim, or other suitable jacket; confirm materials and colors; and define the standard front, back, and sleeve placements. Decide which elements belong on every jacket and which are personal. A consistent master design gives the chapter a recognizable identity and makes it easier to review variations without rebuilding each jacket from scratch.',
      'Collect member information in one verified roster. Include the exact spelling, capitalization, size, line name or number, role, initiation year, and any optional decoration for each person. Ask members to approve their own row before the coordinator submits the final list. Jacketee’s free mockup provides the visual reference for common artwork; personalization data must also be checked carefully because production follows the approved information.',
      'Pricing depends on jacket construction, materials, quantity, decoration methods, placement count, and the amount of unique personalization. There is no minimum order, although a coordinated quantity may qualify for project pricing. The production and delivery schedule is confirmed after artwork, roster, quantities, and destination are settled. Build in chapter approval time and avoid planning around an unconfirmed event deadline.',
    ],
    faqs: [
      { question: 'Can you make jackets with Greek letters?', answer: 'Yes, when the customer provides authorized artwork and has the required permission or licensing to use the organization’s letters and marks.' },
      { question: 'Can every member have a different name or line number?', answer: 'Yes. Individual details can vary while the jacket construction and main chapter design remain consistent.' },
      { question: 'Who should approve a chapter order?', answer: 'Use one coordinator and follow any chapter, national organization, campus, or licensing approval process that applies to the marks.' },
      { question: 'Is there a minimum quantity?', answer: 'No. One jacket is welcome, and coordinated groups can request pricing for their total quantity.' },
      { question: 'Do we see a design before production?', answer: 'Yes. Jacketee supplies a free mockup for review. The chapter should also verify the final member roster and personalization.' },
      { question: 'What determines the group price?', answer: 'Construction, materials, total quantity, decoration techniques, number of placements, and unique member details determine the quote.' },
    ],
    guides: [{ title: 'How to order custom jackets for a group', slug: 'how-to-order-custom-jackets-for-a-group' }, { title: 'How to write a clear design brief', slug: 'how-to-write-design-brief-custom-jacket-order' }, commonGuides[2]],
  },
  'senior-class-jackets': {
    path: '/bulk-orders/senior-class', keyword: 'Senior Class Jackets', title: 'Custom Senior Class Jackets | Class of 2027 | Jacketee',
    description: 'Create senior class jackets for the Class of 2027 with school colors, names, years and patches. Approve a free mockup and request group pricing.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Plan senior class jackets for the Class of 2027 or any graduating year with school colors, class identity, student names, activities, and achievement details. Create one coordinated design, collect verified sizes, and approve a free mockup before production.',
    optionsIntro: 'A senior jacket should represent the whole class while leaving room for individual stories. Separate the common school and graduation elements from optional names, numbers, activities, and earned awards.',
    options: [
      { title: 'Class identity', text: 'Build the shared design around the graduation year, school colors, approved name or mascot, and a clear front-to-back artwork hierarchy.' },
      { title: 'Student details', text: 'Add verified student names, nicknames, numbers, activities, positions, award bars, or sleeve details using one controlled order roster.' },
      { title: 'Inclusive sizing', text: 'Share the size guide early, collect measurements before the deadline, and account for desired layering or relaxed-fit preferences.' },
    ],
    audienceIntro: 'Senior class jackets can serve a full graduating class, a smaller committee, student council, club, sports program, or an individual student. Schools can keep one approved standard while allowing selected personal details.',
    guideTitle: 'Keep the Class of 2027 order organized',
    guide: [
      'Start with the school approval process and calendar. Confirm who may authorize the school name, mascot, crest, and colors, then identify the date by which the jackets are genuinely needed. Work backward to allow time for design review, student sign-off, payment or purchase-order administration, production, and delivery. The final schedule is project-specific, so an event date should not be announced until Jacketee has confirmed it against the approved specification.',
      'Create one master design for the class. Choose the jacket construction and materials, then place the graduation year, school identity, and shared artwork. Keep the most important element prominent and avoid filling every available panel. The patches and embroidery guide can help the committee decide which details need dimensional chenille, direct embroidery, or another technique. Only submit school or third-party marks that the group is authorized to reproduce.',
      'Use a structured roster for student variations. Each row should include the student’s exact display name, size, number, activities, role, and selected optional details. Set a firm correction deadline and ask every student to verify spelling and sizing. The free mockup confirms the common visual design, while the final roster controls personalization. One designated coordinator should submit approved revisions to avoid conflicting instructions from multiple people.',
      'Jacketee has no minimum order, so a student can order individually and a school can also request a class quote. Price changes with jacket material, quantity, decoration count, artwork method, and personalization. A complete roster produces a more reliable quote than an estimate based only on class size. For later additions, ask whether the original specification can be repeated and expect separate timing or pricing to apply.',
    ],
    faqs: [
      { question: 'Can these jackets be made for the Class of 2027?', answer: 'Yes. The graduation year, school colors, approved artwork, names, activities, and other class details can be incorporated.' },
      { question: 'Can each senior have different personalization?', answer: 'Yes. Names, numbers, activities, positions, and selected patches can vary within a shared class design.' },
      { question: 'How should a school collect sizes?', answer: 'Share the Jacketee size guide, collect body measurements and fit preferences, and have each student verify the submitted size before the deadline.' },
      { question: 'Is school approval required?', answer: 'The ordering group should follow its school’s approval rules and confirm permission to reproduce names, mascots, crests, or other protected marks.' },
      { question: 'Is there a minimum order?', answer: 'No. Individual and class orders are both accepted, with project pricing based on the final specification and quantity.' },
      { question: 'Will the class see a mockup?', answer: 'A free mockup is provided before production. One coordinator should consolidate school and student feedback into the final approval.' },
    ],
    guides: [{ title: 'How to order custom jackets for a group', slug: 'how-to-order-custom-jackets-for-a-group' }, { title: 'Letterman patches explained', slug: 'letterman-patches-chenille-embroidery-guide' }, commonGuides[2]],
  },
  'cheer-jackets': {
    path: '/bulk-orders/cheer', keyword: 'Custom Cheer Jackets', title: 'Custom Cheer Jackets for Teams | Jacketee',
    description: 'Design custom cheer jackets with team colors, logos, names and graduation years. Approve a free mockup before production and request team pricing.',
    categorySlug: 'varsity-jackets', categoryHref: '/varsity-jackets',
    intro: 'Design custom cheer jackets for school squads, competition teams, coaches, and supporters. Coordinate team colors, approved logos, names, positions, and graduation years on one practical outerwear specification, then approve a free mockup before production.',
    optionsIntro: 'Cheer outerwear needs to support travel, sidelines, events, and everyday school wear. Start with climate and movement, then balance visible team identity with accurate individual details.',
    options: [
      { title: 'Team-first artwork', text: 'Place the approved team name, initials, mascot, or logo where it reads clearly, with thread and patch colors matched to the agreed palette.' },
      { title: 'Athlete personalization', text: 'Add names, captain or coach roles, graduation years, numbers, or competition details from a roster verified by the team coordinator.' },
      { title: 'Practical construction', text: 'Compare structured varsity materials with lighter satin, coach, bomber, fleece, or puffer options according to weather, travel, and layering needs.' },
    ],
    audienceIntro: 'Custom cheer jackets can be coordinated for youth, school, collegiate, all-star, and recreational squads, as well as coaches and approved supporter groups. The core design stays recognizable while roles and names can vary.',
    guideTitle: 'Build a team jacket for the full season',
    guide: [
      'Define when and where the team will wear the jacket. A structured varsity jacket creates a traditional school look, while satin or coach styles may feel lighter for travel and events. Fleece can add softness, and insulated options may suit colder sidelines. Consider uniforms and warm layers underneath when choosing sizes. The best team jacket is not only photogenic; it should be comfortable during the situations already on the squad calendar.',
      'Establish an approved visual system before collecting individual requests. Confirm the exact team colors, authorized logo or mascot files, preferred decoration technique, and standard placements. Decide whether athletes, coaches, and supporters will share one design or use clearly related versions. Customers are responsible for permission to reproduce school, league, sponsor, or third-party marks, so secure that approval before the mockup is treated as final.',
      'Gather personalization in one roster with exact spelling, capitalization, size, role, graduation year, and optional details. Ask every wearer to review their information and appoint one coordinator to communicate revisions. Jacketee provides a free visual mockup of the design before production; the roster still needs its own careful sign-off. This workflow keeps the team involved without allowing multiple versions of the order to circulate.',
      'There is no minimum order, and a squad can request pricing for its combined quantity. The quote reflects the selected jacket, materials, artwork method, number of placements, personalization, and total units. Production and delivery timing are confirmed after approval and destination details are complete. Allow a planning margin before competitions, senior night, travel, or presentation dates instead of relying on an unconfirmed deadline.',
    ],
    faqs: [
      { question: 'Can every cheerleader have their name on the jacket?', answer: 'Yes. Names, roles, graduation years, numbers, and other approved personal details can vary within the team design.' },
      { question: 'Which jacket style is best for cheer teams?', answer: 'Varsity jackets provide a classic school look, while coach, bomber, fleece, satin, or insulated styles may suit different climates and uses.' },
      { question: 'Can coaches order matching jackets?', answer: 'Yes. Coaches can share the team colors and artwork with role-specific wording or a related version of the design.' },
      { question: 'Can we use our school mascot?', answer: 'Yes, provided the ordering group has permission to reproduce the school, team, league, sponsor, or other protected artwork.' },
      { question: 'Do cheer jacket orders have a minimum?', answer: 'No. Jacketee accepts individual orders and can quote the final quantity for a complete squad.' },
      { question: 'Can we approve the design before production?', answer: 'Yes. A free mockup is supplied for design approval, and the team should separately verify every size and personalization entry.' },
    ],
    guides: [{ title: 'How to order custom jackets for a group', slug: 'how-to-order-custom-jackets-for-a-group' }, { title: 'How to write a clear design brief', slug: 'how-to-write-design-brief-custom-jacket-order' }, commonGuides[0]],
  },
}

export function getCustomLandingConfig(key: string) {
  return CUSTOM_JACKET_LANDINGS[key]
}
