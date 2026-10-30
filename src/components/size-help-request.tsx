"use client"

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export function SizeHelpRequest() {
  const [ready, setReady] = useState(false)
  const [heightUnit, setHeightUnit] = useState('cm')
  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const body = [
      'Hi Jacketee, please help me choose a size.',
      `Product name or link: ${data.get('product')}`,
      `Height: ${data.get('heightUnit') === 'ft-in' ? `${data.get('heightFeet')} ft ${data.get('heightInches')} in` : `${data.get('height')} cm`}`,
      `Weight: ${data.get('weight')} ${data.get('weightUnit')}`,
      `Preferred fit: ${data.get('fit')}`,
      'I do not have chest and waist measurements yet. What should I check for this style?',
    ].join('\n')
    window.location.href = `mailto:info@jacketee.com?subject=${encodeURIComponent('Help choosing my jacket size')}&body=${encodeURIComponent(body)}`
    setReady(true)
  }
  const field = 'mt-2 min-h-11 w-full min-w-0 max-w-full rounded-lg border bg-background px-3 text-base'
  return <details className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6">
    <summary className="cursor-pointer py-1 text-sm font-semibold">No tape measure? Start with height and weight</summary>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Tell our team which jacket you like, your height and weight, and how you want it to fit. We can help you check the next measurements. Height and weight alone cannot confirm a size.</p>
    <form onSubmit={prepareEmail} className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
      <div className="min-w-0"><label htmlFor="sizing-product" className="text-sm font-medium">Which jacket or vest?</label><input id="sizing-product" name="product" required maxLength={300} placeholder="Product name or link" className={field} /></div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 md:col-span-2">
        <div className="min-w-0"><label htmlFor="sizing-height-unit" className="text-sm font-medium">Your height</label><select id="sizing-height-unit" name="heightUnit" value={heightUnit} onChange={event => setHeightUnit(event.target.value)} className={field}><option value="cm">Centimeters</option><option value="ft-in">Feet &amp; inches</option></select>
          {heightUnit === 'ft-in' ? <div className="grid grid-cols-2 gap-2"><div><label htmlFor="sizing-height-feet" className="mt-2 block text-xs">Feet</label><input id="sizing-height-feet" name="heightFeet" type="number" min="1" step="1" required inputMode="numeric" className={field} /></div><div><label htmlFor="sizing-height-inches" className="mt-2 block text-xs">Inches</label><input id="sizing-height-inches" name="heightInches" type="number" min="0" max="11" step="any" required inputMode="decimal" className={field} /></div></div> : <div><label htmlFor="sizing-height" className="mt-2 block text-xs">Centimeters</label><input id="sizing-height" name="height" type="number" min="0.1" step="any" required inputMode="decimal" className={field} /></div>}
        </div>
        <div className="min-w-0"><label htmlFor="sizing-weight" className="text-sm font-medium">Your weight</label><input id="sizing-weight" name="weight" type="number" min="0.1" step="any" required inputMode="decimal" className={field} /><label htmlFor="sizing-weight-unit" className="sr-only">Weight unit</label><select id="sizing-weight-unit" name="weightUnit" className={field}><option value="kg">Kilograms</option><option value="lb">Pounds</option></select></div>
      </div>
      <div className="min-w-0 md:col-start-2 md:row-start-1"><label htmlFor="sizing-fit" className="text-sm font-medium">How do you like it to fit?</label><select id="sizing-fit" name="fit" className={field}><option>Regular</option><option>Close-fitting</option><option>Relaxed / room for layers</option><option>Not sure</option></select></div>
      <div className="min-w-0 md:col-span-2"><button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground sm:w-auto">Prepare sizing email</button><p className="mt-2 text-xs leading-5 text-muted-foreground">Opens a draft in your email app. Review it and send when ready.</p></div>
      {ready && <p role="status" className="text-sm leading-6 md:col-span-2">If your email app did not open, <Link href="/contact" className="font-medium underline underline-offset-4">contact our team</Link> with the details above.</p>}
    </form>
  </details>
}
