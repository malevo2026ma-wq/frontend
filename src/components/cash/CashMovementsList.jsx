"use client"

import { useState, useEffect } from "react"
import { useCashStore } from "@/stores/cashStore"
import { formatCurrency, formatDateTime } from "@/lib/formatters"
import {
  ListBulletIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline"

const CashMovementsList = () => {
  const { cashMovements, fetchMovements, loading } = useCashStore()
  const [filters, setFilters] = useState({
    type: "",
    start_date: "",
    end_date: "",
  })

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    fetchMovements(filters)
  }

  const handleClearFilters = () => {
    setFilters({ type: "", start_date: "", end_date: "" })
    fetchMovements()
  }

  const getMovementIcon = (type, paymentMethod, description) => {
    switch (type) {
      case "opening":
        return <BanknotesIcon className="h-5 w-5 text-green-600" />
      case "closing":
        return <BanknotesIcon className="h-5 w-5 text-red-600" />
      case "sale":
        return <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
      case "deposit":
        // CORREGIDO: Distinguir entre depósitos normales y pagos de cuenta corriente
        if (description && (
          description.toLowerCase().includes("cuenta corriente") ||
          description.toLowerCase().includes("pago cuenta") ||
          description.toLowerCase().includes("cta cte") ||
          description.toLowerCase().includes("cta. cte")
        )) {
          return <ReceiptPercentIcon className="h-5 w-5 text-indigo-600" />
        }
        return <PlusIcon className="h-5 w-5 text-green-600" />
      case "withdrawal":
        return <MinusIcon className="h-5 w-5 text-orange-600" />
      case "expense":
        return <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
      case "cancellation":
        return <MinusIcon className="h-5 w-5 text-red-500" />
      default:
        return <ListBulletIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getMovementLabel = (type, description, paymentMethod) => {
    const labels = {
      opening: "Apertura",
      closing: "Cierre",
      sale: "Venta",
      deposit: description && (
        description.toLowerCase().includes("cuenta corriente") ||
        description.toLowerCase().includes("pago cuenta") ||
        description.toLowerCase().includes("cta cte") ||
        description.toLowerCase().includes("cta. cte")
      ) ? `Pago Cta. Cte. (${getPaymentMethodLabel(paymentMethod)})` : "Ingreso",
      withdrawal: "Retiro",
      expense: "Gasto",
      cancellation: "Cancelación",
    }
    return labels[type] || type
  }

  const getMovementColor = (amount, type) => {
    if (type === "cancellation") return "text-red-500"
    if (amount > 0) return "text-green-600"
    if (amount < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      efectivo: "Efectivo",
      tarjeta_credito: "Tarjeta Crédito",
      tarjeta_debito: "Tarjeta Débito",
      transferencia: "Transferencia",
      multiple: "Múltiple",
    }
    return labels[method] || method
  }

  // CORREGIDO: Función para determinar si un movimiento afecta el efectivo físico
  const affectsPhysicalCash = (type, paymentMethod, description) => {
    switch (type) {
      case "opening":
      case "closing":
      case "withdrawal":
      case "expense":
        return true
      case "deposit":
        // CORREGIDO: Los pagos de cuenta corriente solo afectan efectivo físico si son en efectivo
        if (description && (
          description.toLowerCase().includes("cuenta corriente") ||
          description.toLowerCase().includes("pago cuenta") ||
          description.toLowerCase().includes("cta cte") ||
          description.toLowerCase().includes("cta. cte")
        )) {
          return paymentMethod === "efectivo"
        }
        // Otros depósitos siempre afectan efectivo físico
        return true
      case "sale":
        return paymentMethod === "efectivo"
      case "cancellation":
        return paymentMethod === "efectivo"
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            >
              <option value="">Todos los tipos</option>
              <option value="opening">Apertura</option>
              <option value="closing">Cierre</option>
              <option value="sale">Venta</option>
              <option value="deposit">Ingreso/Pago</option>
              <option value="withdrawal">Retiro</option>
              <option value="expense">Gasto</option>
              <option value="cancellation">Cancelación</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {loading ? "Buscando..." : "Filtrar"}
            </button>
            <button
              onClick={handleClearFilters}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de movimientos */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span className="text-gray-600">Cargando movimientos...</span>
          </div>
        ) : cashMovements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-medium">No hay movimientos registrados</p>
            <p className="text-sm">Los movimientos aparecerán aquí cuando se realicen</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Afecta Caja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMovementIcon(movement.type, movement.payment_method, movement.description)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {getMovementLabel(movement.type, movement.description, movement.payment_method)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{movement.description}</div>
                      {movement.reference && <div className="text-sm text-gray-500">Ref: {movement.reference}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {movement.payment_method ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPaymentMethodLabel(movement.payment_method)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getMovementColor(movement.amount, movement.type)}`}>
                        {Number(movement.amount) > 0 ? "+" : ""}
                        {formatCurrency(movement.amount || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {affectsPhysicalCash(movement.type, movement.payment_method, movement.description) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ✗ No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(movement.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{movement.user_name || "N/A"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CashMovementsList
