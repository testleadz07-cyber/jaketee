import type { ReactNode } from 'react'

// Only turn local Markdown links into anchors; all catalog copy stays text.
function linkedText(text: string) {
  return text.split(/(\[[^\]]+\]\(\/(?!\/)[^\s)]*\))/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^\s)]*)\)$/)
    return link ? <a key={index} href={link[2]} className="font-medium underline underline-offset-4">{link[1]}</a> : part
  })
}

function lines(value: string, heading?: string) {
  return value.split(/\r?\n/).map(line => line.trim()).filter(line =>
    line && (!heading || line.replace(/^#+\s*|[:\s]+$/g, '').toLowerCase() !== heading.toLowerCase())
  )
}

export function CopySection({ title, children, open = false, accent = 'border-l-primary' }: {
  title: string
  children: ReactNode
  open?: boolean
  accent?: string
}) {
  return <details open={open} className={`group overflow-hidden rounded-lg border border-l-4 bg-background ${accent}`}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180">
        <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </summary>
    <div className="space-y-3 border-t px-4 py-4">{children}</div>
  </details>
}

// Render catalog text as text nodes; never execute HTML from product content.
export function ProductCopy({ description, specificationDetails, careInstructions }: {
  description: string
  specificationDetails?: string
  careInstructions?: string
}) {
  const sections = description.split(/\n\s*\n/)
  const overview = sections.filter(section => !['Details', 'Customization options'].includes(lines(section)[0]))
  return <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
    {overview.length > 0 && <CopySection title="Overview" open>
      {overview.map((section, index) => <p key={index} className="whitespace-pre-line">{linkedText(section)}</p>)}
    </CopySection>}
    {sections.map((section, index) => {
      const content = lines(section)
      const label = content[0]
      if (label === 'Details' || label === 'Customization options') {
        const body = content.slice(1)
        return <CopySection key={index} title={label} accent={label === 'Details' ? 'border-l-slate-400' : 'border-l-violet-400'}>
          {body.every(line => /^[-•]\s/.test(line)) && body.length > 0
            ? <ul className="list-disc pl-5">{body.map((line, i) => <li key={i}>{line.replace(/^[-•]\s*/, '')}</li>)}</ul>
            : <p className="whitespace-pre-line">{body.join('\n')}</p>}
        </CopySection>
      }
      return null
    })}
    {specificationDetails && <CopySection title="Specifications" accent="border-l-sky-400">
      <ul className="mt-3 list-disc pl-5">{lines(specificationDetails, 'Specifications').map((line, i) =>
        <li key={i}>{line.replace(/^[-•]\s*/, '')}</li>)}</ul>
    </CopySection>}
    {careInstructions && <CopySection title="Care instructions" accent="border-l-emerald-400">
      <p className="mt-3 whitespace-pre-line">{lines(careInstructions, 'Care instructions').join('\n')}</p>
    </CopySection>}
  </div>
}
