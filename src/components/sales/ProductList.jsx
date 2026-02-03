"use client"

import { useState, useMemo, useEffect } from "react"
import { useProductStore } from "../../stores/productStore"
import { useCategoryStore } from "../../stores/categoryStore"
import { useSalesStore } from "../../stores/salesStore"
import { formatCurrency, formatStock } from "../../lib/formatters"
import Button from "../common/Button"
import PriceSelectionModal from "./PriceSelectionModal"
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PhotoIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline"

const ProductList = ({ searchTerm, selectedIndex = -1 }) => {
  const [sortField, setSortField] = useState("total_sold")
  const [sortDirection, setSortDirection] = useState("desc")
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const { searchResults, searchPagination, searchProductsForSales, loadMoreSearchResults, loading } = useProductStore()
  const { categories } = useCategoryStore()
  const { cart } = useSalesStore()

  useEffect(() => {
    let isMounted = true

    const handleSearch = async () => {
      if (isMounted) {
        if (searchTerm && searchTerm.trim().length >= 2) {
          await searchProductsForSales(searchTerm, 1, false)
        }
      }
    }

    handleSearch()

    return () => {
      isMounted = false
    }
  }, [searchTerm, searchProductsForSales])

  const displayProducts = useMemo(() => {
    return searchResults.filter((product) => product.active)
  }, [searchResults])

  const filteredProducts = useMemo(() => {
    const result = [...displayProducts]

    result.sort((a, b) => {
      let aValue, bValue

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "price":
          aValue = a.price
          bValue = b.price
          break
        case "stock":
          aValue = a.stock
          bValue = b.stock
          break
        case "total_sold":
          aValue = a.total_sold || 0
          bValue = b.total_sold || 0
          break
        default:
          return 0
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return result
  }, [displayProducts, sortField, sortDirection])

  const handleAddToCart = (product) => {
    if (product.stock > 0) {
      setSelectedProduct(product)
      setShowPriceModal(true)
    }
  }

  const getCartQuantity = (productId) => {
    // Sumar todas las cantidades del producto (puede estar con ambos tipos de precio)
    const cartItems = cart.filter((item) => item.id === productId)
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "total_sold" ? "desc" : "asc")
    }
  }

  const SortHeader = ({ field, children, className = "" }) => (
    <th
      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field &&
          (sortDirection === "asc" ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />)}
      </div>
    </th>
  )

  const handleLoadMore = async () => {
    await loadMoreSearchResults()
  }

  return (
    <>
      <PriceSelectionModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        product={selectedProduct}
      />
      <div className="space-y-4">
      {searchTerm && searchTerm.trim().length >= 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-blue-700">
                Buscando: "<strong>{searchTerm}</strong>" - {searchPagination.total} resultado(s) total(es),
                mostrando {displayProducts.length}
                {loading && <span className="ml-2 text-blue-500 animate-pulse">Buscando...</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {(!searchTerm || searchTerm.trim().length < 2) && (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
          <MagnifyingGlassIcon className="h-20 w-20 text-blue-300 mx-auto mb-4" />
          <p className="text-gray-600 text-xl font-medium mb-2">Comienza a buscar productos</p>
          <p className="text-gray-500">Escribe al menos 2 caracteres para ver los resultados</p>
          <p className="text-sm text-gray-400 mt-2">💡 También puedes usar el escáner de código de barras</p>
        </div>
      )}

      {searchTerm && searchTerm.trim().length >= 2 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="name" className="min-w-0">
                    Producto
                  </SortHeader>
                  <SortHeader field="category" className="w-32">
                    Categoría
                  </SortHeader>
                  <SortHeader field="price" className="w-28">
                    Precio
                  </SortHeader>
                  <SortHeader field="stock" className="w-24">
                    Stock
                  </SortHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => {
                  const category = categories.find((cat) => cat.id === product.category_id)
                  const cartQuantity = getCartQuantity(product.id)
                  const isSelected = index === selectedIndex

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors relative ${
                        isSelected
                          ? "bg-blue-100 border-l-4 border-l-blue-500"
                          : product.stock === 0
                          ? "bg-gray-50 opacity-60 cursor-not-allowed"
                          : "hover:bg-blue-50 cursor-pointer"
                      }`}
                      onClick={() => handleAddToCart(product)}
                      title={
                        product.stock === 0
                          ? "Sin stock disponible"
                          : "Clic para agregar al carrito"
                      }
                    >
                      <td className="px-3 py-4 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                className={`h-full w-full object-cover ${product.stock === 0 ? "opacity-50" : ""}`}
                              />
                            ) : (
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-sm font-medium text-gray-900 truncate flex-1">{product.name}</div>
                              {cartQuantity > 0 && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                                  <ShoppingCartIcon className="h-3 w-3 mr-1" />
                                  {formatStock(cartQuantity, false)}
                                </div>
                              )}
                            </div>

                            {product.description && (
                              <div className="text-sm text-gray-500 truncate cursor-help" title={product.description}>
                                {product.description}
                              </div>
                            )}

                            {(product.size || product.color) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {product.size && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Talle: {product.size}
                                  </span>
                                )}
                                {product.color && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
                                    Color: {product.color}
                                  </span>
                                )}
                              </div>
                            )}

                            {product.barcode && (
                              <div
                                className="text-xs text-gray-400 font-mono truncate"
                                title={`Código: ${product.barcode}`}
                              >
                                {product.barcode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 truncate max-w-full">
                          {category?.name || "Sin categoría"}
                        </span>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(product.price_cash)} <span className="text-xs font-normal">contado</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatCurrency(product.price_list)} <span className="text-gray-500">lista</span>
                          </div>
                          {product.cost && (
                            <div className="text-xs text-gray-400 truncate">Costo: {formatCurrency(product.cost)}</div>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${
                              product.stock === 0
                                ? "text-red-500"
                                : product.stock <= product.min_stock
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {formatStock(product.stock)}
                          </span>
                          {product.min_stock && (
                            <span className="text-xs text-gray-400">
                              Mín: {formatStock(product.min_stock)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {searchPagination.hasMore && (
        <div className="flex justify-center py-6">
          <Button
            onClick={handleLoadMore}
            disabled={loading}
            variant="outline"
            className="px-6 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all bg-transparent"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                Cargando más productos...
              </>
            ) : (
              <>
                Mostrar más productos ({searchPagination.total - displayProducts.length} restantes)
              </>
            )}
          </Button>
        </div>
      )}

      {displayProducts.length === 0 && !loading && searchTerm && searchTerm.trim().length >= 2 && (
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-xl mb-2">No se encontraron productos</p>
          <p className="text-gray-400">
            No hay productos que coincidan con "<strong>{searchTerm}</strong>"
          </p>
        </div>
      )}

      {loading && displayProducts.length === 0 && searchTerm && searchTerm.trim().length >= 2 && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Buscando productos...</p>
        </div>
      )}

      {displayProducts.length > 0 && (
        <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-100">
          Mostrando {displayProducts.length} de {searchPagination.total} productos para "{searchTerm}"
        </div>
      )}
      </div>
    </>
  )
}

export default ProductList
