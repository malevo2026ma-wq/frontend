"use client"

import { useState, useEffect, useCallback } from "react"
import { useStockStore } from "../../stores/stockStore"
import { useProductStore } from "../../stores/productStore"
import { formatDateTime, formatMovementQuantity } from "../../lib/formatters"
import { STOCK_MOVEMENTS, STOCK_MOVEMENT_LABELS } from "../../lib/constants"
import Card from "../common/Card"
import Pagination from "../common/Pagination"
import MovementSearchFilters from "./MovementSearchFilters"
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  CubeIcon,
  UserIcon,
  ArrowsRightLeftIcon,
  ScaleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline"

const StockMovementsList = () => {
  const { stockMovements, fetchStockMovements, loading, pagination } = useStockStore()
  const { products, fetchProducts } = useProductStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "",
    dateRange: { start: "", end: "" },
    page: 1,
    limit: 25,
  })

  // Cargar productos iniciales
  useEffect(() => {
    fetchProducts({ active: "true" })
  }, [fetchProducts])

  // Cargar movimientos cuando cambien los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = {
        page: filters.page,
        limit: filters.limit,
      }

      // Filtro por búsqueda de producto
      if (searchQuery.trim()) {
        const product = products.find(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        if (product) {
          params.product_id = product.id
        }
      }

      // Filtro por tipo
      if (filters.type) {
        params.type = filters.type
      }

      // Filtro por fechas
      if (filters.dateRange.start) {
        params.start_date = filters.dateRange.start
      }
      if (filters.dateRange.end) {
        params.end_date = filters.dateRange.end
      }

      fetchStockMovements(params)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, fetchStockMovements, products])

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
      page: 1, // Resetear página cuando cambien los filtros
    }))
  }, [])

  // Función para manejar búsqueda
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query)
    setFilters((prev) => ({ ...prev, page: 1 }))
  }, [])

  const getMovementIcon = (type) => {
    switch (type) {
      case STOCK_MOVEMENTS.ENTRADA:
        return ArrowTrendingUpIcon
      case STOCK_MOVEMENTS.SALIDA:
        return ArrowTrendingDownIcon
      case STOCK_MOVEMENTS.AJUSTE:
        return AdjustmentsHorizontalIcon
      default:
        return ArrowsRightLeftIcon
    }
  }

  const getMovementColor = (type) => {
    switch (type) {
      case STOCK_MOVEMENTS.ENTRADA:
        return "text-green-600 bg-green-50"
      case STOCK_MOVEMENTS.SALIDA:
        return "text-red-600 bg-red-50"
      case STOCK_MOVEMENTS.AJUSTE:
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getProductInfo = (movement) => {
    // Usar la información que ya viene del backend con cada movimiento
    return {
      name: movement.product_name || "Producto eliminado",
      description: "", // El backend no incluye description en los movimientos por performance
      image: movement.product_image || null,
    }
  }

  const hasActiveFilters = searchQuery || filters.type || filters.dateRange.start || filters.dateRange.end

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <MovementSearchFilters
        onSearch={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        searchQuery={searchQuery}
        filters={filters}
        products={products}
      />

      {/* Tabla de movimientos */}
      <Card>
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Movimientos
              {pagination.total > 0 && (
                <span className="ml-2 text-sm text-gray-500">({pagination.total.toLocaleString()} total)</span>
              )}
            </h3>
            {hasActiveFilters && <span className="text-sm text-gray-500">Mostrando resultados filtrados</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Anterior
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Nuevo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Razón
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Cargando movimientos...</p>
                  </td>
                </tr>
              ) : stockMovements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <ArrowsRightLeftIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No se encontraron movimientos</p>
                    <p className="text-sm">
                      {hasActiveFilters
                        ? "Intenta ajustar los filtros de búsqueda"
                        : "Aún no hay movimientos registrados. Para crear un movimiento, ve a la tabla de productos y usa el botón de acción."}
                    </p>
                  </td>
                </tr>
              ) : (
                stockMovements.map((movement) => {
                  const MovementIcon = getMovementIcon(movement.type)
                  const product = getProductInfo(movement)

                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDateTime(movement.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PhotoIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center">
                              <CubeIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                <div className="line-clamp-1 max-w-xs" title={product.description}>
                                  {product.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementColor(movement.type)}`}
                        >
                          <MovementIcon className="h-3 w-3 mr-1" />
                          {STOCK_MOVEMENT_LABELS[movement.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-semibold ${
                            movement.type === STOCK_MOVEMENTS.ENTRADA
                              ? "text-green-600"
                              : movement.type === STOCK_MOVEMENTS.SALIDA
                                ? "text-red-600"
                                : "text-blue-600"
                          }`}
                        >
                          {movement.type === STOCK_MOVEMENTS.ENTRADA && "+"}
                          {movement.type === STOCK_MOVEMENTS.SALIDA && "-"}
                          {movement.type === STOCK_MOVEMENTS.AJUSTE && "="}
                          {formatMovementQuantity(Math.abs(movement.quantity))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatMovementQuantity(movement.previousStock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatMovementQuantity(movement.newStock)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div className="line-clamp-2" title={movement.reason}>
                            {movement.reason}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {movement.user || "Sistema"}
                        </div>
                      </td>
                    </tr>
                  )
                })
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

      {/* Estilos */}
      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default StockMovementsList
