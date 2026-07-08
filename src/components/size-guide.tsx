'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Ruler, Info } from 'lucide-react'

type UnitSystem = 'in' | 'cm'

const inToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10

function Measurement({ value, unit }: { value: number; unit: UnitSystem }) {
  return <>{unit === 'in' ? `${value}"` : `${inToCm(value)} cm`}</>
}

// Tops / dresses / outerwear / activewear — letter sizing
const TOPS_CHART = [
  { size: 'XS', us: '0-2', uk: '4-6', eu: '32-34', bust: 32, waist: 24.5, hips: 34.5 },
  { size: 'S', us: '4-6', uk: '8-10', eu: '36-38', bust: 34.5, waist: 27, hips: 37 },
  { size: 'M', us: '8-10', uk: '12-14', eu: '40-42', bust: 37, waist: 29.5, hips: 39.5 },
  { size: 'L', us: '12-14', uk: '16-18', eu: '44-46', bust: 40, waist: 32.5, hips: 42.5 },
  { size: 'XL', us: '16-18', uk: '20-22', eu: '48-50', bust: 43.5, waist: 36, hips: 46 },
  { size: 'XXL', us: '20-22', uk: '24-26', eu: '52-54', bust: 47, waist: 39.5, hips: 49.5 },
]

// Bottoms — numeric waist sizing
const BOTTOMS_CHART = [
  { size: '24', us: '00', uk: '4', eu: '32', waist: 24, hips: 34 },
  { size: '26', us: '2', uk: '6', eu: '34', waist: 26, hips: 36 },
  { size: '28', us: '4', uk: '8', eu: '36', waist: 28, hips: 38 },
  { size: '30', us: '6', uk: '10', eu: '38', waist: 30, hips: 40 },
  { size: '32', us: '8-10', uk: '12', eu: '40', waist: 32, hips: 42 },
  { size: '34', us: '12', uk: '14', eu: '42', waist: 34, hips: 44 },
  { size: '36', us: '14', uk: '16', eu: '44', waist: 36, hips: 46 },
]

// Footwear — US/UK/EU/CM, men's and women's
const SHOES_CHART = [
  { usW: '5', usM: '3.5', uk: '3', eu: '35-36', cm: 22.0 },
  { usW: '6', usM: '4.5', uk: '4', eu: '36-37', cm: 22.8 },
  { usW: '7', usM: '5.5', uk: '5', eu: '37-38', cm: 23.5 },
  { usW: '8', usM: '6.5', uk: '6', eu: '38-39', cm: 24.1 },
  { usW: '9', usM: '7.5', uk: '7', eu: '40-41', cm: 24.8 },
  { usW: '10', usM: '8.5', uk: '8', eu: '41-42', cm: 25.4 },
  { usW: '11', usM: '9.5', uk: '9', eu: '42-43', cm: 26.7 },
  { usW: '12', usM: '10.5', uk: '10', eu: '44-45', cm: 27.9 },
]

