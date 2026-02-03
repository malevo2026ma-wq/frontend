"use client"

import { useMemo, useEffect, useState } from "react"
import { useProductStore } from "../../stores/productStore"
import { useCategoryStore } from "../../stores/categoryStore"
import { useSalesStore } from "../../stores/salesStore"
import { formatCurrency, formatStock } from "../../lib/formatters"
import Button from "../common/Button"
import PriceSelectionModal from "./PriceSelectionModal"
import { PlusIcon, MagnifyingGlassIcon, PhotoIcon, ShoppingCartIcon } from "@heroicons/react/24/outline"

const ProductGrid = ({ searchTerm, selectedIndex = -1 }) => {
  const { searchResults, searchPagination, searchProductsForSales, loadMoreSearchResults, loading } =
    useProductStore()
  const { categories } = useCategoryStore()
  const { cart } = useSalesStore()
  
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

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
        <>
          <div className="grid grid-cols-3 gap-4">
            {displayProducts.map((product, index) => {
              const category = categories.find((cat) => cat.id === product.category_id)
              const cartQuantity = getCartQuantity(product.id)
              const isSelected = index === selectedIndex

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 relative group h-full flex flex-col ${
                    isSelected ? "border-blue-500 shadow-lg ring-2 ring-blue-300" : "border-gray-200"
                  }`}
                >
                  {cartQuantity > 0 && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 font-bold z-10 shadow-sm flex items-center">
                      <ShoppingCartIcon className="h-3 w-3 mr-1" />
                      {formatStock(cartQuantity, false)}
                    </div>
                  )}

                  {product.stock === 0 ? (
                    <div className="absolute top-8 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10 shadow-sm">
                      Sin Stock
                    </div>
                  ) : (
                    product.stock <= product.min_stock && (
                      <div className="absolute top-8 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10 shadow-sm">
                        Stock Bajo
                      </div>
                    )
                  )}

                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${
                          product.stock === 0 ? "opacity-50" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <PhotoIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                  </div>

                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3
                        className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1 min-h-[2.5rem]"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="inline-flex items-center px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800 truncate max-w-[60%]">
                        {category?.name || "Sin categoría"}
                      </span>
                    </div>

                    {product.description && (
                      <p
                        className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2rem] cursor-help"
                        title={product.description}
                      >
                        {product.description}
                      </p>
                    )}

                    {(product.size || product.color) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {product.size && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Talle: {product.size}
                          </span>
                        )}
                        {product.color && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-pink-50 text-pink-700 border border-pink-100">
                            Color: {product.color}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(product.price_cash)}
                          </span>
                          <span className="text-xs text-green-600 font-medium">Contado</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-gray-600">
                            {formatCurrency(product.price_list)}
                          </span>
                          <span className="text-xs text-gray-500">Lista</span>
                        </div>
                        {product.cost && (
                          <span className="text-xs text-gray-400 mt-1">Costo: {formatCurrency(product.cost)}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold ${
                            product.stock === 0
                              ? "text-red-500"
                              : product.stock <= product.min_stock
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {formatStock(product.stock)}
                        </div>
                        {product.min_stock && (
                          <div className="text-xs text-gray-400">
                            Mín: {formatStock(product.min_stock)}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      size="sm"
                      className="w-full text-sm font-medium transition-all mt-auto"
                      disabled={product.stock === 0}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      {product.stock === 0 ? "Sin Stock" : "Agregar"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

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

          {/* Mensaje cuando no hay productos en la búsqueda */}
          {displayProducts.length === 0 && !loading && searchTerm.trim().length >= 2 && (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-xl mb-2">No se encontraron productos</p>
              <p className="text-gray-400">
                No hay productos que coincidan con "<strong>{searchTerm}</strong>"
              </p>
            </div>
          )}

          {/* Indicador de carga inicial */}
          {loading && displayProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Buscando productos...</p>
            </div>
          )}

          {/* Resumen de resultados */}
          {displayProducts.length > 0 && (
            <div className="text-sm text-gray-500 text-center py-4 border-t border-gray-100">
              Mostrando {displayProducts.length} de {searchPagination.total} productos para "{searchTerm}"
            </div>
          )}
        </>
      )}
      </div>
    </>
  )
}

export default ProductGrid
