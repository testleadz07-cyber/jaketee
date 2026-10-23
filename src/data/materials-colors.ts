const legacyAssetBrand = ['clo', 'thaa'].join('')
const legacyAltAssetBrand = ['Clo', 'thoo'].join('')
const assetFolder = `${legacyAssetBrand}/exports/materials-colors`
const cloudinaryAsset = (version: number, fileName: string) =>
  `https://res.cloudinary.com/dhdfbl8pc/image/upload/v${version}/${assetFolder}/${fileName}`

export const materialsHeroImage = cloudinaryAsset(1788899355, `${legacyAssetBrand}-materials-colors-for-custom-jackets.jpg`)

export type Swatch = {
  name: string
  hex: string
}

export type Material = {
  id: string
  name: string
  image: string
  texture: string
  alt: string
  textureAlt?: string
  climate: string
  colors: string
  features: string[]
  text: string
  cta: string
  href: string
  swatchSet?: string
  swatches?: Swatch[]
}

const commonSwatches: Swatch[] = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Cream', hex: '#fffed0' },
  { name: 'Beige', hex: '#d1c4a4' },
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Grey', hex: '#565656' },
  { name: 'Light Grey', hex: '#99999a' },
  { name: 'Forest Green', hex: '#174633' },
  { name: 'Kelly Green', hex: '#44883e' },
  { name: 'Olive', hex: '#4f583d' },
  { name: 'Navy Blue', hex: '#152347' },
  { name: 'Royal Blue', hex: '#1a4096' },
  { name: 'Sky Blue', hex: '#83c2e7' },
  { name: 'Teal Blue', hex: '#005355' },
  { name: 'Dark Purple', hex: '#3b275b' },
  { name: 'Hot Pink', hex: '#dd1d58' },
  { name: 'Baby Pink', hex: '#fed0e4' },
  { name: 'Dark Maroon', hex: '#601f2a' },
  { name: 'Light Maroon', hex: '#a01526' },
  { name: 'Red', hex: '#e00000' },
  { name: 'Orange', hex: '#e95926' },
  { name: 'Athletic Gold', hex: '#ffb81c' },
  { name: 'Old Gold', hex: '#b7923e' },
  { name: 'Yellow', hex: '#eadc32' },
  { name: 'Dark Brown', hex: '#81533f' },
  { name: 'Camel Brown', hex: '#9f885e' },
]

const leatherExtraSwatches: Swatch[] = [
  { name: 'Salmon', hex: '#eaa794' },
  { name: 'Light Aqua', hex: '#3aa9b2' },
  { name: 'Lavender', hex: '#c1a7e2' },
  { name: 'Vegas Gold', hex: '#c5b783' },
  { name: 'Light Brown', hex: '#9b7f6f' },
  { name: 'Tan', hex: '#a0522d' },
]

const swatchLookup = [...commonSwatches, ...leatherExtraSwatches].reduce<Record<string, Swatch>>(
  (acc, swatch) => {
    acc[swatch.name.toLowerCase()] = swatch
    return acc
  },
  {}
)

