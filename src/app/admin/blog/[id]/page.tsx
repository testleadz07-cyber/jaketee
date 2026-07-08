'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { BlogPostForm, BlogPostFormValues } from '@/components/admin/blog-post-form'

export default function EditBlogPost() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [initialValues, setInitialValues] = useState<Partial<BlogPostFormValues> | null>(null)
  const [taggedProductOptions, setTaggedProductOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchPost()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${id}`)
      if (!res.ok) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const post = await res.json()

      const taggedProductIds: string[] = post.taggedProducts || []
      let productOptions: { id: string; name: string }[] = []
      if (taggedProductIds.length > 0) {
        const results = await Promise.all(
          taggedProductIds.map((pid) =>
            fetch(`/api/products/${pid}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        )
        productOptions = results
          .filter(Boolean)
          .map((p: any) => ({ id: p.id || p._id, name: p.name }))
      }

      setInitialValues({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featuredImage: post.featuredImage || '',
        categories: (post.categories || []).map((c: any) => c.id),
        tags: post.tags || [],
        status: post.status || 'draft',
        publishedAt: post.publishedAt || '',
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        ogImage: post.ogImage || '',
        taggedProducts: taggedProductIds,
      })
      setTaggedProductOptions(productOptions)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return null
  }

  if (notFound || !initialValues) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-semibold">Blog post not found.</p>
          <Link href="/admin/blog">
            <Button className="mt-4">Back to Blog</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/blog">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Edit Blog Post</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{session.user?.email}</span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <BlogPostForm
            mode="edit"
            postId={id}
            initialValues={initialValues}
            initialTaggedProductOptions={taggedProductOptions}
          />
        </div>
      </main>
    </div>
  )
}
