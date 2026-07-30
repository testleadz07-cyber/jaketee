'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Ticket,
  AlertTriangle,
  Calendar,
  DollarSign,
  Percent,
  Check,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Coupon {
  id: string
  _id?: string
  code: string
  discountType: 'percentage' | 'fixed' | 'free_shipping'
  discountValue: number
  minOrderValue: number
  startDate?: string
  endDate?: string
  usageLimit?: number | null
  usageCount: number
  isActive: boolean
}

export default function AdminDiscounts() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Dialog open states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  // Add Coupon form state
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 0,
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  })

  // Edit Coupon form state
  const [editForm, setEditForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 0,
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCoupons()
    }
  }, [status])

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/discounts')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
        // Detect fallback mock data
        const first = data[0]
        if (first && first.id && first.id.startsWith('demo-')) {
          setIsDemoMode(true)
        }
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChangeAdd = (val: string) => {
    setNewCoupon((prev) => ({ ...prev, code: val.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
  }

  const handleCodeChangeEdit = (val: string) => {
    setEditForm((prev) => ({ ...prev, code: val.toUpperCase().replace(/[^A-Z0-9]/g, '') }))
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Creating coupons is disabled when database is not connected.',
        variant: 'destructive',
      })
      return
    }

    if (!newCoupon.code.trim()) {
      toast({ title: 'Validation Error', description: 'Coupon code cannot be empty.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      })

      if (res.ok) {
        toast({ title: 'Coupon Created', description: `Successfully created coupon: ${newCoupon.code}` })
        setIsAddOpen(false)
        fetchCoupons()
        // Reset form
        setNewCoupon({
          code: '',
          discountType: 'percentage',
          discountValue: 0,
          minOrderValue: 0,
          startDate: '',
          endDate: '',
          usageLimit: '',
          isActive: true,
        })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create coupon.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create coupon.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setEditForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      isActive: coupon.isActive,
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCoupon) return

    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Modifying coupons is disabled when database is not connected.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/discounts/${editingCoupon.id || editingCoupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        toast({ title: 'Coupon Updated', description: `Successfully updated coupon: ${editForm.code}` })
        setIsEditOpen(false)
        setEditingCoupon(null)
        fetchCoupons()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to update coupon.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update coupon.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    if (isDemoMode) {
      // Simulate toggle in state for front-end demo
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      toast({
        title: 'Demo Mode Simulation',
        description: `Toggled active state of ${coupon.code} in memory.`,
      })
      return
    }

    try {
      const res = await fetch(`/api/admin/discounts/${coupon.id || coupon._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      if (res.ok) {
        toast({ title: 'Coupon Updated', description: `Coupon status toggled successfully.` })
        fetchCoupons()
      } else {
        toast({ title: 'Error', description: 'Failed to toggle status.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' })
    }
  }

  const executeDelete = async () => {
    if (!deleteTarget) return

    if (isDemoMode) {
      toast({
        title: 'Demo Mode Warning',
        description: 'Deleting coupons is disabled when database is not connected.',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch(`/api/admin/discounts/${deleteTarget.id || deleteTarget._id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Coupon Deleted', description: 'The coupon was successfully deleted.' })
        setDeleteTarget(null)
        fetchCoupons()
      } else {
        toast({ title: 'Error', description: 'Failed to delete coupon.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading discounts...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user as any).role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-semibold">Access Denied. Admins Only.</p>
          <Link href="/">
            <Button className="mt-4">Back to Storefront</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col pb-24">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">LUXE STORE Admin</h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-muted-foreground hidden md:inline">
                Logged in as <span className="font-semibold text-foreground">{session.user?.email}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push('/api/auth/signout')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <nav className="bg-background border-b py-2 sticky top-[73px] z-10">
        <div className="container mx-auto px-4 flex gap-2 overflow-x-auto">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">Products</Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" size="sm">Categories</Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">Orders</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">Users</Button>
          </Link>
          <Link href="/admin/guest-activity">
            <Button variant="ghost" size="sm">Guest Activity</Button>
          </Link>
          <Link href="/admin/notifications">
            <Button variant="ghost" size="sm">Notifications</Button>
          </Link>
          <Link href="/admin/reviews">
            <Button variant="ghost" size="sm">Reviews</Button>
          </Link>
          <Link href="/admin/discounts">
            <Button variant="secondary" size="sm">Discounts</Button>
          </Link>
          <Link href="/admin/bulk-editor">
            <Button variant="ghost" size="sm">Bulk Editor</Button>
          </Link>
          <Link href="/admin/tags">
            <Button variant="ghost" size="sm">Tags</Button>
          </Link>
          <Link href="/admin/refunds">
            <Button variant="ghost" size="sm">Refunds</Button>
          </Link>
          <Link href="/admin/blog">
            <Button variant="ghost" size="sm">Blog</Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-6">
        {isDemoMode && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs">
              <strong>Database not connected.</strong> Using read-only static discount data. CRUD operations are simulated.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Coupon Codes</h2>
            <p className="text-muted-foreground text-sm">Manage store coupons, percentage cuts, and shipping deals</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Create Coupon
          </Button>
        </div>

        {/* Coupon Cards / Table Grid */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Active Coupons
            </CardTitle>
            <CardDescription>View, edit, and toggle active promotions for checkout subtotal cuts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Value</th>
                    <th className="px-6 py-3">Min Order</th>
                    <th className="px-6 py-3">Usage Limit</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                        No coupon codes found. Click "Create Coupon" to add one!
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id || coupon._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-primary select-all">
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4 capitalize text-xs">
                          {coupon.discountType.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : coupon.discountType === 'fixed'
                            ? `$${coupon.discountValue.toFixed(2)}`
                            : 'Free Shipping'}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
                          ${coupon.minOrderValue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {coupon.usageCount} / {coupon.usageLimit || 'Unlimited'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={coupon.isActive}
                              onCheckedChange={() => handleToggleActive(coupon)}
                            />
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${coupon.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {coupon.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(coupon)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(coupon)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* CREATE DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Discount Coupon</DialogTitle>
            <DialogDescription>Define your promotional parameters below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-code">Coupon Code (Uppercase, alphanumeric)</Label>
              <Input
                id="add-code"
                placeholder="SUMMER20"
                value={newCoupon.code}
                onChange={(e) => handleCodeChangeAdd(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-type">Discount Type</Label>
                <Select
                  value={newCoupon.discountType}
                  onValueChange={(val: any) =>
                    setNewCoupon((prev) => ({
                      ...prev,
                      discountType: val,
                      discountValue: val === 'free_shipping' ? 0 : prev.discountValue,
                    }))
                  }
                >
                  <SelectTrigger id="add-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Cash Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-value">Discount Value</Label>
                <Input
                  id="add-value"
                  type="number"
                  min="0"
                  max={newCoupon.discountType === 'percentage' ? '100' : undefined}
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                  disabled={newCoupon.discountType === 'free_shipping'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-min">Min Order value ($)</Label>
                <Input
                  id="add-min"
                  type="number"
                  min="0"
                  value={newCoupon.minOrderValue}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-limit">Usage limit (total uses)</Label>
                <Input
                  id="add-limit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={newCoupon.usageLimit}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, usageLimit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-start">Start Date</Label>
                <Input
                  id="add-start"
                  type="date"
                  value={newCoupon.startDate}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-end">Expiry Date</Label>
                <Input
                  id="add-end"
                  type="date"
                  value={newCoupon.endDate}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="add-active"
                checked={newCoupon.isActive}
                onCheckedChange={(checked) => setNewCoupon((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="add-active">Activate coupon immediately</Label>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Discount Coupon</DialogTitle>
            <DialogDescription>Modify promotional properties for: {editingCoupon?.code}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Coupon Code</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => handleCodeChangeEdit(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Discount Type</Label>
                <Select
                  value={editForm.discountType}
                  onValueChange={(val: any) =>
                    setEditForm((prev) => ({
                      ...prev,
                      discountType: val,
                      discountValue: val === 'free_shipping' ? 0 : prev.discountValue,
                    }))
                  }
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Off</SelectItem>
                    <SelectItem value="fixed">Fixed Cash Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-value">Discount Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  max={editForm.discountType === 'percentage' ? '100' : undefined}
                  value={editForm.discountValue}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                  disabled={editForm.discountType === 'free_shipping'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min">Min Order value ($)</Label>
                <Input
                  id="edit-min"
                  type="number"
                  min="0"
                  value={editForm.minOrderValue}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-limit">Usage limit (total uses)</Label>
                <Input
                  id="edit-limit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={editForm.usageLimit}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start Date</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-end">Expiry Date</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-active">Activate coupon</Label>
            </div>

            <DialogFooter className="pt-4 border-t mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM ALERT */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the coupon code <span className="font-bold text-primary">{deleteTarget?.code}</span>.
              Customers will no longer be able to validate or redeem this code at checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