function guessDefaultTab(categorySlug?: string, sizeValues?: string[]) {
  const values = (sizeValues || []).map((v) => v.toLowerCase())
  if (categorySlug === 'footwear') return 'shoes'
  if (values.some((v) => v.startsWith('us '))) return 'shoes'
  if (categorySlug === 'bottoms') return 'bottoms'
  if (values.some((v) => /^\d{2,3}"?$/.test(v))) return 'bottoms'
  return 'tops'
}

export function SizeGuide({
  categorySlug,
  sizeValues,
  trigger,
}: {
  categorySlug?: string
  sizeValues?: string[]
  trigger?: React.ReactNode
}) {
  const [unit, setUnit] = useState<UnitSystem>('in')
  const defaultTab = useMemo(() => guessDefaultTab(categorySlug, sizeValues), [categorySlug, sizeValues])

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" size="sm" className="h-auto p-0 text-sm font-medium text-primary">
            <Ruler className="h-3.5 w-3.5 mr-1" />
            Size Guide
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            International Size Guide
          </DialogTitle>
          <DialogDescription>
            Find your size across US, UK, EU and international standards. Not sure? Compare your own measurements below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 -mt-2">
          <span className="text-xs text-muted-foreground">Units:</span>
          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              onClick={() => setUnit('in')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                unit === 'in' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="tops">Tops</TabsTrigger>
            <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
            <TabsTrigger value="shoes">Shoes</TabsTrigger>
            <TabsTrigger value="measure">How to Measure</TabsTrigger>
          </TabsList>

          <TabsContent value="tops" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              For tops, dresses, outerwear, and activewear. Measurements are body measurements, not garment dimensions.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>US</TableHead>
                    <TableHead>UK</TableHead>
                    <TableHead>EU</TableHead>
                    <TableHead>Bust</TableHead>
                    <TableHead>Waist</TableHead>
                    <TableHead>Hips</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TOPS_CHART.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="font-semibold">{row.size}</TableCell>
                      <TableCell>{row.us}</TableCell>
                      <TableCell>{row.uk}</TableCell>
                      <TableCell>{row.eu}</TableCell>
                      <TableCell><Measurement value={row.bust} unit={unit} /></TableCell>
                      <TableCell><Measurement value={row.waist} unit={unit} /></TableCell>
                      <TableCell><Measurement value={row.hips} unit={unit} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="bottoms" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              For pants, jeans, shorts, and skirts. Numeric sizes refer to waist measurement.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>US</TableHead>
                    <TableHead>UK</TableHead>
                    <TableHead>EU</TableHead>
                    <TableHead>Waist</TableHead>
                    <TableHead>Hips</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BOTTOMS_CHART.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="font-semibold">{row.size}</TableCell>
                      <TableCell>{row.us}</TableCell>
                      <TableCell>{row.uk}</TableCell>
                      <TableCell>{row.eu}</TableCell>
                      <TableCell><Measurement value={row.waist} unit={unit} /></TableCell>
                      <TableCell><Measurement value={row.hips} unit={unit} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="shoes" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              For sneakers, boots, and athletic shoes. Measure foot length from heel to longest toe for best fit.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>US (Women)</TableHead>
                    <TableHead>US (Men)</TableHead>
                    <TableHead>UK</TableHead>
                    <TableHead>EU</TableHead>
                    <TableHead>Foot Length</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SHOES_CHART.map((row) => (
                    <TableRow key={row.eu}>
                      <TableCell className="font-semibold">{row.usW}</TableCell>
                      <TableCell>{row.usM}</TableCell>
                      <TableCell>{row.uk}</TableCell>
                      <TableCell>{row.eu}</TableCell>
                      <TableCell>
                        {unit === 'in' ? `${(row.cm / 2.54).toFixed(1)}"` : `${row.cm} cm`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="measure" className="mt-4 space-y-4 text-sm">
            <div className="flex gap-2 items-start bg-muted/50 rounded-lg p-3">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                For the most accurate fit, measure directly on your body over light clothing using a soft tape measure, keeping it level and snug but not tight.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Bust / Chest</h4>
                <p className="text-muted-foreground">Wrap the tape around the fullest part of your bust/chest, keeping it parallel to the floor.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Waist</h4>
                <p className="text-muted-foreground">Measure around your natural waistline, the narrowest part of your torso, usually just above the belly button.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Hips</h4>
                <p className="text-muted-foreground">Measure around the fullest part of your hips, roughly 8" (20 cm) below your waistline.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Inseam</h4>
                <p className="text-muted-foreground">Measure from the crotch seam down to the bottom of the ankle along the inside of the leg.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Foot Length</h4>
                <p className="text-muted-foreground">Stand on a piece of paper and mark your heel and longest toe. Measure the distance between the marks in the afternoon, when feet are largest.</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <h4 className="font-semibold mb-1">Between sizes?</h4>
              <p className="text-muted-foreground text-xs">
                If your measurements fall between two sizes, we recommend sizing up for a more comfortable, relaxed fit, or sizing down for a fitted look. Check individual product descriptions for fit notes (e.g. "runs small" or "oversized fit").
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
