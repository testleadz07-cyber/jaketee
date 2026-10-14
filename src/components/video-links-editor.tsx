'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VideoMedia } from '@/components/video-media'
import { parseVideoUrl } from '@/lib/video-media'

export function VideoLinksEditor({ videos, onChange, limit = 2, disabled = false }: { videos: string[]; onChange: (videos: string[]) => void; limit?: number; disabled?: boolean }) {
  const id = useId()
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  function add() {
    const video = parseVideoUrl(link)
    if (!video) { setError('Enter a valid HTTPS YouTube or Cloudinary video URL.'); return }
    if (videos.some((url) => parseVideoUrl(url)?.url === video.url)) { setError('This video is already added.'); return }
    if (videos.length >= limit) { setError(`You can add up to ${limit} videos.`); return }
    onChange([...videos, video.url]); setLink(''); setError('')
  }
  return <div className="space-y-3">
    <Label htmlFor={id}>Add video link (optional)</Label>
    <div className="flex flex-col gap-2 sm:flex-row"><Input id={id} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={Boolean(error)} className="min-h-11 min-w-0 flex-1" value={link} onChange={(event) => { setLink(event.target.value); setError('') }} placeholder="YouTube or Cloudinary video URL" disabled={disabled || videos.length >= limit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }} /><Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={add} disabled={disabled || !link.trim() || videos.length >= limit}>Add video</Button></div>
    <p id={`${id}-help`} className="text-xs text-muted-foreground">YouTube links, Shorts, or Cloudinary video links. {videos.length}/{limit} videos. {videos.length >= limit && 'Remove a video to add another.'}</p>
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3">{videos.map((url, index) => <div key={`${url}-${index}`} className="max-w-full space-y-1"><VideoMedia url={url} title={`Video ${index + 1}`} /><Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={disabled} onClick={() => onChange(videos.filter((_, i) => i !== index))} aria-label={`Remove video ${index + 1}`}>Remove video</Button></div>)}</div>
  </div>
}
