'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  onUpload: (url: string) => void
  initialImage?: string
}

export function ImageUpload({ onUpload, initialImage = '' }: ImageUploadProps) {
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string>(initialImage)
  const [isUploading, setIsUploading] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size must be less than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setPreviewUrl(data.url)
        onUpload(data.url)
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        })
      } else {
        toast({
          title: 'Upload failed',
          description: data.error || 'Failed to upload image. Using local preview fallback.',
          variant: 'destructive',
        })
        // Local preview fallback for offline/demo environments
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)
        onUpload(localUrl)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during upload. Using local fallback.',
        variant: 'destructive',
      })
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      onUpload(localUrl)
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setPreviewUrl('')
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleManualUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUrl) return

    setPreviewUrl(manualUrl)
    onUpload(manualUrl)
    toast({
      title: 'Image URL updated',
      description: 'Using custom image URL.',
    })
    setManualUrl('')
  }

  return (
    <div className="space-y-4">
      <Label>Product Image</Label>

      {/* Upload Zone */}
      {previewUrl ? (
        <div className="relative border-2 border-dashed rounded-xl overflow-hidden aspect-video max-w-md bg-muted/30 group">
          <img
            src={previewUrl}
            alt="Preview"
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={triggerFileSelect}
              disabled={isUploading}
            >
              Change Image
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={triggerFileSelect}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300 max-w-md flex flex-col items-center justify-center gap-3 bg-card"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Uploading image...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Click to upload product image</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />

      {/* Manual URL Input Fallback */}
      <div className="max-w-md border-t pt-4 space-y-2">
        <Label htmlFor="manual-url" className="text-xs text-muted-foreground flex items-center gap-1.5">
          <LinkIcon className="h-3 w-3" />
          Or enter image URL manually
        </Label>
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <Input
            id="manual-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            disabled={isUploading}
            className="h-9 text-xs"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isUploading || !manualUrl} className="h-9">
            Apply URL
          </Button>
        </form>
      </div>
    </div>
  )
}
