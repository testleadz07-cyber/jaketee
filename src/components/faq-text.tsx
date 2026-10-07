import Link from 'next/link'
import type { ReactNode } from 'react'

/** Render plain FAQ text with optional, site-local Markdown links. */
export function FaqText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const links = /\[([^\]\n]+)\]\((\/(?!\/)[a-zA-Z0-9/_?#=&%-]+)\)/g
  let cursor = 0
  for (const match of text.matchAll(links)) {
    const index = match.index ?? 0
    parts.push(text.slice(cursor, index))
    parts.push(<Link key={index} href={match[2]} className="font-medium underline underline-offset-4">{match[1]}</Link>)
    cursor = index + match[0].length
  }
  parts.push(text.slice(cursor))
  return <>{parts}</>
}
