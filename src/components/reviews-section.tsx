'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Star, Loader2, MessageSquare, ShieldAlert, Upload, X, ImageIcon, VideoIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  userName: string
  rating: number
  title?: string
  comment: string
  createdAt: string
  images?: string[]
  videos?: string[]
}

interface ReviewsSectionProps {
  productId: string
  onReviewSubmitted?: () => void
}

export function ReviewsSection({ productId, onReviewSubmitted }: ReviewsSectionProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Star-rating filter (0 = show all)
  const [ratingFilter, setRatingFilter] = useState(0)

  // Form states
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  // Media upload states
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [reviewVideos, setReviewVideos] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchReviews()
  }, [productId, ratingFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const qs = ratingFilter > 0 ? `&rating=${ratingFilter}` : ''
      const res = await fetch(`/api/reviews?productId=${productId}${qs}`)
      let data: Review[] = []
      if (res.ok) {
        data = await res.json()
        setReviews(data)
      }

      // Keep an unfiltered copy around to compute the overall rating summary,
      // independent of whichever star filter is currently active.
      if (ratingFilter === 0) {
        setAllReviews(data)
      } else {
        const allRes = await fetch(`/api/reviews?productId=${productId}`)
        if (allRes.ok) {
          setAllReviews(await allRes.json())
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMedia(true)
    let succeeded = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        toast({
          title: 'Invalid file type',
          description: `File "${file.name}" must be an image or video.`,
          variant: 'destructive',
        })
        continue
      }

      const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `"${file.name}" exceeds the ${isVideo ? '25MB' : '5MB'} size limit.`,
          variant: 'destructive',
        })
        continue
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', isVideo ? 'video' : 'image')

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (res.ok) {
          if (isVideo) {
            setReviewVideos((prev) => [...prev, data.url])
          } else {
            setReviewImages((prev) => [...prev, data.url])
          }
          succeeded++
        } else {
          toast({
            title: 'Upload failed',
            description: data.error || `Failed to upload "${file.name}".`,
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: `An error occurred uploading "${file.name}".`,
          variant: 'destructive',
        })
      }
    }

    setIsUploadingMedia(false)
    if (succeeded > 0) {
      toast({
        title: 'Media uploaded',
        description: `Added ${succeeded} file(s) to your review.`,
      })
    }
    if (mediaInputRef.current) {
      mediaInputRef.current.value = ''
    }
  }

  const removeReviewImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeReviewVideo = (index: number) => {
    setReviewVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment) {
      toast({
        title: 'Error',
        description: 'Please write a comment',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title,
          comment,
          images: reviewImages,
          videos: reviewVideos,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Review submitted',
          description: 'Thank you for your feedback! It will appear once approved by our team.',
        })
        setTitle('')
        setComment('')
        setRating(5)
        setReviewImages([])
        setReviewVideos([])
        fetchReviews()
        if (onReviewSubmitted) {
          onReviewSubmitted()
        }
      } else {
        const data = await res.json()
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit review',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating = allReviews.length
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="space-y-8 mt-12 border-t pt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Share your thoughts and experiences with this product
          </p>
        </div>

        {allReviews.length > 0 && (
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-muted-foreground/10">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary">{averageRating.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">out of 5 stars</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(averageRating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{allReviews.length} reviews</p>
            </div>
          </div>
        )}
      </div>

      {allReviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">Filter by rating:</span>
          <Button
            type="button"
            variant={ratingFilter === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRatingFilter(0)}
          >
            All ({allReviews.length})
          </Button>
          {ratingCounts.map(({ star, count }) => (
            <Button
              key={star}
              type="button"
              variant={ratingFilter === star ? 'default' : 'outline'}
              size="sm"
              disabled={count === 0}
              onClick={() => setRatingFilter(star)}
              className="gap-1"
            >
              {star}
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs opacity-70">({count})</span>
            </Button>
          ))}
        </div>
      )}

      <Separator />

      {/* Review List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/10 rounded-xl border-2 border-dashed">
            <MessageSquare className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">
              {ratingFilter > 0 ? `No ${ratingFilter}-star reviews yet` : 'No reviews yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {ratingFilter > 0
                ? 'Try a different star rating filter or view all reviews.'
                : 'Be the first to review this product and share your experience with other customers.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {review.title && <p className="font-bold text-sm">{review.title}</p>}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>

                {((review.images && review.images.length > 0) || (review.videos && review.videos.length > 0)) && (
                  <div className="flex flex-wrap gap-2">
                    {review.images?.map((url, idx) => (
                      <a
                        key={`img-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted border block"
                      >
                        <img src={url} alt={`Review photo ${idx + 1}`} className="object-cover w-full h-full" />
                      </a>
                    ))}
                    {review.videos?.map((url, idx) => (
                      <a
                        key={`vid-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted border flex items-center justify-center"
                      >
                        <video src={url} className="object-cover w-full h-full" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <VideoIcon className="h-5 w-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {index < reviews.length - 1 && <Separator className="pt-4" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Write a Review Form */}
      <div className="bg-card border-2 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Write a Review</h3>

        {session ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Review Title (Optional)</Label>
              <Input
                id="review-title"
                type="text"
                placeholder="Summarize your experience..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Review Comment</Label>
              <Textarea
                id="review-comment"
                placeholder="What did you like or dislike? How does it fit?"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Add Photos / Videos (Optional)</Label>
              <div className="flex flex-wrap gap-3">
                {reviewImages.map((url, idx) => (
                  <div key={`img-${idx}`} className="relative h-16 w-16 rounded-lg overflow-hidden border bg-muted group">
                    <img src={url} alt={`Upload ${idx + 1}`} className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => removeReviewImage(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
                {reviewVideos.map((url, idx) => (
                  <div key={`vid-${idx}`} className="relative h-16 w-16 rounded-lg overflow-hidden border bg-muted group">
                    <video src={url} className="object-cover w-full h-full" muted />
                    <div className="absolute top-0.5 left-0.5 bg-black/60 rounded-full p-0.5">
                      <VideoIcon className="h-3 w-3 text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReviewVideo(idx)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isUploadingMedia || submitting}
                  className="h-16 w-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                >
                  {isUploadingMedia ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Add</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Images up to 5MB &middot; <VideoIcon className="h-3 w-3" /> Videos up to 25MB
              </p>
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaFileChange}
                accept="image/*,video/*"
                multiple
                className="hidden"
                disabled={isUploadingMedia || submitting}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm">
              Please{' '}
              <Link href="/login" className="font-bold underline hover:text-amber-950">
                sign in
              </Link>{' '}
              to write a review for this product.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
