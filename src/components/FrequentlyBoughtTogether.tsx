'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Product {
  id: string
  _id?: string
  name: string
  slug: string
  price: number
  images: Array<{ url: string; alt?: string | null; id?: string; order?: number }>
  variants?: Array<{ id: string; name: string; value: string; priceAdjust: number; inStock: boolean; image?: string | null }>
}

interface FrequentlyBoughtTogetherProps {
  currentProduct: Product
}

export function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
  const [bundleProducts, setBundleProducts] = useState<Product[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const currentProductId = currentProduct.id || currentProduct._id || ''

  useEffect(() => {
    fetchRecommendations()
  }, [currentProductId])

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`/api/products/${currentProductId}/recommendations`)
      if (res.ok) {
        const data = await res.json()
        const fbt = data.frequentlyBoughtTogether || []
        setBundleProducts(fbt)
        
        // Default check all items
        const initialSelected: Record<string, boolean> = { [currentProductId]: true }
        fbt.forEach((p: Product) => {
          initialSelected[p.id || p._id || ''] = true
        })
        setSelectedItems(initialSelected)

        // Select default variants
        const initialVariants: Record<string, Record<string, string>> = {}
        
        // Current product variants
        if (currentProduct.variants && currentProduct.variants.length > 0) {
          initialVariants[currentProductId] = getDefaultVariants(currentProduct.variants)
        }

        // Recommended products variants
        fbt.forEach((p: Product) => {
          if (p.variants && p.variants.length > 0) {
            initialVariants[p.id || p._id || ''] = getDefaultVariants(p.variants)
          }
        })
        setSelectedVariants(initialVariants)
      }
    } catch (error) {
      console.error('Error fetching bundle recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultVariants = (variants: any[]) => {
    const defaults: Record<string, string> = {}
    const grouped: Record<string, any[]> = {}
    
    variants.forEach(v => {
      if (!grouped[v.name]) grouped[v.name] = []
      grouped[v.name].push(v)
    })

    Object.keys(grouped).forEach(name => {
      const available = grouped[name].filter(v => v.inStock)
      if (available.length > 0) {
        defaults[name] = available[0].value
      } else if (grouped[name].length > 0) {
        defaults[name] = grouped[name][0].value
      }
    })
    return defaults
  }

  if (loading || bundleProducts.length === 0) return null

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedItems(prev => ({ ...prev, [id]: checked }))
  }

  const getProductPrice = (product: Product) => {
    let price = product.price
    const prodId = product.id || product._id || ''
    const variants = product.variants || []
    const selections = selectedVariants[prodId] || {}
    
    Object.keys(selections).forEach(name => {
      const val = selections[name]
      const match = variants.find(v => v.name === name && v.value === val)
      if (match) {
        price += match.priceAdjust
      }
    })
    return price
  }

  // Calculate sum of selected items
  let bundleSubtotal = 0
  if (selectedItems[currentProductId]) {
    bundleSubtotal += getProductPrice(currentProduct)
  }
  bundleProducts.forEach(p => {
    const pId = p.id || p._id || ''
    if (selectedItems[pId]) {
      bundleSubtotal += getProductPrice(p)
    }
  })

  // Count items selected in bundle
  const selectedCount = Object.values(selectedItems).filter(Boolean).length

  const handleAddBundleToCart = async () => {
    setAddingToCart(true)
    
    try {
      const itemsToAdd: any[] = []
      
      // Add current product if selected
      if (selectedItems[currentProductId]) {
        const variantsArr = Object.keys(selectedVariants[currentProductId] || {}).map(name => ({
          name,
          value: selectedVariants[currentProductId][name]
        }))
        itemsToAdd.push({
          productId: currentProductId,
          name: currentProduct.name,
          price: getProductPrice(currentProduct),
          image: currentProduct.images?.[0]?.url || '',
          variants: variantsArr,
          quantity: 1
        })
      }

      // Add recommended products if selected
      bundleProducts.forEach(p => {
        const pId = p.id || p._id || ''
        if (selectedItems[pId]) {
          const variantsArr = Object.keys(selectedVariants[pId] || {}).map(name => ({
            name,
            value: selectedVariants[pId][name]
          }))
          itemsToAdd.push({
            productId: pId,
            name: p.name,
            price: getProductPrice(p),
            image: p.images?.[0]?.url || '',
            variants: variantsArr,
            quantity: 1
          })
        }
      })

      if (itemsToAdd.length === 0) {
        toast({
          title: 'No items selected',
          description: 'Please check at least one product to add to cart.',
          variant: 'destructive'
        })
        return
      }

      itemsToAdd.forEach(item => {
        addItem(item)
      })

      toast({
        title: 'Bundle Added!',
        description: `Successfully added ${itemsToAdd.length} products to your cart.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Error',
        description: 'Failed to add bundle to cart.',
        variant: 'destructive'
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const renderProductItem = (product: Product) => {
    const prodId = product.id || product._id || ''
    const isChecked = !!selectedItems[prodId]

    return (
      <div
        key={prodId}
        className={`relative flex h-full flex-col items-center rounded-2xl border-2 bg-background p-4 text-center transition-all duration-300 ${
          isChecked ? 'border-primary/50 shadow-sm' : 'border-border opacity-60'
        }`}
      >
        <div className="absolute top-3 right-3 z-10">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => handleCheckboxChange(prodId, !!checked)}
            className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>

        <div className="relative mb-3 h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-muted">
          <Image src={product.images?.[0]?.url || '/placeholder.png'} alt={product.name} fill sizes="112px" className="object-cover" />
        </div>

        <div className="flex w-full flex-1 flex-col justify-center">
          <h4 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold">{product.name}</h4>
          <p className="mt-2 text-sm font-bold text-primary">
            ${getProductPrice(product).toFixed(2)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-3xl border-2 bg-card/40 p-6 backdrop-blur-sm md:p-8">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Frequently Bought Together</h3>
        <p className="mt-1 text-xs text-muted-foreground">Get the complete set and elevate your look</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Products */}
        <div className="grid flex-1 gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
          {renderProductItem(currentProduct)}
          {bundleProducts.map(p => renderProductItem(p))}
        </div>

        {/* Bundle buy panel */}
        <div className="flex w-full shrink-0 flex-col justify-center space-y-4 rounded-2xl border bg-background p-6 text-center lg:w-72 lg:sticky lg:top-24">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bundle Price</span>
            <p className="text-2xl font-extrabold text-primary">
              ${bundleSubtotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              For {selectedCount} items selected
            </p>
          </div>

          <Button
            size="lg"
            className="group h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90"
            onClick={handleAddBundleToCart}
            disabled={addingToCart || selectedCount === 0}
          >
            {addingToCart ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
