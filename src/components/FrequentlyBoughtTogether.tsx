'use client'

import { useState, useEffect } from 'react'
import { Plus, ShoppingCart, Check, Loader2 } from 'lucide-react'
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

  const handleVariantChange = (productId: string, variantName: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variantName]: value
      }
    }))
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

  const groupVariants = (variants: any[]) => {
    const list = variants || []
    return list.reduce((acc, variant) => {
      if (!acc[variant.name]) {
        acc[variant.name] = []
      }
      if (!acc[variant.name].some((v: any) => v.value === variant.value)) {
        acc[variant.name].push(variant)
      }
      return acc
    }, {} as Record<string, any[]>)
  }

  const renderProductItem = (product: Product, isCurrent = false) => {
    const prodId = product.id || product._id || ''
    const isChecked = !!selectedItems[prodId]
    const grouped = groupVariants(product.variants || [])
    const currentSelections = selectedVariants[prodId] || {}

    return (
      <div key={prodId} className={`flex flex-col sm:flex-row items-center gap-4 bg-background border p-4 rounded-2xl relative transition-all duration-300 ${isChecked ? 'border-primary/50 shadow-sm' : 'opacity-60 border-border'}`}>
        <div className="absolute top-4 left-4 z-10">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => handleCheckboxChange(prodId, !!checked)}
            className="rounded-md h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
        
        <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-muted flex-shrink-0 border-2 mt-4 sm:mt-0">
          <img src={product.images?.[0]?.url || '/placeholder.png'} alt={product.name} className="object-cover w-full h-full" />
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h4 className="font-semibold text-sm line-clamp-1">{product.name}</h4>
          <p className="text-primary font-bold text-sm">
            ${getProductPrice(product).toFixed(2)}
          </p>

          {/* Variant selections */}
          {isChecked && Object.keys(grouped).map(name => (
            <div key={name} className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{name}:</span>
              <select
                value={currentSelections[name] || ''}
                onChange={(e) => handleVariantChange(prodId, name, e.target.value)}
                className="text-xs bg-muted/50 border border-muted focus:border-primary rounded px-2 py-0.5"
              >
                {grouped[name].map((v, idx) => (
                  <option key={v.id || `${name}-${v.value}-${idx}`} value={v.value} disabled={!v.inStock}>
                    {v.value} {v.priceAdjust > 0 ? `(+$${v.priceAdjust})` : ''} {!v.inStock ? '(Out of Stock)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/40 backdrop-blur-sm border-2 rounded-3xl p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Frequently Bought Together</h3>
        <p className="text-xs text-muted-foreground mt-1">Get the complete set and elevate your look</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Products List row */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-4 w-full">
          {renderProductItem(currentProduct, true)}

          {bundleProducts.map(p => (
            <div key={p.id || p._id} className="flex flex-col md:flex-row items-center gap-4 w-full">
              <div className="flex items-center justify-center bg-muted/20 border-2 rounded-full h-8 w-8 text-muted-foreground font-bold shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              {renderProductItem(p)}
            </div>
          ))}
        </div>

        {/* Bundle buy panel */}
        <div className="w-full lg:w-72 bg-background border p-6 rounded-2xl flex flex-col justify-center space-y-4 shrink-0 text-center">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bundle Price</span>
            <p className="text-2xl font-extrabold text-primary">
              ${bundleSubtotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              For {selectedCount} items selected
            </p>
          </div>

          <Button
            size="lg"
            className="w-full h-12 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground group"
            onClick={handleAddBundleToCart}
            disabled={addingToCart || selectedCount === 0}
          >
            {addingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            )}
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
