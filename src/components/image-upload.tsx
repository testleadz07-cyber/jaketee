'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  onUpload: (urls: string[]) => void
  initialImages?: string[]
  label?: string
  maxImages?: number
}

export function ImageUpload({ onUpload, initialImages = [], label = 'Product Images', maxImages }: ImageUploadProps) {
  const { toast } = useToast()
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const remainingSlots = maxImages ? Math.max(0, maxImages - previewUrls.length) : Infinity
  const atLimit = remainingSlots <= 0

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const filesToProcess = Math.min(files.length, remainingSlots)
    if (filesToProcess === 0) {
      toast({
        title: 'Image limit reached',
        description: `Remove the current image before adding a new one.`,
        variant: 'destructive',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    const uploadedUrls = [...previewUrls]
    let succeeded = 0

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `File "${file.name}" is not an image.`,
          variant: 'destructive',
        })
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `Image "${file.name}" exceeds the 5MB size limit.`,
          variant: 'destructive',
        })
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (res.ok) {
          uploadedUrls.push(data.url)
          succeeded++
        } else {
          // Local fallback preview
          const localUrl = URL.createObjectURL(file)
          uploadedUrls.push(localUrl)
          succeeded++
          toast({
            title: 'Upload warning',
            description: data.error || `Failed to upload "${file.name}" online. Using local preview fallback.`,
            variant: 'destructive',
          })
        }
      } catch (error) {
        const localUrl = URL.createObjectURL(file)
        uploadedUrls.push(localUrl)
        succeeded++
      }
    }

    setPreviewUrls(uploadedUrls)
    onUpload(uploadedUrls)
    setIsUploading(false)

    if (succeeded > 0) {
      toast({
        title: 'Images updated',
        description: `Successfully added ${succeeded} image(s).`,
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = previewUrls.filter((_, idx) => idx !== indexToRemove)
    setPreviewUrls(updated)
    onUpload(updated)
    toast({
      title: 'Image removed',
      description: 'Image removed from product.',
    })
  }

  const handleManualUrlSubmit = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault()
    if (!manualUrl || atLimit) return

    const updated = [...previewUrls, manualUrl]
    setPreviewUrls(updated)
    onUpload(updated)
    toast({
      title: 'Image URL added',
      description: 'Added custom image URL.',
    })
    setManualUrl('')
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">{label}</Label>

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {previewUrls.map((url, index) => (
          <div key={index} className="relative border rounded-xl overflow-hidden aspect-square bg-muted/30 group">
            <img
              src={url}
              alt={`Product preview ${index + 1}`}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={() => handleRemoveImage(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Upload Zone / Add Card */}
        {!atLimit && (
          <div
            onClick={triggerFileSelect}
            className="border-2 border-dashed rounded-xl aspect-square text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 bg-card p-4"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold">Add Image</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple={maxImages !== 1}
        className="hidden"
        disabled={isUploading || atLimit}
      />

      {/* Manual URL Input Fallback */}
      {!atLimit && (
      <div className="max-w-md border-t pt-4 space-y-2">
        <Label htmlFor="manual-url" className="text-xs text-muted-foreground flex items-center gap-1.5">
          <LinkIcon className="h-3 w-3" />
          Or add image URL manually
        </Label>
        <div className="flex gap-2">
          <Input
            id="manual-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleManualUrlSubmit()
              }
            }}
            disabled={isUploading}
            className="h-9 text-xs"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleManualUrlSubmit()}
            disabled={isUploading || !manualUrl}
            className="h-9"
          >
            Add URL
          </Button>
        </div>
      </div>
      )}
    </div>
  )
}
