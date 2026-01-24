"use client"

import { useState, useEffect, useCallback } from "react"
import { useSalesStore } from "../../stores/salesStore"
import { formatCurrency, formatDate, formatQuantity } from "../../lib/formatters"
import {
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  CubeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline"
import LoadingSpinner from "../common/LoadingSpinner"
import SaleDetailModal from "./SaleDetailModal"
import Pagination from "../common/Pagination"
import Card from "../common/Card"
import SalesHistorySearch from "./SalesHistorySearch"

const SalesHistoryTable = () => {
  const { sales, loading, error, fetchSales, pagination } = useSalesStore()
  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    payment_method: "",
    customer_id: "",
    start_date: "",
    end_date: "",
    page: 1,
    limit: 25,
  })

  // Cargar ventas cuando cambien los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = {
        page: filters.page,
        limit: filters.limit,
      }

      // Aplicar filtros de búsqueda
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      if (filters.status) {
        params.status = filters.status
      }

      if (filters.payment_method) {
        params.payment_method = filters.payment_method
      }

      if (filters.customer_id) {
        params.customer_id = filters.customer_id
      }

      if (filters.start_date) {
        params.start_date = filters.start_date
      }

      if (filters.end_date) {
        params.end_date = filters.end_date
      }

      fetchSales(params)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, fetchSales])

  // Función para manejar cambio de página
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }, [])

  // Función para manejar cambio de elementos por página
  const handleItemsPerPageChange = useCallback((newLimit, newPage = 1) => {
    setFilters((prev) => ({
      ...prev,
      limit: newLimit,
      page: newPage,
    }))
  }, [])

  // Función para manejar cambios en filtros
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Resetear a la primera página cuando cambien los filtros
    }))
  }, [])

  // Función para manejar búsqueda
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query)
    setFilters((prev) => ({ ...prev, page: 1 })) // Resetear página en búsqueda
  }, [])

  const getStatusIcon = (status) => {
    return status === "completed" ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
    return status === "completed"
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "efectivo":
        return <BanknotesIcon className="h-3 w-3" />
      case "tarjeta_credito":
        return <CreditCardIcon className="h-3 w-3" />
      case "transferencia":
        return <BuildingLibraryIcon className="h-3 w-3" />
      case "cuenta_corriente":
        return <DevicePhoneMobileIcon className="h-3 w-3" />
      case "multiple":
        return <CreditCardIcon className="h-3 w-3 text-purple-600" />
      default:
        return <CreditCardIcon className="h-3 w-3" />
    }
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      efectivo: "Efectivo",
      tarjeta_credito: "T. Crédito",
      transferencia: "Transferencia",
      cuenta_corriente: "Cta. Corriente",
      multiple: "Múltiple",
    }
    return labels[method] || method
  }

  // ACTUALIZADO: Función para renderizar métodos de pago múltiples
  const renderPaymentMethods = (sale) => {
    if (sale.payment_method === "multiple" && sale.payment_methods_formatted) {
      return (
        <div className="space-y-1">
          {sale.payment_methods_formatted.slice(0, 2).map((pm, index) => (
            <div key={index} className="flex items-center text-xs">
              {getPaymentMethodIcon(pm.method)}
              <span className="ml-1 truncate">{getPaymentMethodLabel(pm.method)}</span>
            </div>
          ))}
          {sale.payment_methods_formatted.length > 2 && (
            <div className="text-xs text-gray-500">+{sale.payment_methods_formatted.length - 2} más</div>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-xs text-gray-900">
          {getPaymentMethodIcon(sale.payment_method)}
          <span className="ml-1 truncate">{getPaymentMethodLabel(sale.payment_method)}</span>
        </div>
      )
    }
  }

  // Función para renderizar resumen de productos - solo unidades
  const renderProductsSummary = (sale) => {
    if (!sale.items || sale.items.length === 0) {
      return (
        <div className="text-xs text-gray-500">
          {sale.items_count || 0} item{(sale.items_count || 0) !== 1 ? "s" : ""}
        </div>
      )
    }

    // Sumar todas las cantidades
    const totalQuantity = sale.items.reduce((acc, item) => {
      return acc + (Number.parseInt(item.quantity) || 0)
    }, 0)

    return (
      <div className="space-y-1">
        <div className="flex items-center text-xs text-gray-600">
          <CubeIcon className="h-3 w-3 mr-1 text-green-600" />
          <span className="truncate">{formatQuantity(totalQuantity)}</span>
        </div>
        <div className="text-xs text-gray-400">
          {sale.items.length} producto{sale.items.length !== 1 ? "s" : ""}
        </div>
      </div>
    )
  }

  const handleViewSale = (saleId) => {
    setSelectedSaleId(saleId)
    setShowDetailModal(true)
  }

  const handlePrintSale = (saleId) => {
    // Abrir el modal de detalles pero con el modal de impresión listo
    setSelectedSaleId(saleId)
    setShowDetailModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedSaleId(null)
  }

  const handleSaleUpdated = () => {
    // Recargar las ventas después de una actualización (como cancelación)
    const params = {
      page: filters.page,
      limit: filters.limit,
    }
    if (searchQuery.trim()) params.search = searchQuery.trim()
    if (filters.status) params.status = filters.status
    if (filters.payment_method) params.payment_method = filters.payment_method
    fetchSales(params, true)
  }

  const hasActiveFilters =
    searchQuery ||
    filters.status ||
    filters.payment_method ||
    filters.customer_id ||
    filters.start_date ||
    filters.end_date

  if (loading && sales.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Cargando historial de ventas...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="text-center text-red-600 p-8">
          <p className="font-medium">Error al cargar el historial</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => handleSaleUpdated()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Búsqueda y filtros mejorados */}
      <SalesHistorySearch
        onSearch={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        filters={filters}
      />

      {/* Tabla de ventas optimizada para pantallas grandes */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Historial de Ventas
              {pagination.total > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({pagination.total.toLocaleString()} total)
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSaleUpdated()}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                title="Actualizar"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              {hasActiveFilters && <span className="text-sm text-gray-500">Mostrando resultados filtrados</span>}
            </div>
          </div>
        </div>

        {/* Tabla optimizada sin scroll horizontal en pantallas grandes */}
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Cliente
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Pago
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Productos
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Estado
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Cajero
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Cargando ventas...</p>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-lg font-medium">No se encontraron ventas</div>
                    <p className="text-sm">
                      {hasActiveFilters
                        ? "Intenta ajustar los filtros de búsqueda"
                        : "Aún no hay ventas registradas"}
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{sale.id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 truncate max-w-32" title={sale.customer_name || "Cliente general"}>
                        {sale.customer_name || "Cliente general"}
                      </div>
                      {sale.customer_document && (
                        <div className="text-xs text-gray-500 truncate">{sale.customer_document}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(sale.total)}</div>
                      {sale.discount > 0 && (
                        <div className="text-xs text-gray-500">-{formatCurrency(sale.discount)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">{renderPaymentMethods(sale)}</td>
                    <td className="px-3 py-3">{renderProductsSummary(sale)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(sale.status)}
                        <span className={`ml-1 ${getStatusBadge(sale.status)}`}>
                          {sale.status === "completed" ? "OK" : "X"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(sale.created_at)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.created_at).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 truncate max-w-24" title={sale.cashier_name || "Sistema"}>
                        {sale.cashier_name || "Sistema"}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewSale(sale.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            loading={loading}
          />
        )}
      </Card>

      {/* Modal de detalle */}
      <SaleDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseModal}
        saleId={selectedSaleId}
        onSaleUpdated={handleSaleUpdated}
      />
    </div>
  )
}

export default SalesHistoryTable
