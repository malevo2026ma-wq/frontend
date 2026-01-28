"use client"

import { useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import {
  CheckCircleIcon,
  XMarkIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline"
import { usePurchaseStore } from "../../stores/purchaseStore"
import { formatCurrency } from "../../lib/formatters"
import { PAYMENT_METHODS } from "../../lib/constants"
import Button from "../common/Button"
import LoadingSpinner from "../common/LoadingSpinner"

const paymentMethodsConfig = {
  [PAYMENT_METHODS.EFECTIVO]: {
    label: "Efectivo",
    icon: BanknotesIcon,
    description: "Pago en efectivo",
  },
  [PAYMENT_METHODS.TARJETA_DEBITO]: {
    label: "Tarjeta de Débito",
    icon: CreditCardIcon,
    description: "Pago con tarjeta de débito",
  },
  [PAYMENT_METHODS.TRANSFERENCIA]: {
    label: "Transferencia",
    icon: BuildingLibraryIcon,
    description: "Transferencia bancaria",
  },
  [PAYMENT_METHODS.CUENTA_CORRIENTE]: {
    label: "Cuenta Corriente",
    icon: DocumentTextIcon,
    description: "Agregar a cuenta corriente del proveedor",
  },
}

const PurchaseConfirmationModal = () => {
  const {
    purchaseCart,
    selectedSupplier,
    getPurchaseCartTotals,
    loading,
    showConfirmationModal,
    setShowConfirmationModal,
    processPurchase,
  } = usePurchaseStore()

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS.TRANSFERENCIA)
  const [notes, setNotes] = useState("")

  const { subtotal, tax, total } = getPurchaseCartTotals()

  const handleConfirm = async () => {
    try {
      await processPurchase({
        method: selectedPaymentMethod,
        notes,
      })
      setShowConfirmationModal(false)
      setNotes("")
    } catch (error) {
      console.error("Error al procesar compra:", error)
    }
  }

  const handleClose = () => {
    setShowConfirmationModal(false)
  }

  // Si no hay estado definido, usar false por defecto
  const isOpen = showConfirmationModal || false

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium text-gray-900">Confirmar Compra</Dialog.Title>
                  <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Información del proveedor */}
                {selectedSupplier && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Proveedor</h3>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{selectedSupplier.name}</p>
                        <p className="text-sm text-gray-500">{selectedSupplier.email}</p>
                        <p className="text-sm text-gray-500">{selectedSupplier.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Saldo actual</p>
                        <p
                          className={`font-medium ${selectedSupplier.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(Math.abs(selectedSupplier.balance || 0))}
                          {selectedSupplier.balance < 0 ? " (a favor)" : " (deuda)"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen de productos */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Productos ({purchaseCart?.length || 0})</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {purchaseCart?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    )) || []}
                  </div>
                </div>

                {/* Método de pago */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Método de Pago</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(paymentMethodsConfig).map(([method, config]) => {
                      const Icon = config.icon
                      return (
                        <label
                          key={method}
                          className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                            selectedPaymentMethod === method
                              ? "border-primary-600 ring-2 ring-primary-600"
                              : "border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-method"
                            value={method}
                            checked={selectedPaymentMethod === method}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center">
                            <Icon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{config.label}</p>
                              <p className="text-xs text-gray-500">{config.description}</p>
                            </div>
                          </div>
                          {selectedPaymentMethod === method && (
                            <CheckCircleIcon className="h-5 w-5 text-primary-600 ml-auto" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Notas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Agregar notas sobre la compra..."
                  />
                </div>

                {/* Totales */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA (21%):</span>
                      <span className="font-medium">{formatCurrency(tax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                      <span>Total a pagar:</span>
                      <span className="text-primary-600">{formatCurrency(total || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleClose} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirm} disabled={loading} className="min-w-[120px]">
                    {loading ? <LoadingSpinner size="sm" /> : "Confirmar Compra"}
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

export default PurchaseConfirmationModal
