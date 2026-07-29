import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { connectDB } from '@/lib/mongodb'
import Product from '@/models/Product'
import Order from '@/models/Order'
import User from '@/models/User'
import { getStaticProducts } from '@/lib/static-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    if (db) {
      // 1. Core Counts
      const totalProducts = await Product.countDocuments()
      const totalOrders = await Order.countDocuments()
      const customerCount = await User.countDocuments({ role: 'customer' })

      const orders = await Order.find({}).lean()
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0)

      // 2. Revenue Chart (Last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const chartData: Array<{
        date: string
        revenue: number
        ordersCount: number
        timestamp: number
      }> = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        chartData.push({
          date: label,
          revenue: 0,
          ordersCount: 0,
          timestamp: new Date(d.setHours(0, 0, 0, 0)).getTime()
        })
      }

      const activeOrders = orders.filter(o => o.status !== 'cancelled' && new Date(o.createdAt) >= sevenDaysAgo)
      activeOrders.forEach(order => {
        const orderTime = new Date(order.createdAt)
        orderTime.setHours(0, 0, 0, 0)
        const day = chartData.find(c => c.timestamp === orderTime.getTime())
        if (day) {
          day.revenue += order.total
          day.ordersCount += 1
        }
      })

      const revenueChart = chartData.map(({ date, revenue, ordersCount }) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
        orders: ordersCount
      }))

      // 3. Status Split
      const statusCounts: Record<string, number> = {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      }
      orders.forEach(o => {
        if (statusCounts[o.status] !== undefined) {
          statusCounts[o.status]++
        }
      })
      const statusSplit = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))

      // 4. Top Products
      const productSales: Record<string, { name: string; quantity: number; revenue: number; image: string }> = {}
      orders.forEach(order => {
        if (order.status !== 'cancelled') {
          order.items.forEach(item => {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
                image: item.image
              }
            }
            productSales[item.productId].quantity += item.quantity
            productSales[item.productId].revenue += item.price * item.quantity
          })
        }
      })

      let topProducts = Object.entries(productSales)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          quantity: stats.quantity,
          revenue: Math.round(stats.revenue * 100) / 100,
          image: stats.image
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      if (topProducts.length === 0) {
        const dbProdList = await Product.find({}).limit(5).lean()
        topProducts = dbProdList.map((p: any) => ({
          id: String(p._id),
          name: p.name,
          quantity: 0,
          revenue: 0,
          image: p.images?.[0]?.url || '/placeholder.png'
        }))
      }

      // 5. Recent 5 Orders
      const recentOrders = await Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()

      const mappedRecentOrders = recentOrders.map((o: any) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        total: o.total,
        userEmail: o.userEmail,
        userName: o.userName
      }))

      return NextResponse.json({
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        customerCount,
        revenueChart,
        statusSplit,
        topProducts,
        recentOrders: mappedRecentOrders
      })
    }

    // Mock Fallback
    const staticProducts = getStaticProducts()
    const mockRevenueChart = [
      { date: 'Jun 16', revenue: 120.0, orders: 1 },
      { date: 'Jun 17', revenue: 340.5, orders: 2 },
      { date: 'Jun 18', revenue: 0, orders: 0 },
      { date: 'Jun 19', revenue: 890.99, orders: 3 },
      { date: 'Jun 20', revenue: 140.0, orders: 1 },
      { date: 'Jun 21', revenue: 560.5, orders: 2 },
      { date: 'Jun 22', revenue: 780.0, orders: 3 }
    ]

    const mockStatusSplit = [
      { name: 'Pending', value: 1 },
      { name: 'Paid', value: 5 },
      { name: 'Shipped', value: 2 },
      { name: 'Delivered', value: 10 },
      { name: 'Cancelled', value: 1 }
    ]

    const mockTopProducts = staticProducts.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      quantity: Math.floor(Math.random() * 15) + 5,
      revenue: p.price * (Math.floor(Math.random() * 15) + 5),
      image: p.images[0]?.url || '/placeholder.png'
    }))

    const mockRecentOrders = [
      {
        id: 'mock-1',
        orderNumber: 'LX-1719000000000',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'paid',
        total: 189.99,
        userEmail: 'customer@example.com',
        userName: 'John Customer'
      },
      {
        id: 'mock-2',
        orderNumber: 'LX-1718900000000',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'delivered',
        total: 320.50,
        userEmail: 'alice@example.com',
        userName: 'Alice Smith'
      }
    ]

    return NextResponse.json({
      totalProducts: staticProducts.length,
      totalOrders: 19,
      totalRevenue: 2850.99,
      customerCount: 15,
      revenueChart: mockRevenueChart,
      statusSplit: mockStatusSplit,
      topProducts: mockTopProducts,
      recentOrders: mockRecentOrders
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
