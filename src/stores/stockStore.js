import { create } from "zustand"
import { productsService } from "../services/productsService"
import { STOCK_MOVEMENTS } from "../lib/constants"

export const useStockStore = create((set, get) => ({
  // Movimientos de stock
  stockMovements: [],
  loading: false,
  error: null,
  lastFetchMovements: null,
  lastParamsKey: null,
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  },

  // Alertas de stock
  stockAlerts: [],
  lastFetchAlerts: null,

  // Estadísticas
  stats: {
    general: {},
    monthly_movements: [],
    low_stock_products: [],
  },
  lastFetchStats: null,

  // Acciones
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Obtener movimientos de stock con paginación
  fetchStockMovements: async (params = {}, forceRefresh = false) => {
    const state = get()

    if (state.loading && !forceRefresh) {
      return state.stockMovements
    }

    // Cache inteligente: solo usar cache si los parámetros son iguales
    const now = Date.now()
    const cacheTime = 15 * 1000 // 15 segundos para movimientos
    const paramsKey = JSON.stringify(params)

    if (
      !forceRefresh &&
      state.lastFetchMovements &&
      now - state.lastFetchMovements < cacheTime &&
      state.lastParamsKey === paramsKey &&
      state.stockMovements.length > 0
    ) {
      return state.stockMovements
    }

    set({ loading: true, error: null })
    try {
      const response = await productsService.getStockMovements(params)

      const transformedMovements = response.data.data.movements.map((movement) => ({
        id: movement.id,
        productId: movement.product_id,
        type: movement.type,
        quantity: movement.quantity,
        previousStock: movement.previous_stock,
        newStock: movement.new_stock,
        reason: movement.reason,
        date: movement.created_at,
        user: movement.user_name || "Sistema",
        product_name: movement.product_name,
        product_image: movement.product_image,
      }))

      set({
        stockMovements: transformedMovements,
        pagination: response.data.data.pagination,
        loading: false,
        lastFetchMovements: now,
        lastParamsKey: paramsKey,
      })
      return transformedMovements
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al cargar movimientos",
        loading: false,
      })
      throw error
    }
  },

  // Crear movimiento de stock
  addStockMovement: async (movementData) => {
    set({ loading: true, error: null })
    try {
      const response = await productsService.createStockMovement(movementData)

      // No agregar automáticamente al estado porque puede cambiar la paginación
      // El componente debe recargar los datos
      set({ loading: false })

      // Actualizar alertas después del movimiento
      get().fetchStockAlerts(true)

      return response.data.data
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || "Error al crear movimiento",
        loading: false,
      })
      throw error
    }
  },

  // Obtener alertas de stock con caching
  fetchStockAlerts: async (forceRefresh = false) => {
    const state = get()

    // Cache por 30 segundos para alertas
    const now = Date.now()
    const cacheTime = 30 * 1000
    if (
      !forceRefresh &&
      state.lastFetchAlerts &&
      now - state.lastFetchAlerts < cacheTime &&
      state.stockAlerts.length >= 0
    ) {
      return state.stockAlerts
    }

    try {
      const response = await productsService.getStockAlerts(50)

      const alerts = response.data.data.map((alert) => ({
        id: alert.id,
        productId: alert.id,
        productName: alert.name,
        currentStock: alert.stock,
        threshold: alert.min_stock,
        level: alert.level,
        message: alert.level === "critical" ? "Stock crítico" : "Stock bajo",
      }))

      set({
        stockAlerts: alerts,
        lastFetchAlerts: now,
      })
      return alerts
    } catch (error) {
      console.error("Error al obtener alertas:", error)
      set({ stockAlerts: [] })
    }
  },

  // Obtener estadísticas con caching
  fetchStockStats: async (forceRefresh = false) => {
    const state = get()

    // Cache por 60 segundos para estadísticas
    const now = Date.now()
    const cacheTime = 60 * 1000
    if (
      !forceRefresh &&
      state.lastFetchStats &&
      now - state.lastFetchStats < cacheTime &&
      Object.keys(state.stats.general).length > 0
    ) {
      return state.stats
    }

    try {
      const response = await productsService.getStockStats()
      set({
        stats: response.data.data,
        lastFetchStats: now,
      })
      return response.data.data
    } catch (error) {
      console.error("Error al obtener estadísticas:", error)
      set({ stats: { general: {}, monthly_movements: [], low_stock_products: [] } })
    }
  },

  // Obtener estadísticas de stock (método de compatibilidad)
  getStockStats: () => {
    const { stats } = get()
    const monthlyMovements = stats.monthly_movements || []

    const entriesThisMonth = monthlyMovements
      .filter((m) => m.type === STOCK_MOVEMENTS.ENTRADA)
      .reduce((sum, m) => sum + (m.total_quantity || 0), 0)

    const exitsThisMonth = monthlyMovements
      .filter((m) => m.type === STOCK_MOVEMENTS.SALIDA)
      .reduce((sum, m) => sum + (m.total_quantity || 0), 0)

    return {
      totalMovements: get().stockMovements.length,
      entriesThisMonth,
      exitsThisMonth,
      alertsCount: get().stockAlerts.length,
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null }),

  // Resetear estado
  reset: () =>
    set({
      stockMovements: [],
      loading: false,
      error: null,
      lastFetchMovements: null,
      lastParamsKey: null,
      pagination: {
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      },
      stockAlerts: [],
      lastFetchAlerts: null,
      stats: {
        general: {},
        monthly_movements: [],
        low_stock_products: [],
      },
      lastFetchStats: null,
    }),
}))
