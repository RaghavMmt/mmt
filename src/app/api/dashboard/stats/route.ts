import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const [totalProducts, totalBrands, totalCategories, totalSizes, purchaseOrders, totalSalesOrders, lowStockItems, monthlySales, totalInventory] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.size.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: { not: 'DELIVERED' } } }),
      prisma.salesOrder.count(),
      prisma.batch.count({ where: { quantity: { lt: 10 } } }),
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.batch.aggregate({ _sum: { quantity: true } })
    ])

    return NextResponse.json({
      totalBrands,
      totalCategories,
      totalSizes,
      totalProducts,
      totalInventory: totalInventory._sum.quantity || 0,
      monthlySales: monthlySales._sum.totalAmount || 0,
      purchaseOrders,
      salesOrders: totalSalesOrders,
      lowStockItems
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({
      totalBrands: 0,
      totalCategories: 0,
      totalSizes: 0,
      totalProducts: 0,
      totalInventory: 0,
      monthlySales: 0,
      purchaseOrders: 0,
      salesOrders: 0,
      lowStockItems: 0
    })
  }
}