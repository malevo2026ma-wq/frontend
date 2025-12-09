"use client"

import { useState, useRef, useEffect } from "react"
import { NumericFormat } from "react-number-format"
import { useSalesStore } from "../../stores/salesStore"
import { useToast } from "../../contexts/ToastContext"
import { formatCurrency } from "../../lib/formatters"
import Button from "../common/Button"
import { XMarkIcon, PercentBadgeIcon, BanknotesIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

const DiscountModal = () => {
  const { showDiscountModal, setShowDiscountModal, cartTotal, applyDiscount, cartDiscount } = useSalesStore()
  const { showToast } = useToast()

  const [discountType, setDiscountType] = useState("percentage") // "percentage" o "amount"
  const [discountValue, setDiscountValue] = useState("")
  const [calculatedDiscount, setCalculatedDiscount] = useState(0)

  const inputRef = useRef(null)

  // Reset cuando se abre el modal
  useEffect(() => {
    // Si ya hay descuento aplicado, calcularlo para mostrarlo
    if (cartDiscount > 0) {
      const percentage = (cartDiscount / cartTotal) * 100
      if (Math.abs(Math.round(percentage) - percentage) < 0.01) {
        // Es un porcentaje exacto
        setDiscountType("percentage")
        setDiscountValue(Math.round(percentage).toString())
      } else {
        // Es un monto fijo
        setDiscountType("amount")
        setDiscountValue(cartDiscount.toString())
      }
    } else {
      setDiscountValue("")
    }
    setCalculatedDiscount(cartDiscount)

    // Focus en el input después de un pequeño delay
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [cartDiscount, cartTotal])

  // Calcular descuento cuando cambia el valor o tipo
  useEffect(() => {
    const value = Number.parseFloat(discountValue) || 0

    if (discountType === "percentage") {
      // Validar que no sea mayor a 100%
      if (value > 100) {
        setCalculatedDiscount(cartTotal)
      } else if (value < 0) {
        setCalculatedDiscount(0)
      } else {
        const discount = (cartTotal * value) / 100
        setCalculatedDiscount(Math.round(discount * 100) / 100)
      }
    } else {
      // Monto fijo
      if (value > cartTotal) {
        setCalculatedDiscount(cartTotal)
      } else if (value < 0) {
        setCalculatedDiscount(0)
      } else {
        setCalculatedDiscount(Math.round(value * 100) / 100)
      }
    }
  }, [discountValue, discountType, cartTotal])

  const handleApplyDiscount = () => {
    const value = Number.parseFloat(discountValue) || 0

    // Validaciones
    if (value < 0) {
      showToast("El descuento no puede ser negativo", "error")
      return
    }

    if (discountType === "percentage" && value > 100) {
      showToast("El descuento no puede ser mayor a 100%", "error")
      return
    }

    if (discountType === "amount" && value > cartTotal) {
      showToast("El descuento no puede ser mayor al subtotal", "error")
      return
    }

    // Aplicar descuento
    applyDiscount(calculatedDiscount)

    if (calculatedDiscount > 0) {
      showToast(`Descuento de ${formatCurrency(calculatedDiscount)} aplicado correctamente`, "success")
    } else {
      showToast("Descuento removido", "info")
    }

    setShowDiscountModal(false)
  }

  const handleRemoveDiscount = () => {
    applyDiscount(0)
    setDiscountValue("")
    setCalculatedDiscount(0)
    showToast("Descuento removido", "info")
    setShowDiscountModal(false)
  }

  const handleAmountChange = (values) => {
    const { floatValue } = values
    setDiscountValue(floatValue?.toString() || "")
  }

  const finalTotal = cartTotal - calculatedDiscount

  if (!showDiscountModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
        onClick={() => setShowDiscountModal(false)}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-xl font-semibold text-gray-900">Aplicar Descuento</h3>
          <button
            onClick={() => setShowDiscountModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Tipo de descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de descuento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDiscountType("percentage")}
                className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                  discountType === "percentage"
                    ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <PercentBadgeIcon className="h-6 w-6 mr-2" />
                <span className="font-medium">Porcentaje</span>
              </button>
              <button
                onClick={() => setDiscountType("amount")}
                className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${
                  discountType === "amount"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-md"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <BanknotesIcon className="h-6 w-6 mr-2" />
                <span className="font-medium">Monto</span>
              </button>
            </div>
          </div>

          {/* Input de valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {discountType === "percentage" ? "Porcentaje (%)" : "Monto ($)"}
            </label>
            {discountType === "percentage" ? (
              <input
                ref={inputRef}
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyDiscount()
                  if (e.key === "Escape") setShowDiscountModal(false)
                }}
                className="w-full px-4 py-3 text-lg font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            ) : (
              <NumericFormat
                getInputRef={inputRef}
                value={discountValue}
                onValueChange={handleAmountChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyDiscount()
                  if (e.key === "Escape") setShowDiscountModal(false)
                }}
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full px-4 py-3 text-lg font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="$ 0,00"
              />
            )}
          </div>

          {/* Vista previa del cálculo */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Vista previa</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Subtotal:</span>
                <span className="font-medium text-blue-900">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Descuento:</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(calculatedDiscount)}
                  {discountType === "percentage" && discountValue && (
                    <span className="ml-1 text-xs">({Number.parseFloat(discountValue).toFixed(1)}%)</span>
                  )}
                </span>
              </div>
              <div className="border-t border-blue-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-blue-900">Total:</span>
                  <span className="font-bold text-lg text-blue-900">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
          {cartDiscount > 0 && (
            <Button
              variant="outline"
              onClick={handleRemoveDiscount}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              Quitar Descuento
            </Button>
          )}
          <Button
            onClick={handleApplyDiscount}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DiscountModal
