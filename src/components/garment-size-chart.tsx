import { bodyRows, jacketRows, format, formatRange, type Unit } from '@/lib/jacket-sizing'
import { InternationalSizeChart } from '@/components/international-size-chart'

export function GarmentSizeChart({ kind, unit }: { kind: 'jacket' | 'vest'; unit: Unit }) {
  const isVest = kind === 'vest'
  return <div className="space-y-4">
    <InternationalSizeChart unit={unit} />
    <p className="text-sm leading-6 text-muted-foreground">{isVest
      ? 'Reference body measurements for vest sizing. These are the same chest and waist ranges used on our full size-guide page. Confirm the finished dimensions for your chosen vest before ordering.'
      : 'The same reference measurements shown on our full size-guide page. Body chest and waist are circumferences; finished jacket chest is a flat width. Confirm the fit for your chosen style before ordering.'}</p>
    <div className="max-w-full overflow-x-auto" role="region" aria-label={`${isVest ? 'Vest' : 'Jacket'} reference body chart`} tabIndex={0}>
      <table className="w-full text-left text-sm">
        <caption className="pb-2 text-left font-semibold">Reference body measurements ({unit})</caption>
        <thead><tr>{['Size', 'Chest', 'Waist', ...(!isVest ? ['Sleeve', 'Back length'] : [])].map(label => <th key={label} scope="col" className="whitespace-nowrap border-b px-3 py-3">{label}</th>)}</tr></thead>
        <tbody>{bodyRows.filter(row => !isVest || !row.size.includes('Tall')).map(row => <tr key={row.size} className="border-b">
          <th scope="row" className="whitespace-nowrap px-3 py-3">{row.size}</th>
          <td className="whitespace-nowrap px-3 py-3">{formatRange(row.chest, unit)}</td><td className="whitespace-nowrap px-3 py-3">{formatRange(row.waist, unit)}</td>
          {!isVest && <><td className="whitespace-nowrap px-3 py-3">{formatRange(row.sleeve, unit)}</td><td className="whitespace-nowrap px-3 py-3">{format(row.back, unit)}</td></>}
        </tr>)}</tbody>
      </table>
    </div>
    {!isVest && <div className="max-w-full overflow-x-auto" role="region" aria-label="Finished jacket reference chart" tabIndex={0}>
      <table className="w-full text-left text-sm">
        <caption className="pb-2 text-left font-semibold">Reference finished jacket measurements ({unit})</caption>
        <thead><tr>{['Size', 'Chest, flat', 'Sleeve', 'Across shoulder', 'Half shoulder', 'Back length'].map(label => <th key={label} scope="col" className="whitespace-nowrap border-b px-3 py-3">{label}</th>)}</tr></thead>
        <tbody>{jacketRows.map(row => <tr key={row.size} className="border-b"><th scope="row" className="whitespace-nowrap px-3 py-3">{row.size}</th>{[row.chestFlat, row.sleeve, row.shoulder, row.halfShoulder, row.back].map((value, index) => <td key={index} className="whitespace-nowrap px-3 py-3">{format(value, unit)}</td>)}</tr>)}</tbody>
      </table>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Double the flat chest width for garment circumference. Half shoulder is a separate reference measurement; confirm its measuring points with our team. Tall sizes are available only where specified for a product.</p>
    </div>}
  </div>
}
