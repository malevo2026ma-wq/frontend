"use client"

import { useState, useRef, useCallback, useEffect, forwardRef } from "react"
import { useProductStore } from "../../stores/productStore"
import { useSalesStore } from "../../stores/salesStore"
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts"
import { MagnifyingGlassIcon, QrCodeIcon } from "@heroicons/react/24/outline"

const ProductSearch = forwardRef(({ onSearchChange, searchTerm }, ref) => {
  const [isSearchingBarcode, setIsSearchingBarcode] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [lastSearchResults, setLastSearchResults] = useState([])
  const inputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  const { getProductByBarcode, searchResults } = useProductStore()
  const { addToCart, setSelectedProduct, setShowQuantityModal } = useSalesStore()
  const { registerFocusProductSearch } = useKeyboardShortcuts()

  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(inputRef.current)
      } else {
        ref.current = inputRef.current
      }
    }
  }, [ref])

  useEffect(() => {
    registerFocusProductSearch(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    })
  }, [registerFocusProductSearch])

  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const activeResults = searchResults.filter(p => p.active)
    setLastSearchResults(activeResults)
  }, [searchResults])

  const handleBarcodeSearch = () => {
    if (isSearchingBarcode) {
      if (localSearchTerm.trim()) {
        const product = getProductByBarcode(localSearchTerm.trim())
        if (product && product.active && product.stock > 0) {
          setSelectedProduct(product)
          setShowQuantityModal(true)
          setLocalSearchTerm("")
          onSearchChange("")
          setIsSearchingBarcode(false)
          inputRef.current?.focus()
        } else {
          alert("Producto no encontrado o sin stock")
        }
      }
    } else {
      setIsSearchingBarcode(true)
      setLocalSearchTerm("")
      onSearchChange("")
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && isSearchingBarcode) {
      handleBarcodeSearch()
    } else if (e.key === "Escape") {
      setIsSearchingBarcode(false)
      setLocalSearchTerm("")
      onSearchChange("")
    }
  }

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value
      setLocalSearchTerm(value)

      // Limpiar timer anterior
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Solo aplicar debounce si hay 2 o más caracteres
      if (value.trim().length >= 2) {
        debounceTimerRef.current = setTimeout(() => {
          onSearchChange(value)
        }, 300) // 300ms de debounce para búsqueda fluida
      } else {
        // Si hay menos de 2 caracteres, limpiar resultados inmediatamente
        onSearchChange("")
      }
    },
    [onSearchChange],
  )

  useEffect(() => {
    if (
      !isSearchingBarcode && 
      localSearchTerm.trim().length >= 2 && 
      lastSearchResults.length === 1 &&
      lastSearchResults[0].stock > 0
    ) {
      // Auto-select single result
      setSelectedProduct(lastSearchResults[0])
      setShowQuantityModal(true)
    }
  }, [lastSearchResults, localSearchTerm, isSearchingBarcode, setSelectedProduct, setShowQuantityModal])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const cancelBarcodeMode = () => {
    setIsSearchingBarcode(false)
    setLocalSearchTerm("")
    onSearchChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isSearchingBarcode
                ? "Escanea o ingresa el código de barras..."
                : "Buscar productos (mínimo 2 caracteres)..."
            }
            value={localSearchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 ${
              isSearchingBarcode ? "border-blue-300 bg-blue-50" : "border-gray-300"
            }`}
          />
          {isSearchingBarcode && (
            <div className="absolute inset-y-0 right-10 flex items-center">
              <button
                onClick={cancelBarcodeMode}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="Cancelar búsqueda por código"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleBarcodeSearch}
          className={`px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors ${
            isSearchingBarcode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
          title={isSearchingBarcode ? "Buscar código de barras" : "Activar búsqueda por código de barras"}
        >
          <QrCodeIcon className="h-5 w-5" />
        </button>
      </div>

      {isSearchingBarcode && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
          📱 Modo código de barras activo - Presiona Enter o el botón para buscar
        </div>
      )}

      {!isSearchingBarcode && localSearchTerm.trim().length > 0 && localSearchTerm.trim().length < 2 && (
        <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
          ✍️ Escribe al menos 2 caracteres para buscar productos
        </div>
      )}
    </div>
  )
})

ProductSearch.displayName = "ProductSearch"

export default ProductSearch
