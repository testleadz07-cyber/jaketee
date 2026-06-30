'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()
  const [threshold, setThreshold] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load current setting
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        setThreshold(data.lowStockThreshold)
      } catch (error) {
        console.error(error)
        toast({
          title: 'Error',
          description: 'Could not load low‑stock settings.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (threshold === '' || typeof threshold !== 'number') {
      toast({
        title: 'Invalid value',
        description: 'Please enter a valid number.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThreshold: threshold }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setThreshold(data.lowStockThreshold)
      toast({
        title: 'Success',
        description: 'Low‑stock threshold updated.',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Could not save settings.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Low‑Stock Settings</h1>
      <div className="max-w-sm space-y-4">
        <label className="block text-sm font-medium text-foreground">
          Low‑stock threshold
        </label>
        <Input
          type="number"
          min={0}
          value={threshold}
          onChange={e => setThreshold(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full"
        />
        <Button onClick={handleSave} disabled={saving} className="mt-2">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
