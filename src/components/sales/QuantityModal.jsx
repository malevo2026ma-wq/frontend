"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { NumericFormat } from "react-number-format"
import { useSalesStore } from "../../stores/salesStore"
import { useToast } from "../../contexts/ToastContext"
import { formatCurrency, formatStock } from "../../lib/formatters"
import Button from "../common/Button"
import {
  XMarkIcon,
  PlusIcon,
  CubeIcon,
} from "@heroicons/react/24/outline"

const QuantityModal = () => {
  const {
    showQuantityModal,
    setShowQuantityModal,
    selectedProduct,
    addToCart,
  } = useSalesStore()

  const { showToast } = useToast()

  // Estados para el modal - solo cantidad
  const [quantityInput, setQuantityInput] = useState("")
  const [calculatedQuantity, setCalculatedQuantity] = useState(0)
  const [calculatedAmount, setCalculatedAmount] = useState(0)
  const [amountInput, setAmountInput] = useState("") // Declare setAmountInput

  const quantityInputRef = useRef(null)

  // Reset cuando se abre el modal
  useEffect(() => {
    if (showQuantityModal && selectedProduct) {
      setQuantityInput("1")
    }
  }, [showQuantityModal, selectedProduct])

  // Enfocar input cuando se abre el modal
  useEffect(() => {
    if (showQuantityModal && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current.focus()
        quantityInputRef.current.select()
      }, 100)
    }
  }, [showQuantityModal])

  // Calcular valores cuando cambia el input - solo enteros
  useEffect(() => {
    if (!selectedProduct) return

    if (quantityInput) {
      const quantity = parseInt(quantityInput) || 0
      if (quantity > 0) {
        const amount = quantity * selectedProduct.price
        setCalculatedAmount(Math.round(amount * 100) / 100)
        setCalculatedQuantity(Math.floor(quantity));
      } else {
        setCalculatedQuantity(0);
        setCalculatedAmount(0);
      }
    }
  }, [quantityInput, selectedProduct])

  const handleQuantityChange = (values) => {
    const { floatValue } = values
    setQuantityInput(floatValue?.toString() || "")
  }

  const handleAmountChange = (values) => {
    const { floatValue } = values
    setAmountInput(floatValue?.toString() || "")
  }

  const handleConfirm = () => {
    if (!selectedProduct) return

    const finalQuantity = calculatedQuantity

    // Validaciones
    if (finalQuantity <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error")
      return
    }

    if (finalQuantity > selectedProduct.stock) {
      showToast(`Stock insuficiente. Disponible: ${formatStock(selectedProduct.stock)}`, "error")
      return
    }

    // Add to cart with quantity only
    addToCart(selectedProduct, finalQuantity)
    
    const message = `Agregado: ${finalQuantity} ${selectedProduct.name} por ${formatCurrency(calculatedAmount)}`
    
    showToast(message, "success")

    // Cerrar modal
    setShowQuantityModal(false)
  }

  const handleCancel = () => {
    setShowQuantityModal(false)
  }

  // Manejar Enter para confirmar
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  // Valores rápidos - solo enteros
  const quickValues = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "5", value: 5 },
    { label: "10", value: 10 },
  ]

  if (!selectedProduct) return null

  return (
    <Transition appear show={showQuantityModal} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                {/* Header compacto */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                      <CubeIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold text-gray-900">
                        Cantidad
                      </Dialog.Title>
                      <p className="text-xs text-gray-500 truncate max-w-40" title={selectedProduct.name}>
                        {selectedProduct.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Contenido compacto */}
                <div className="p-4 space-y-4">
                  {/* Información del producto */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Precio unitario:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(selectedProduct.price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-semibold text-gray-900">
                        {formatStock(selectedProduct.stock)}
                      </span>
                    </div>
                  </div>

                  {/* Input principal */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad de unidades:
                      </label>
                      <NumericFormat
                        getInputRef={quantityInputRef}
                        value={quantityInput}
                        onValueChange={handleQuantityChange}
                        onKeyDown={handleKeyDown}
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={0}
                        allowNegative={false}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium text-center"
                        placeholder="0"
                      />
                    </div>

                    {/* Botones rápidos */}
                    <div className="grid grid-cols-4 gap-2">
                      {quickValues.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setQuantityInput(item.value.toString())}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resultado calculado */}
                  {(calculatedQuantity > 0 && calculatedAmount > 0) && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-center text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600">Cantidad:</span>
                          <span className="font-semibold text-blue-900">
                            {formatStock(calculatedQuantity)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-blue-600">Total:</span>
                          <span className="font-semibold text-blue-900">
                            {formatCurrency(calculatedAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validación de stock */}
                  {calculatedQuantity > selectedProduct.stock && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <p className="text-xs text-red-700 text-center">
                        ⚠️ Excede el stock disponible
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer compacto */}
                <div className="flex gap-2 p-4 border-t border-gray-100 bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 text-sm py-2 bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm py-2"
                    disabled={calculatedQuantity <= 0 || calculatedQuantity > selectedProduct.stock}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default QuantityModal
