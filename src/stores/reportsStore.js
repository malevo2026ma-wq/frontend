import { create } from "zustand"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { reportsService } from "../services/reportsService"

export const useReportsStore = create((set, get) => ({
  // Configuración de reportes
  dateRange: {
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  },
  selectedPeriod: "last30days",
  loading: false,
  error: null,

  // Datos de reportes
  salesData: [],
  topProducts: [],
  topCustomers: [],
  paymentMethods: [],
  categoryData: [],
  inventoryData: [],
  salesStats: {
    totalRevenue: 0,
    totalTransactions: 0,
    totalProducts: 0,
    averageTicket: 0,
    dailyAverage: 0,
    days: 0,
  },
  growthData: {
    revenue: 0,
    transactions: 0,
  },

  // Acciones
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setDateRange: (start, end) => {
    set({ dateRange: { start, end } })
    get().generateReports()
  },

  setPeriod: (period) => {
    set({ selectedPeriod: period })

    const today = new Date()
    let start, end

    switch (period) {
      case "today":
        start = end = format(today, "yyyy-MM-dd")
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        start = end = format(yesterday, "yyyy-MM-dd")
        break
      case "last7days":
        start = format(subDays(today, 7), "yyyy-MM-dd")
        end = format(today, "yyyy-MM-dd")
        break
      case "last30days":
        start = format(subDays(today, 30), "yyyy-MM-dd")
        end = format(today, "yyyy-MM-dd")
        break
      case "thisMonth":
        start = format(startOfMonth(today), "yyyy-MM-dd")
        end = format(endOfMonth(today), "yyyy-MM-dd")
        break
      case "lastMonth":
        const lastMonth = subDays(startOfMonth(today), 1)
        start = format(startOfMonth(lastMonth), "yyyy-MM-dd")
        end = format(endOfMonth(lastMonth), "yyyy-MM-dd")
        break
      case "thisYear":
        start = format(startOfYear(today), "yyyy-MM-dd")
        end = format(endOfYear(today), "yyyy-MM-dd")
        break
      default:
        start = format(subDays(today, 30), "yyyy-MM-dd")
        end = format(today, "yyyy-MM-dd")
    }

    set({ dateRange: { start, end } })
    get().generateReports()
  },

  generateReports: async () => {
    const { dateRange } = get()
    set({ loading: true, error: null })

    try {
      // Obtener todos los datos en paralelo
      const [
        statsResponse,
        dailyResponse,
        topProductsResponse,
        topCustomersResponse,
        inventoryResponse,
        categoryResponse,
        paymentMethodResponse,
      ] = await Promise.all([
        reportsService.getReportsStats({
          start_date: dateRange.start,
          end_date: dateRange.end,
        }),
        reportsService.getDailySalesReport(dateRange.start, dateRange.end),
        reportsService.getTopProducts({
          start_date: dateRange.start,
          end_date: dateRange.end,
          limit: 10,
        }),
        reportsService.getTopCustomers({
          start_date: dateRange.start,
          end_date: dateRange.end,
          limit: 10,
        }),
        reportsService.getInventoryReport(),
        reportsService.getSalesByCategory({
          start_date: dateRange.start,
          end_date: dateRange.end,
        }),
        reportsService.getSalesByPaymentMethod({
          start_date: dateRange.start,
          end_date: dateRange.end,
        }),
      ])

      // Procesar respuestas con manejo de errores mejorado
      const processResponse = (response, defaultValue = []) => {
        if (response?.data?.success) {
          return response.data.data
        }
        console.warn("Response not successful:", response?.data?.message)
        return defaultValue
      }

      // Procesar datos de estadísticas
      const statsData = processResponse(statsResponse, {})
      const stats = statsData || {}

      // Procesar datos diarios para el gráfico
      const dailyData = processResponse(dailyResponse, [])

      // ACTUALIZADO: Procesar productos top con información de unidades
      const products = processResponse(topProductsResponse, [])

      // Procesar clientes top
      const customers = processResponse(topCustomersResponse, [])

      // Procesar inventario
      const inventory = processResponse(inventoryResponse, { inventory: [], stats: {} })

      // Procesar categorías
      const categories = processResponse(categoryResponse, [])

      // Procesar métodos de pago
      const paymentMethods = processResponse(paymentMethodResponse, [])

      // Calcular estadísticas procesadas
      const totalRevenue = Number.parseFloat(stats.total_revenue) || 0
      const totalTransactions = Number.parseInt(stats.total_transactions) || 0
      const averageTicket = Number.parseFloat(stats.average_ticket) || 0
      const dailyAverage = dailyData.length > 0 ? totalRevenue / dailyData.length : 0

      // Calcular crecimiento (comparar primera mitad vs segunda mitad del período)
      const growthData = get().calculateGrowth(dailyData)

      // Procesar datos de categorías para el gráfico
      const processedCategories = categories.map((cat) => ({
        category: cat.category || cat.name,
        amount: Number.parseFloat(cat.amount || 0),
        percentage: Number.parseFloat(cat.percentage || 0),
        products: Number.parseInt(cat.products || 0),
        units_sold: Number.parseInt(cat.units_sold || 0),
      }))

      // Procesar métodos de pago
      const processedPaymentMethods = paymentMethods.map((pm) => ({
        method: get().getPaymentMethodLabel(pm.method),
        amount: Number.parseFloat(pm.amount || 0),
        percentage: Number.parseFloat(pm.percentage || 0),
        transactions: Number.parseInt(pm.transactions || 0),
      }))

      // Procesar productos top - solo enteros
      const processedProducts = products.map((product) => ({
        id: product.id,
        name: product.name,
        image: product.image,
        quantity: Number.parseInt(product.quantity || 0),
        revenue: Number.parseFloat(product.revenue || 0),
        margin: product.margin ? Number.parseFloat(product.margin) : get().calculateMargin(product.price, product.cost),
        sales_count: Number.parseInt(product.sales_count || 0),
        price: Number.parseFloat(product.price || 0),
        cost: Number.parseFloat(product.cost || 0),
      }))

      // Procesar clientes top
      const processedCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        purchases: Number.parseInt(customer.purchases || 0),
        amount: Number.parseFloat(customer.amount || 0),
        lastPurchase: customer.lastPurchase,
      }))

      // Procesar inventario - solo enteros
      const processedInventory = (inventory.inventory || []).map((item) => ({
        product: item.product,
        currentStock: Number.parseInt(item.currentStock || 0),
        minStock: Number.parseInt(item.minStock || 0),
        status: item.status || get().getStockStatus(item.currentStock, item.minStock),
        inventory_value: Number.parseFloat(item.inventory_value || 0),
      }))

      // Procesar datos diarios para el gráfico
      const processedSalesData = dailyData.map((day) => ({
        date: day.date,
        amount: Number.parseFloat(day.total_revenue || day.amount || 0),
        transactions: Number.parseInt(day.total_sales || day.transactions || 0),
        products: Number.parseInt(day.total_items_sold || day.products || 0),
      }))

      set({
        salesData: processedSalesData,
        topProducts: processedProducts,
        topCustomers: processedCustomers,
        paymentMethods: processedPaymentMethods,
        categoryData: processedCategories,
        inventoryData: processedInventory,
        salesStats: {
          totalRevenue,
          totalTransactions,
          totalProducts: Number.parseInt(stats.total_products_sold) || 0,
          averageTicket,
          dailyAverage,
          days: dailyData.length,
        },
        growthData,
        loading: false,
      })
    } catch (error) {
      console.error("Error generando reportes:", error)
      set({
        loading: false,
        error: error.response?.data?.message || error.message || "Error al generar reportes",
      })
    }
  },

  // Métodos auxiliares
  getPaymentMethodLabel: (method) => {
    const labels = {
      efectivo: "Efectivo",
      tarjeta_debito: "Tarjeta de Débito",
      tarjeta_credito: "Tarjeta de Crédito",
      transferencia: "Transferencia",
      cuenta_corriente: "Cuenta Corriente",
      multiple: "Múltiples Métodos", // NUEVO: Soporte para múltiples métodos
    }
    return labels[method] || method
  },

  calculateMargin: (price, cost) => {
    if (!price || !cost) return 0
    return Math.round(((price - cost) / price) * 100)
  },

  getStockStatus: (currentStock, minStock) => {
    if (currentStock === 0) return "critical"
    if (currentStock <= minStock) return "low"
    return "normal"
  },

  calculateGrowth: (dailyData) => {
    const growthData = { revenue: 0, transactions: 0 }
    if (dailyData.length >= 2) {
      const midPoint = Math.floor(dailyData.length / 2)
      const firstHalf = dailyData.slice(0, midPoint)
      const secondHalf = dailyData.slice(midPoint)

      const firstHalfRevenue = firstHalf.reduce((sum, day) => sum + Number.parseFloat(day.total_revenue || 0), 0)
      const secondHalfRevenue = secondHalf.reduce((sum, day) => sum + Number.parseFloat(day.total_revenue || 0), 0)

      const firstHalfTransactions = firstHalf.reduce((sum, day) => sum + Number.parseInt(day.total_sales || 0), 0)
      const secondHalfTransactions = secondHalf.reduce((sum, day) => sum + Number.parseInt(day.total_sales || 0), 0)

      if (firstHalfRevenue > 0) {
        growthData.revenue = ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100
      }
      if (firstHalfTransactions > 0) {
        growthData.transactions = ((secondHalfTransactions - firstHalfTransactions) / firstHalfTransactions) * 100
      }
    }
    return growthData
  },

  // Cálculos y estadísticas (mantener compatibilidad)
  getSalesStats: () => get().salesStats,
  getGrowthData: () => get().growthData,

  // NUEVO: Obtener estadísticas por tipo de unidad
  getUnitTypeStats: () => {
    const { topProducts, inventoryData } = get()

    const productStats = {
      kg_products: topProducts.filter((p) => p.unit_type === "kg").length,
      unit_products: topProducts.filter((p) => p.unit_type === "unidades").length,
      kg_revenue: topProducts.filter((p) => p.unit_type === "kg").reduce((sum, p) => sum + p.revenue, 0),
      unit_revenue: topProducts.filter((p) => p.unit_type === "unidades").reduce((sum, p) => sum + p.revenue, 0),
    }

    const inventoryStats = {
      kg_inventory: inventoryData.filter((i) => i.unit_type === "kg").length,
      unit_inventory: inventoryData.filter((i) => i.unit_type === "unidades").length,
    }

    return { ...productStats, ...inventoryStats }
  },

  // Exportación de datos
  exportData: (type, format = "csv") => {
    const { salesData, topProducts, topCustomers, categoryData, paymentMethods } = get()

    let data = []
    let filename = ""

    switch (type) {
      case "sales":
        data = salesData
        filename = `ventas_${format(new Date(), "yyyy-MM-dd")}`
        break
      case "products":
        // ACTUALIZADO: Incluir información de unidades en la exportación
        data = topProducts.map((product) => ({
          ...product,
          unit_type_label: product.unit_type === "kg" ? "Kilogramos" : "Unidades",
          quantity_formatted: `${product.quantity} ${product.unit_type === "kg" ? "kg" : "unidades"}`,
        }))
        filename = `productos_${format(new Date(), "yyyy-MM-dd")}`
        break
      case "customers":
        data = topCustomers
        filename = `clientes_${format(new Date(), "yyyy-MM-dd")}`
        break
      case "categories":
        data = categoryData
        filename = `categorias_${format(new Date(), "yyyy-MM-dd")}`
        break
      case "payment-methods":
        data = paymentMethods
        filename = `metodos_pago_${format(new Date(), "yyyy-MM-dd")}`
        break
      default:
        data = salesData
        filename = `reporte_${format(new Date(), "yyyy-MM-dd")}`
    }

    if (format === "csv") {
      const csv = get().convertToCSV(data)
      get().downloadCSV(csv, `${filename}.csv`)
    } else if (format === "json") {
      const json = JSON.stringify(data, null, 2)
      get().downloadJSON(json, `${filename}.json`)
    }
  },

  // Funciones auxiliares para exportación
  convertToCSV: (data) => {
    if (!data.length) return ""

    const headers = Object.keys(data[0]).join(",")
    const rows = data
      .map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" ? `"${value}"` : value))
          .join(","),
      )
      .join("\n")

    return `${headers}\n${rows}`
  },

  downloadCSV: (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  downloadJSON: (json, filename) => {
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },

  // Limpiar errores
  clearError: () => set({ error: null }),
}))
