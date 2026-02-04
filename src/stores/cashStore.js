import { create } from "zustand"
import { persist } from "zustand/middleware"
import { cashService } from "../services/cashService"
import { clearCacheForUrl } from "../config/api" // Import the cache clearing function

export const useCashStore = create(
  persist(
    (set, get) => ({
      currentCash: {
        id: null,
        openingDate: null,
        openingAmount: 0,
        efectivoFisico: 0, // Solo efectivo que está físicamente en la caja
        totalGeneralCaja: 0,
        isOpen: false,
        openedBy: null,

        // Totales del día (simplificados)
        totalIngresosDia: 0, // TODO lo que entró hoy
        totalEgresosDia: 0, // TODO lo que salió hoy
        gananciaNeta: 0, // Ingresos - Egresos

        // Desglose para referencia
        ventasEfectivo: 0,
        ventasTarjetaCredito: 0,
        ventasTarjetaDebito: 0,
        ventasTarjeta: 0,
        ventasTransferencia: 0,
        totalVentas: 0,
        pagosCuentaCorriente: 0,
        depositos: 0,
        gastos: 0,
        retiros: 0,
        cancelaciones: 0,
        cantidadVentas: 0,
      },

      // Movimientos de caja
      cashMovements: [],

      // Historial de cierres
      cashHistory: [],
      historyPagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },

      // Configuración
      settings: {
        minCashAmount: 2000.0,
        maxCashAmount: 20000.0,
        autoCloseTime: "22:00",
        requireCountForClose: true,
        allowNegativeCash: false,
      },

      loading: false,
      error: null,
      isLoadingHistory: false,
      isLoadingStatus: false,
      lastStatusFetch: null,

      // Acciones
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      fetchCurrentStatus: async () => {
        const state = get()
        const now = Date.now()

        if (state.isLoadingStatus || (state.lastStatusFetch && now - state.lastStatusFetch < 2000)) {
          console.warn("⚠️ Evitando llamada múltiple al estado de caja")
          return state.currentCash
        }

        set({ loading: true, error: null, isLoadingStatus: true, lastStatusFetch: now })

        try {
          console.log("🔄 Cargando estado de caja...")
          const response = await cashService.getCurrentStatus()

          if (response && response.success === true) {
            const sessionData = response.data.session || {}
            const movements = Array.isArray(response.data.movements) ? response.data.movements : []
            const settings = response.data.settings || {}

            const newCashState = {
              id: sessionData.id || null,
              openingDate: sessionData.opening_date || null,
              openingAmount: Number(sessionData.opening_amount || 0),
              efectivoFisico: Number(sessionData.efectivo_fisico || 0),
              totalGeneralCaja: Number(sessionData.total_general_caja || 0),
              isOpen: Boolean(sessionData.status === "open"),
              openedBy: sessionData.opened_by_name || null,

              // Totales simplificados
              totalIngresosDia: Number(sessionData.total_ingresos_dia || 0),
              totalEgresosDia: Number(sessionData.total_egresos_dia || 0),
              gananciaNeta: Number(sessionData.ganancia_neta_dia || 0),

              // Desglose (crédito y débito por separado; no usar total como fallback para evitar duplicar)
              ventasEfectivo: Number(sessionData.ventas_efectivo || 0),
              ventasTarjetaCredito: Number(sessionData.ventas_tarjeta_credito ?? 0),
              ventasTarjetaDebito: Number(sessionData.ventas_tarjeta_debito ?? 0),
              ventasTarjeta: Number(
                (Number(sessionData.ventas_tarjeta_credito ?? 0) + Number(sessionData.ventas_tarjeta_debito ?? 0)) ||
                  sessionData.ventas_tarjeta ||
                  0,
              ),
              ventasTransferencia: Number(sessionData.ventas_transferencia || 0),
              totalVentas: Number(sessionData.total_ventas || 0),
              pagosCuentaCorriente: Number(sessionData.pagos_cuenta_corriente || 0),
              depositos: Number(sessionData.depositos || 0),
              gastos: Number(sessionData.gastos || 0),
              retiros: Number(sessionData.retiros || 0),
              cancelaciones: Number(sessionData.cancelaciones || 0),
              cantidadVentas: Number(sessionData.cantidad_ventas || 0),
            }

            set({
              currentCash: newCashState,
              cashMovements: movements,
              settings: {
                minCashAmount: Number(settings.min_cash_amount || 2000.0),
                maxCashAmount: Number(settings.max_cash_amount || 20000.0),
                autoCloseTime: settings.auto_close_time || "22:00",
                requireCountForClose: Boolean(settings.require_count_for_close ?? true),
                allowNegativeCash: Boolean(settings.allow_negative_cash ?? false),
              },
              loading: false,
              isLoadingStatus: false,
              error: null,
            })

            console.log("✅ Estado actualizado (SIMPLIFICADO):")
            console.log("💰 Total Ingresos del Día:", newCashState.totalIngresosDia)
            console.log("💵 Efectivo en Caja:", newCashState.efectivoFisico)
            console.log("💼 Total General de Caja:", newCashState.totalGeneralCaja)
            console.log("✅ Ganancia Neta:", newCashState.gananciaNeta)

            return newCashState
          } else {
            throw new Error(response?.message || "Error en la respuesta del servidor")
          }
        } catch (error) {
          console.error("💥 Error fetching cash status:", error)
          set({
            error: error.response?.data?.message || error.message || "Error al cargar el estado de caja",
            loading: false,
            isLoadingStatus: false,
          })
          throw error
        }
      },

      // Abrir caja
      openCash: async (openingAmount, notes = "") => {
        set({ loading: true, error: null })
        try {
          const response = await cashService.openCash(openingAmount, notes)
          if (response && response.success) {
            clearCacheForUrl("/cash/status")
            await get().fetchCurrentStatus()
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },

      closeCash: async (countData, notes = "") => {
        set({ loading: true, error: null })
        try {
          let physicalCount = null
          if (countData && (countData.bills || countData.coins)) {
            physicalCount = get().calculateCountedAmount(countData)
          } else if (countData && countData.physicalAmount !== undefined) {
            physicalCount = countData.physicalAmount
          }

          const response = await cashService.closeCash(notes, physicalCount)

          if (response && response.success) {
            set({ cashMovements: [] })
            clearCacheForUrl("/cash/status")
            await get().fetchCurrentStatus()
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },

      // Agregar movimiento
      addCashMovement: async (movement) => {
        set({ loading: true, error: null })
        try {
          const response = await cashService.addMovement(
            movement.type,
            movement.amount,
            movement.description,
            movement.reference,
          )

          if (response && response.success) {
            set((state) => ({
              cashMovements: [response.data, ...state.cashMovements],
              loading: false,
            }))
            clearCacheForUrl("/cash/status")
            await get().fetchCurrentStatus()
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },

      // Obtener movimientos
      fetchMovements: async (params = {}) => {
        set({ loading: true, error: null })
        try {
          const response = await cashService.getMovements(params)
          if (response && response.success) {
            set({
              cashMovements: response.data.movements,
              loading: false,
            })
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },

      // Obtener historial
      fetchHistory: async (params = {}) => {
        const state = get()
        if (state.isLoadingHistory) {
          console.warn("⚠️ Ya hay una solicitud de historial en progreso")
          return
        }

        set({ loading: true, error: null, isLoadingHistory: true })
        try {
          const response = await cashService.getCashHistory(params)
          if (response && response.success) {
            set({
              cashHistory: response.data.history || [],
              historyPagination: response.data.pagination || {
                page: 1,
                limit: 20,
                total: 0,
                pages: 0,
              },
              loading: false,
              isLoadingHistory: false,
            })
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message || "Error al cargar historial",
            loading: false,
            isLoadingHistory: false,
          })
          throw error
        }
      },

      // Obtener detalles de sesión
      fetchSessionDetails: async (sessionId) => {
        set({ loading: true, error: null })
        try {
          const response = await cashService.getSessionDetails(sessionId)
          if (response && response.success) {
            set({ loading: false })
            return response.data
          }
          throw new Error(response?.message || "Error al obtener detalles")
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },

      // Cálculo de arqueo físico
      calculateCountedAmount: (countData) => {
        const billsTotal = Object.entries(countData.bills || {}).reduce(
          (sum, [denomination, quantity]) => sum + Number.parseInt(denomination) * (Number.parseInt(quantity) || 0),
          0,
        )

        const coinsTotal = Object.entries(countData.coins || {}).reduce(
          (sum, [denomination, quantity]) => sum + Number.parseInt(denomination) * (Number.parseInt(quantity) || 0),
          0,
        )

        return billsTotal + coinsTotal
      },

      getClosingSummary: () => {
        const state = get()

        return {
          efectivoFisico: state.currentCash.efectivoFisico,
          totalGeneralCaja: state.currentCash.totalGeneralCaja,
          totalIngresos: state.currentCash.totalIngresosDia,
          totalEgresos: state.currentCash.totalEgresosDia,
          gananciaNeta: state.currentCash.gananciaNeta,

          // Desglose detallado
          desglose: {
            ventasEfectivo: state.currentCash.ventasEfectivo,
            ventasTarjetaCredito: state.currentCash.ventasTarjetaCredito,
            ventasTarjetaDebito: state.currentCash.ventasTarjetaDebito,
            ventasTarjeta: state.currentCash.ventasTarjeta,
            ventasTransferencia: state.currentCash.ventasTransferencia,
            pagosCuentaCorriente: state.currentCash.pagosCuentaCorriente,
            depositos: state.currentCash.depositos,
            gastos: state.currentCash.gastos,
            retiros: state.currentCash.retiros,
            cancelaciones: state.currentCash.cancelaciones,
          },

          openingAmount: state.currentCash.openingAmount,
          cantidadVentas: state.currentCash.cantidadVentas,
        }
      },

      // Configuración
      fetchSettings: async () => {
        try {
          const response = await cashService.getSettings()
          if (response && response.success) {
            set({
              settings: {
                minCashAmount: Number(response.data.min_cash_amount || 2000.0),
                maxCashAmount: Number(response.data.max_cash_amount || 20000.0),
                autoCloseTime: response.data.auto_close_time || "22:00",
                requireCountForClose: Boolean(response.data.require_count_for_close ?? true),
                allowNegativeCash: Boolean(response.data.allow_negative_cash ?? false),
              },
            })
          }
          return response
        } catch (error) {
          console.error("Error fetching settings:", error)
          throw error
        }
      },

      updateSettings: async (newSettings) => {
        set({ loading: true, error: null })
        try {
          const response = await cashService.updateSettings(newSettings)
          if (response && response.success) {
            await get().fetchSettings()
          }
          return response
        } catch (error) {
          set({
            error: error.response?.data?.message || error.message,
            loading: false,
          })
          throw error
        }
      },
    }),
    {
      name: "cash-storage",
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
)
