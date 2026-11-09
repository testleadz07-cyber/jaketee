import Invoice from '@/models/Invoice'
import { invoiceFromOrder } from './invoice-data'
import type { InvoiceOrderData } from './invoice-pdf'

/** Call only after authorizing access to the underlying order. */
export async function getCurrentInvoice(order: InvoiceOrderData & { _id: unknown }): Promise<InvoiceOrderData> {
  const saved = await Invoice.findById(order._id).select('data').lean()
  return saved ? (saved as unknown as { data: InvoiceOrderData }).data : invoiceFromOrder(order)
}
