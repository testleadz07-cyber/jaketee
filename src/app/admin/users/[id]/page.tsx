'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  ChevronLeft,
  Loader2,
  Save,
  Trash2,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  KeyRound,
  Plus,
  MapPin,
} from 'lucide-react'

interface UserOrderRow {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  itemCount: number
}

interface AddressForm {
  label: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  isDefault: boolean
}

interface UserDetail {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
  isActive: boolean
  phone: string | null
  avatar: string | null
  addresses: AddressForm[]
  createdAt: string
  orderCount: number
  totalSpent: number
  orders: UserOrderRow[]
}

const emptyAddress: AddressForm = {
  label: 'Home',
  name: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
  phone: '',
  isDefault: false,
}

export default function AdminUserDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  const { toast } = useToast()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'admin' | 'customer'>('customer')
  const [isActive, setIsActive] = useState(true)
  const [addresses, setAddresses] = useState<AddressForm[]>([])
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setName(data.name)
        setEmail(data.email)
        setPhone(data.phone || '')
        setRole(data.role)
        setIsActive(data.isActive)
        setAddresses(
          (data.addresses || []).map((a: any) => ({
            label: a.label || 'Home',
            name: a.name || '',
            street: a.street || '',
            city: a.city || '',
            state: a.state || '',
            zip: a.zip || '',
            country: a.country || 'United States',
            phone: a.phone || '',
            isDefault: !!a.isDefault,
          }))
        )
      } else if (res.status === 404) {
        toast({ title: 'Not found', description: 'This user does not exist.', variant: 'destructive' })
        router.push('/admin/users')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, router, toast])

  useEffect(() => {
    if (status === 'authenticated' && userId) fetchUser()
  }, [status, userId, fetchUser])

  const handleSave = async () => {
    for (const addr of addresses) {
      if (!addr.name.trim() || !addr.street.trim() || !addr.city.trim() || !addr.state.trim() || !addr.zip.trim()) {
        toast({
          title: 'Error',
          description: 'Each address needs a name, street, city, state, and zip code.',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role, isActive, addresses }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'User updated successfully' })
        fetchUser()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to communicate with server.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' })
      return
    }
    setResettingPassword(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Password reset', description: 'The user can now log in with the new password.' })
        setNewPassword('')
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to reset password', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to communicate with server.', variant: 'destructive' })
    } finally {
      setResettingPassword(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (!confirm(`Permanently delete ${user.email}'s account? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'User deleted' })
        router.push('/admin/users')
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to communicate with server.', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const updateAddress = (idx: number, field: keyof AddressForm, value: string | boolean) => {
    setAddresses((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)))
  }

  const addAddress = () => {
    setAddresses((prev) => [...prev, { ...emptyAddress }])
  }

  const removeAddress = (idx: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== idx))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

  if (!user) return null

  const isSelf = user.id === (session.user as any).id

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>{user.role}</Badge>
            <Badge className={user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
              {user.isActive ? 'Active' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-semibold text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="font-semibold text-sm">{user.orderCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="font-semibold text-sm">${user.totalSpent.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-1 space-y-6 h-fit">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update profile information, role, and access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Not provided" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'customer')} disabled={isSelf}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Account Status</Label>
                <Select
                  value={isActive ? 'active' : 'disabled'}
                  onValueChange={(v) => setIsActive(v === 'active')}
                  disabled={isSelf}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && <p className="text-xs text-muted-foreground">You cannot disable your own account.</p>}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                {!isSelf && (
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting} title="Delete account">
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <KeyRound className="h-4 w-4" /> Reset Password
              </CardTitle>
              <CardDescription>
                Set a new password for this account. Passwords are stored as one-way hashes, so the
                current password can&apos;t be viewed or recovered — this sets a brand new one instead.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <PasswordInput
                placeholder="New password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetPassword}
                disabled={resettingPassword || newPassword.length === 0}
              >
                {resettingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Set New Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order history + addresses */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>All orders placed by this customer.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {user.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 pb-6">No orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{order.itemCount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Saved Addresses
                </CardTitle>
                <CardDescription>Add, edit, or remove this customer&apos;s saved addresses.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addAddress}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Address
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses.</p>
              ) : (
                addresses.map((addr, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-32">
                          <Input
                            value={addr.label}
                            onChange={(e) => updateAddress(idx, 'label', e.target.value)}
                            placeholder="Label"
                            className="h-8 text-sm"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Checkbox
                            checked={addr.isDefault}
                            onCheckedChange={(checked) => updateAddress(idx, 'isDefault', !!checked)}
                          />
                          Default address
                        </label>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeAddress(idx)} title="Remove address">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        value={addr.name}
                        onChange={(e) => updateAddress(idx, 'name', e.target.value)}
                        placeholder="Recipient name"
                      />
                      <Input
                        value={addr.phone}
                        onChange={(e) => updateAddress(idx, 'phone', e.target.value)}
                        placeholder="Phone (optional)"
                      />
                      <Input
                        value={addr.street}
                        onChange={(e) => updateAddress(idx, 'street', e.target.value)}
                        placeholder="Street address"
                        className="sm:col-span-2"
                      />
                      <Input
                        value={addr.city}
                        onChange={(e) => updateAddress(idx, 'city', e.target.value)}
                        placeholder="City"
                      />
                      <Input
                        value={addr.state}
                        onChange={(e) => updateAddress(idx, 'state', e.target.value)}
                        placeholder="State"
                      />
                      <Input
                        value={addr.zip}
                        onChange={(e) => updateAddress(idx, 'zip', e.target.value)}
                        placeholder="Zip code"
                      />
                      <Input
                        value={addr.country}
                        onChange={(e) => updateAddress(idx, 'country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ))
              )}
              <Separator />
              <p className="text-xs text-muted-foreground">
                Address changes are saved together with the account details above — click{' '}
                <span className="font-medium text-foreground">Save Changes</span> to apply them.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
