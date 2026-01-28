"use client"

import { useState, Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { NumericFormat } from "react-number-format"
import { useCustomerStore } from "../../stores/customerStore"
import { useToast } from "../../hooks/useToast"
import { formatCurrency } from "../../lib/formatters"
import { TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from "../../lib/constants"
import Button from "../common/Button"
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"

const AccountTransactionForm = ({ customer, onClose, onSuccess }) => {
  const { createAccountTransaction, loading } = useCustomerStore()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    customer_id: customer.id,
    type: "",
    amount: "",
    description: "",
    reference: "",
    payment_method: "efectivo",
  })

  const [errors, setErrors] = useState({})

  const paymentMethods = [
    {
      value: "efectivo",
      label: "Efectivo",
      icon: BanknotesIcon,
      affects_cash: true,
      color: "from-green-500 to-green-600",
      description: "Pago en efectivo físico",
    },
    {
      value: "transferencia",
      label: "Transferencia",
      icon: ArrowsRightLeftIcon,
      affects_cash: false,
      color: "from-blue-500 to-blue-600",
      description: "Transferencia bancaria",
    },
    {
      value: "tarjeta",
      label: "Tarjeta",
      icon: CreditCardIcon,
      affects_cash: false,
      color: "from-purple-500 to-purple-600",
      description: "Pago con tarjeta",
    },
  ]

  const transactionTypes = [
    {
      value: TRANSACTION_TYPES.PAGO,
      label: TRANSACTION_TYPE_LABELS.PAGO,
      icon: BanknotesIcon,
      color: "from-green-500 to-green-600",
      description: "Reduce el saldo deudor",
    },
    {
      value: TRANSACTION_TYPES.AJUSTE,
      label: TRANSACTION_TYPE_LABELS.AJUSTE,
      icon: AdjustmentsHorizontalIcon,
      color: "from-orange-500 to-orange-600",
      description: "Ajuste manual de saldo",
    },
  ]

  const selectedPaymentMethod = paymentMethods.find((m) => m.value === formData.payment_method)
  const newBalance = formData.amount
    ? customer.current_balance -
      (formData.type === TRANSACTION_TYPES.PAGO
        ? Number.parseFloat(formData.amount)
        : -Number.parseFloat(formData.amount))
    : customer.current_balance

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.type.trim()) {
      newErrors.type = "El tipo de transacción es requerido"
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0"
    }

    if (formData.type === TRANSACTION_TYPES.PAGO && !formData.payment_method.trim()) {
      newErrors.payment_method = "El método de pago es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast("Por favor corrige los errores en el formulario", "error")
      return
    }

    try {
      await createAccountTransaction({
        ...formData,
        amount: Number.parseFloat(formData.amount),
      })

      showToast("Transacción registrada correctamente", "success")
      onSuccess()
    } catch (error) {
      console.error("Error registrando transacción:", error)
      showToast(error.message || "Error registrando transacción", "error")
    }
  }

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <PlusIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                        Nueva Transacción
                      </Dialog.Title>
                      <p className="text-xs text-blue-100 mt-0.5">Registra un pago o ajuste de saldo para el cliente</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-colors p-1.5 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-gray-600">
                          Saldo:{" "}
                          <span
                            className={`font-semibold ${customer.current_balance > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {formatCurrency(customer.current_balance)}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          Límite:{" "}
                          <span className="font-semibold text-blue-600">{formatCurrency(customer.credit_limit)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
                    <div className="lg:col-span-1 hidden lg:block border-r border-gray-100 bg-gray-50 p-6 overflow-y-auto">
                      <div className="sticky top-0">
                        <div className="flex items-center mb-4">
                          <ReceiptPercentIcon className="h-4 w-4 text-gray-600 mr-2" />
                          <h4 className="text-sm font-semibold text-gray-700">Resumen</h4>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-4 space-y-4">
                          {formData.type && (
                            <div>
                              <span className="block text-xs text-gray-500 mb-2">Tipo de Transacción</span>
                              <div className="flex items-center gap-2">
                                {transactionTypes.find((t) => t.value === formData.type)?.icon &&
                                  (() => {
                                    const Icon = transactionTypes.find((t) => t.value === formData.type).icon
                                    return <Icon className="h-5 w-5 text-blue-600" />
                                  })()}
                                <span className="font-semibold text-gray-900">
                                  {transactionTypes.find((t) => t.value === formData.type)?.label}
                                </span>
                              </div>
                            </div>
                          )}

                          {formData.amount && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-1">Monto</span>
                              <span className="block text-2xl font-bold text-gray-900">
                                {formatCurrency(Number.parseFloat(formData.amount) || 0)}
                              </span>
                            </div>
                          )}

                          {formData.type === TRANSACTION_TYPES.PAGO && selectedPaymentMethod && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-2">Método de Pago</span>
                              <div className="flex items-center gap-2">
                                {selectedPaymentMethod.icon &&
                                  (() => {
                                    const Icon = selectedPaymentMethod.icon
                                    return <Icon className="h-4 w-4 text-gray-600" />
                                  })()}
                                <span className="text-sm font-medium text-gray-900">{selectedPaymentMethod.label}</span>
                              </div>
                            </div>
                          )}

                          {formData.amount && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-2">Saldo Después</span>
                              <span
                                className={`block text-lg font-bold ${newBalance > 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {formatCurrency(newBalance)}
                              </span>
                            </div>
                          )}

                          {formData.description && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-1">Descripción</span>
                              <p className="text-xs text-gray-600 line-clamp-3">{formData.description}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <span className="font-semibold">Tip:</span> Usa{" "}
                            <kbd className="px-1.5 py-0.5 bg-white rounded text-blue-900 font-mono text-xs shadow-sm">
                              Tab
                            </kbd>{" "}
                            para navegar entre campos
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                              <ReceiptPercentIcon className="h-4 w-4 mr-2 text-blue-600" />
                              Tipo de Transacción
                            </h3>
                            {errors.type && (
                              <p className="mb-3 text-xs text-red-600 flex items-center">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                {errors.type}
                              </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {transactionTypes.map((type) => {
                                const Icon = type.icon
                                return (
                                  <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, type: type.value }))
                                      if (errors.type) setErrors((prev) => ({ ...prev, type: "" }))
                                    }}
                                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                                      formData.type === type.value
                                        ? "border-blue-500 bg-blue-50 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${type.color}`}>
                                        <Icon className="h-5 w-5 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">{type.label}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{type.description}</p>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-blue-600" />
                                  Monto
                                </h3>
                                <div>
                                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Cantidad <span className="text-red-500">*</span>
                                  </label>
                                  <NumericFormat
                                    name="amount"
                                    value={formData.amount}
                                    onValueChange={(values) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        amount: values.floatValue ? values.floatValue.toString() : "",
                                      }))
                                      if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
                                    }}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="$"
                                    decimalScale={2}
                                    fixedDecimalScale={false}
                                    allowLeadingZeros={false}
                                    className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                      errors.amount ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
                                    }`}
                                    placeholder="$0"
                                  />
                                  {errors.amount && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                      {errors.amount}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {formData.type === TRANSACTION_TYPES.PAGO && (
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                    <CreditCardIcon className="h-4 w-4 mr-2 text-blue-600" />
                                    Método de Pago
                                  </h3>
                                  {errors.payment_method && (
                                    <p className="mb-3 text-xs text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                      {errors.payment_method}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map((method) => {
                                      const Icon = method.icon
                                      return (
                                        <button
                                          key={method.value}
                                          type="button"
                                          onClick={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              payment_method: method.value,
                                            }))
                                            if (errors.payment_method)
                                              setErrors((prev) => ({
                                                ...prev,
                                                payment_method: "",
                                              }))
                                          }}
                                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                                            formData.payment_method === method.value
                                              ? "border-blue-500 bg-blue-50 shadow-sm"
                                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                          }`}
                                        >
                                          <div className="flex flex-col items-center gap-1.5">
                                            <Icon className="h-5 w-5 text-gray-600" />
                                            <span className="text-xs font-medium text-gray-900">{method.label}</span>
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Referencia
                                </label>
                                <input
                                  type="text"
                                  name="reference"
                                  id="reference"
                                  value={formData.reference}
                                  onChange={handleChange}
                                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white"
                                  placeholder="Ej: Comprobante #12345"
                                />
                              </div>

                              <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Descripción
                                </label>
                                <input
                                  type="text"
                                  name="description"
                                  id="description"
                                  value={formData.description}
                                  onChange={handleChange}
                                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white"
                                  placeholder="Ej: Pago parcial de cuenta"
                                />
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="flex justify-end gap-3 px-6 py-6 border-t border-gray-200 bg-gray-50">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} loading={loading}>
                          {loading ? "Registrando..." : "Registrar Transacción"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AccountTransactionForm
