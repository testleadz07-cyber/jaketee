'use client'
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

export function Test() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const showDropdown = isOpen
  const isSearching = false
  const suggestions: any[] = []
  const handleSearchSubmit = (e: any) => {}

  return (
    <div ref={searchContainerRef} className="relative hidden flex-1 max-w-sm md:block">
      <form onSubmit={handleSearchSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border bg-popover shadow-lg"
          >
            hi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
