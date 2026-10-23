import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItemType {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItemType[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.filter(item => item.label?.trim()).map((item, index) => (
            <BreadcrumbItem key={index} className="min-w-0 max-w-full">
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 mr-1 sm:mr-1.5" />
              {item.href ? (
                <BreadcrumbLink asChild className="min-w-0 [overflow-wrap:anywhere]">
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="min-w-0 [overflow-wrap:anywhere]">{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
