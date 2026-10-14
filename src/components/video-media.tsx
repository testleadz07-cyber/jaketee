'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { parseVideoUrl } from '@/lib/video-media'

export function VideoMedia({ url, title = 'Product video' }: { url: string; title?: string }) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)
  const video = parseVideoUrl(url)
  if (!video) return <p className="text-sm text-muted-foreground">Video unavailable</p>
  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); setFailed(false) }}>
    <button type="button" onClick={() => setOpen(true)} aria-label={`Play ${title}`} className="relative block aspect-video w-44 max-w-full shrink-0 overflow-hidden rounded-lg border bg-black focus-visible:outline-2 focus-visible:outline-offset-2">
      {/* Remote video posters intentionally use the browser image loader. */}
      {!posterFailed && <img src={video.poster} alt="" width={176} height={99} loading="lazy" decoding="async" onError={() => setPosterFailed(true)} className="h-full w-full object-cover" />}
      <span className="absolute inset-0 flex items-center justify-center bg-black/25"><Play className="h-9 w-9 fill-white text-white" /></span>
      <span className="absolute bottom-1 left-2 text-xs text-white">{video.provider === 'youtube' ? 'YouTube' : 'Video'}</span>
    </button>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:max-w-3xl sm:p-6">
      <DialogTitle className="break-words pr-6">{title}</DialogTitle>
      <DialogDescription>Play the video below or open it on its original site.</DialogDescription>
      {open && (video.embedUrl ? <iframe src={video.embedUrl} title={title} className="min-h-[200px] aspect-video w-full rounded bg-black" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <video src={video.url} poster={video.poster} controls playsInline preload="none" className="max-h-[60dvh] w-full rounded bg-black object-contain" onError={() => setFailed(true)} />)}
      {failed && <p role="alert" className="text-sm">This video could not be loaded. Try opening the original below.</p>}
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center text-sm underline">Open original video</a>
    </DialogContent>
  </Dialog>
}
