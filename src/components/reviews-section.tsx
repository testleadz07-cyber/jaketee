'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Star, Loader2, MessageSquare, ShieldAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  userName: string
  rating: number
  title?: string
  comment: string
  createdAt: string
}

interface ReviewsSectionProps {
  productId: string
  onReviewSubmitted?: () => void
}

export function ReviewsSection({ productId, onReviewSubmitted }: ReviewsSectionProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
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
        }),
      })

      if (res.ok) {
        toast({
          title: 'Review submitted',
          description: 'Thank you for your feedback!',
        })
        setTitle('')
        setComment('')
        setRating(5)
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

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="space-y-8 mt-12 border-t pt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Share your thoughts and experiences with this product
          </p>
        </div>

        {reviews.length > 0 && (
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
              <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
            </div>
          </div>
        )}
      </div>

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
            <h3 className="font-semibold text-lg">No reviews yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Be the first to review this product and share your experience with other customers.
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
