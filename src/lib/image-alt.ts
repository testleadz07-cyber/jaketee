import { productImageAlt as buildAlt } from './image-alt.mjs'

export function productImageAlt(productName: string, url: string, index: number): string {
  return buildAlt(productName, url, index)
}
