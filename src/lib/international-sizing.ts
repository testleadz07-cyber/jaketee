// Checked against the official guides on 2026-10-10.
// These are brand reference body measurements, not Jacketee garment specifications.
export type SizeFit = 'male' | 'female'
export interface InternationalSizeRow {
  size: string
  us: string
  uk: string
  eu: string
  chestCm: [number, number]
  waistCm: [number, number]
  hipCm?: [number, number]
}

export const internationalSizing = {
  male: {
    source: 'Belstaff',
    url: 'https://belstaff.com/en-us/pages/customer-service-size-guide',
    europeanLabel: 'EU / Italy',
    rows: [
      { size: 'XS', us: '34', uk: '34', eu: '44', chestCm: [90, 90], waistCm: [78.5, 78.5] },
      { size: 'S', us: '36–38', uk: '36–38', eu: '46–48', chestCm: [94, 98], waistCm: [82.5, 86.5] },
      { size: 'M', us: '38–40', uk: '38–40', eu: '48–50', chestCm: [98, 102], waistCm: [86.5, 90.5] },
      { size: 'L', us: '40–42', uk: '40–42', eu: '50–52', chestCm: [102, 106], waistCm: [90.5, 94.5] },
      { size: 'XL', us: '42–44', uk: '42–44', eu: '52–54', chestCm: [106, 110], waistCm: [94.5, 98.5] },
      { size: '2XL', us: '44–46', uk: '44–46', eu: '54–56', chestCm: [110, 114], waistCm: [98.5, 102.5] },
      { size: '3XL', us: '46–48', uk: '46–48', eu: '56–58', chestCm: [114, 118], waistCm: [102.5, 106.5] },
    ] satisfies InternationalSizeRow[],
  },
  female: {
    source: 'Barbour',
    url: 'https://www.barbour.com/us/customer_service/size-and-fit-guides.html',
    europeanLabel: 'EU (source labels)',
    rows: [
      { size: 'XS', us: '4', uk: '8', eu: '36', chestCm: [83, 88], waistCm: [67, 72], hipCm: [92, 97] },
      { size: 'S', us: '6', uk: '10', eu: '38', chestCm: [88, 93], waistCm: [72, 77], hipCm: [97, 102] },
      { size: 'M', us: '8', uk: '12', eu: '40', chestCm: [93, 98], waistCm: [77, 82], hipCm: [102, 107] },
      { size: 'L', us: '10', uk: '14', eu: '42', chestCm: [98, 103], waistCm: [82, 87], hipCm: [107, 112] },
      { size: 'XL', us: '12', uk: '16', eu: '44', chestCm: [103, 108], waistCm: [87, 92], hipCm: [112, 117] },
      { size: '2XL', us: '14', uk: '18', eu: '46', chestCm: [108, 113], waistCm: [92, 97], hipCm: [117, 122] },
    ] satisfies InternationalSizeRow[],
  },
}

export function formatInternationalRange(range: [number, number], unit: 'in' | 'cm') {
  const values = range.map(value => String(Number((unit === 'in' ? value / 2.54 : value).toFixed(2))))
  return values[0] === values[1] ? values[0] : values.join('–')
}
