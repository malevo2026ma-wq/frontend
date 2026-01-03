import api from "@/config/api"

export const cashService = {
  // Obtener estado actual de la caja
  getCurrentStatus: async () => {
    console.log("🔄 Solicitando estado actual de caja...")
    try {
      const response = await api.get("/cash/status")
      console.log("📡 Respuesta completa recibida:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en getCurrentStatus:", error)
      if (error.code === "ECONNABORTED") {
        throw new Error("Tiempo de espera agotado. Verifica tu conexión.")
      } else if (error.response?.status === 404) {
        throw new Error("Endpoint no encontrado. Verifica la configuración del servidor.")
      } else if (error.response?.status >= 500) {
        throw new Error("Error del servidor. Intenta nuevamente en unos momentos.")
      }
      throw error
    }
  },

  // Abrir caja
  openCash: async (openingAmount, notes = "") => {
    console.log("🔓 Abriendo caja con monto:", openingAmount)
    try {
      const response = await api.post("/cash/open", {
        opening_amount: openingAmount,
        notes: notes,
      })
      console.log("📡 Respuesta de apertura:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en openCash:", error)
      throw error
    }
  },

  // CORREGIDO: Cerrar caja con parámetros más claros
  closeCash: async (notes = "", physicalCount = null) => {
    console.log("🔒 Cerrando caja...")
    const data = {
      closing_notes: notes || "",
    }

    // Si se proporciona un conteo físico, incluirlo
    if (physicalCount !== null && physicalCount !== undefined) {
      data.closing_amount = physicalCount
      data.compare_with_physical = true
      console.log("💰 Incluyendo conteo físico:", physicalCount)
    }

    try {
      const response = await api.post("/cash/close", data)
      console.log("📡 Respuesta de cierre:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en closeCash:", error)
      throw error
    }
  },

  // Obtener historial de caja
  getCashHistory: async (params = {}) => {
    console.log("📚 Solicitando historial de caja con parámetros:", params)

    const queryParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/cash/history?${queryString}` : "/cash/history"

    try {
      const response = await api.get(url)
      console.log("✅ Historial obtenido exitosamente:", response.data?.data?.history?.length || 0, "registros")
      return response.data
    } catch (error) {
      console.error("❌ Error obteniendo historial:", error)
      throw error
    }
  },

  // Obtener detalles de una sesión específica
  getSessionDetails: async (sessionId) => {
    console.log("🔍 Solicitando detalles de sesión:", sessionId)
    try {
      const response = await api.get(`/cash/sessions/${sessionId}`)
      console.log("📡 Respuesta de detalles:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en getSessionDetails:", error)
      throw error
    }
  },

  // Obtener movimientos de caja
  getMovements: async (params = {}) => {
    console.log("📝 Solicitando movimientos de caja...")

    const queryParams = new URLSearchParams()
    if (params.current_session_only === undefined) {
      params.current_session_only = "true"
    }

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        queryParams.append(key, params[key])
      }
    })

    const queryString = queryParams.toString()
    const url = queryString ? `/cash/movements?${queryString}` : "/cash/movements"

    try {
      const response = await api.get(url)
      console.log("📡 Respuesta de movimientos:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en getMovements:", error)
      throw error
    }
  },

  // Crear movimiento de caja
  addMovement: async (type, amount, description, reference = null) => {
    console.log("➕ Agregando movimiento:", { type, amount, description })
    try {
      const response = await api.post("/cash/movements", {
        type,
        amount,
        description,
        reference,
      })
      console.log("📡 Respuesta de movimiento:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en addMovement:", error)
      throw error
    }
  },

  // Obtener configuración
  getSettings: async () => {
    try {
      const response = await api.get("/cash/settings")
      console.log("📡 Respuesta de configuración:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en getSettings:", error)
      throw error
    }
  },

  // Actualizar configuración
  updateSettings: async (data) => {
    try {
      const response = await api.put("/cash/settings", data)
      console.log("📡 Respuesta de actualización:", response.status, response.data)
      return response.data
    } catch (error) {
      console.error("❌ Error en updateSettings:", error)
      throw error
    }
  },
}

export default cashService