export const materials: Material[] = [
  {
    id: 'melton-wool',
    name: 'Melton Wool',
    image: cloudinaryAsset(1788899363, `melton-wool-fabric-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899364, 'melton-wool-texture.png'),
    alt: 'Melton wool for custom jackets',
    climate: 'Cold',
    colors: '25 shades',
    features: ['Durable', 'Wind Resistant', 'Classic Style'],
    text: 'Jacketee uses 24oz melton wool for varsity jackets. It is durable, warm, and maintains its shape over years of wear.',
    cta: 'Shop Melton Wool Jackets',
    href: '/varsity-jackets/all-wool',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'cowhide-leather',
    name: 'Cowhide Leather',
    image: cloudinaryAsset(1788899360, `cowhide-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899361, 'cowhide-leather-texture.png'),
    alt: 'Cowhide leather for custom jackets',
    climate: 'All-Season',
    colors: '31 shades',
    features: ['Durable', 'Smooth Feel', 'Classic Look'],
    text: 'Cowhide leather is a signature material for bomber and varsity sleeves. It offers natural durability, a smooth finish, and lasting appeal.',
    cta: 'Shop Cowhide Leather Jackets',
    href: '/bomber-jackets',
    swatchSet: 'commonSwatches + leatherExtraSwatches',
  },
  {
    id: 'sheep-leather',
    name: 'Sheep Leather',
    image: cloudinaryAsset(1788899373, `sheepskin-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899371, 'sheep-leather-texture.png'),
    alt: 'Sheep leather for custom jackets',
    climate: 'Mild to Cold',
    colors: '21 shades',
    features: ['Lightweight', 'Soft Touch', 'Flexible'],
    text: 'Sheep leather is soft and lightweight, giving premium jackets a smooth finish with comfortable flexibility.',
    cta: 'Shop Sheep Leather Jackets',
    href: '/varsity-jackets/all-leather',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Olive, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange, Athletic Gold, Light Brown, Tan',
  },
  {
    id: 'faux-leather',
    name: 'Faux Leather',
    image: cloudinaryAsset(1788899366, `PU-faux-vegan-leather-for-jackets-closeup-${legacyAltAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899362, 'faux-leather-texture.png'),
    alt: 'Faux leather for custom jackets',
    climate: 'All-Season',
    colors: '17 shades',
    features: ['Vegan', 'Cost-Effective', 'Durable'],
    text: 'Faux leather is a vegan-friendly alternative to genuine leather. It is durable, versatile, and popular for fashion jackets.',
    cta: 'Shop Faux Leather Jackets',
    href: '/varsity-jackets/faux-leather',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange',
  },
  {
    id: 'polyester-satin',
    name: 'Polyester Satin',
    image: cloudinaryAsset(1788899368, `satin-fabric-for-jackets-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899369, 'satin-fabric-texture.png'),
    alt: 'Polyester satin for custom jackets',
    climate: 'Mild',
    colors: '29 shades',
    features: ['Glossy', 'Lightweight', 'Vibrant Colors'],
    text: 'Polyester satin is glossy, smooth, and lightweight. It is ideal for souvenir, baseball, and statement jackets.',
    cta: 'Shop Polyester Satin Jackets',
    href: '/varsity-jackets/satin',
    swatchSet: 'commonSwatches + Light Aqua, Lavender, Vegas Gold, Light Brown',
  },
  {
    id: 'cotton-fleece',
    name: 'Cotton Fleece',
    image: cloudinaryAsset(1788899356, `cotton-fleece-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899357, 'cotton-fleece-fabric-texture.png'),
    alt: 'Cotton fleece for custom jackets',
    climate: 'Cool Weather',
    colors: '25 shades',
    features: ['Warm', 'Soft', 'Breathable'],
    text: 'Cotton fleece is soft, warm, and breathable, making it a practical choice for hoodies and casual letterman jackets.',
    cta: 'Shop Cotton Fleece Hoodies',
    href: '/fleece-hoodies',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'cotton-twill',
    name: 'Cotton Twill',
    image: cloudinaryAsset(1788899358, `cotton-twill-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899359, 'cotton-twill-fabric-texture.png'),
    alt: 'Cotton twill for custom jackets',
    climate: 'All-Season',
    colors: '25 shades',
    features: ['Sturdy', 'Wrinkle-Resistant', 'Everyday Wear'],
    text: 'Cotton twill is sturdy and wrinkle-resistant, a strong fit for coach jackets, work jackets, and daily outerwear.',
    cta: 'Shop Cotton Twill Jackets',
    href: '/coach-jackets',
    swatchSet: 'commonSwatches',
  },
  {
    id: 'soft-shell',
    name: 'Soft-Shell',
    image: cloudinaryAsset(1788899379, `softshell-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899381, 'softshell-fabric-texture.png'),
    alt: 'Soft-shell fabric for custom jackets',
    climate: 'Cold & Windy',
    colors: '21 shades',
    features: ['Outdoor Ready', 'Wind Resistant', 'Water Repellent'],
    text: 'Soft-shell fabric combines performance and comfort, making it useful for outdoor jackets and team gear.',
    cta: 'Shop Soft-Shell Jackets',
    href: '/bomber-jackets',
    swatchSet:
      'White, Cream, Beige, Black, Dark Grey, Light Grey, Forest Green, Kelly Green, Olive, Navy Blue, Royal Blue, Sky Blue, Hot Pink, Baby Pink, Dark Maroon, Light Maroon, Red, Orange, Athletic Gold, Old Gold, Yellow',
  },
  {
    id: 'nylon-twill',
    name: 'Nylon Twill',
    image: cloudinaryAsset(1788899365, `nylon-twill-fabric-for-jackets-closeup-${legacyAssetBrand}.webp`),
    texture: cloudinaryAsset(1788899365, 'nylon-twill-fabric-texture.png'),
    alt: 'Nylon twill for custom jackets',
    climate: 'All-Season',
    colors: '13 shades',
    features: ['Lightweight', 'Water-Resistant', 'Durable'],
    text: 'Nylon twill is lightweight and water-resistant, widely used for coach jackets and easy daily wear.',
    cta: 'Shop Nylon Twill Jackets',
    href: '/coach-jackets',
    swatchSet:
      'White, Black, Light Grey, Olive, Navy Blue, Royal Blue, Light Aqua, Dark Maroon, Red, Orange, Athletic Gold, Yellow, Dark Brown',
  },
  {
    id: 'suede-leather',
    name: 'Suede Leather',
    image: cloudinaryAsset(1788899382, `suede-leather-closeup-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899383, 'suede-leather-texture.png'),
    alt: 'Suede leather for custom jackets',
    climate: 'Mild',
    colors: '8 shades',
    features: ['Soft Texture', 'Casual Style', 'Fashion-Forward'],
    text: 'Suede leather has a soft, textured finish that adds a relaxed, fashion-forward look to custom jackets.',
    cta: 'Shop Suede Leather Jackets',
    href: '/bomber-jackets',
    swatchSet: 'White, Black, Light Grey, Forest Green, Navy Blue, Royal Blue, Sky Blue, Red',
  },
  {
    id: 'snaps-zips',
    name: 'Snaps & Zips',
    image: cloudinaryAsset(1788899385, `zip-snaps-for-varsity-jackets-${legacyAssetBrand}.jpg`),
    texture: cloudinaryAsset(1788899361, 'cowhide-leather-texture.png'),
    alt: 'Snaps and zippers for varsity jackets',
    climate: 'All-Season',
    colors: 'Custom finishes',
    features: ['Functional', 'Rust-Resistant', 'Custom Finish'],
    text: 'High-quality snaps and zippers complete every varsity jacket, bomber jacket, and custom team order.',
    cta: 'Start Customizing',
    href: '/design/varsity',
    swatches: [
      { name: 'Silver', hex: '#cbd5e1' },
      { name: 'Antique Brass', hex: '#9a6a2f' },
      { name: 'Black', hex: '#111827' },
      { name: 'White', hex: '#ffffff' },
    ],
  },
]

export const materialComparison = [
  ['Melton Wool', 'High', 'High', 'Medium', 'Varsity Jackets', 'Cold Weather'],
  ['Cowhide Leather', 'Medium', 'Very High', 'Heavy', 'Bomber Jackets', 'Cool to Cold'],
  ['Sheep Leather', 'Medium-High', 'High', 'Light-Medium', 'Premium Jackets', 'Mild to Cold'],
  ['Faux Leather', 'Low-Medium', 'Medium', 'Light', 'Vegan Options', 'All-Season'],
  ['Polyester Satin', 'Low', 'Medium', 'Very Light', 'Baseball Jackets', 'Mild Weather'],
  ['Cotton Fleece', 'Medium', 'Medium', 'Medium', 'Hoodies', 'Cool Weather'],
  ['Soft-Shell', 'Medium', 'High', 'Medium', 'Outdoor Jackets', 'Cold & Windy'],
  ['Nylon Twill', 'Low', 'Medium', 'Very Light', 'Coach Jackets', 'All-Season'],
]

export const faqs = [
  {
    question: 'What jacket materials are available?',
    answer:
      'We offer melton wool, cowhide leather, sheep leather, faux leather, satin, fleece, cotton twill, soft-shell, nylon, suede, plus snaps and zippers.',
  },
  {
    question: 'How many jacket colors can I choose from?',
    answer:
      `The color explorer shows the complete reference range listed for each material. Wool currently has ${getSwatches(materials.find(material => material.id === 'melton-wool')!).length} reference shades and cowhide leather has ${getSwatches(materials.find(material => material.id === 'cowhide-leather')!).length}. Ranges differ by material; availability and the actual shade are confirmed for your chosen jacket.`,
  },
  {
    question: 'Which material is best for varsity jackets?',
    answer:
      'Melton wool with leather sleeves is the traditional choice for varsity jackets. Satin and fleece are good lighter-weight options.',
  },
  {
    question: 'What are the most popular bomber jacket colors?',
    answer:
      'Black, olive, navy, burgundy, and brown are popular bomber jacket colors. Custom shades are also available depending on material.',
  },
  {
    question: 'Can I match school or team colors?',
    answer:
      'Share your school or brand color references so the team can discuss the closest suitable fabric and finish. The same color name on wool and leather may look different. Confirm the intended match before production.',
  },
  {
    question: 'How do I care for different jacket materials?',
    answer:
      'Follow the care instructions for the complete jacket, including its body, sleeves, lining and decoration. Wool, genuine leather, faux leather, satin and fleece can need different treatment. Ask the team before washing, applying heat or using a leather conditioner on your selected garment.',
  },
]

export function getSwatches(material: Material): Swatch[] {
  if (material.swatches) return material.swatches
  if (material.swatchSet === 'commonSwatches') return commonSwatches
  if (material.swatchSet === 'commonSwatches + leatherExtraSwatches') {
    return [...commonSwatches, ...leatherExtraSwatches]
  }
  if (!material.swatchSet) return []

  const names = material.swatchSet
    .replace('commonSwatches +', commonSwatches.map((swatch) => swatch.name).join(',') + ',')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return names.map((name) => swatchLookup[name.toLowerCase()]).filter(Boolean)
}

