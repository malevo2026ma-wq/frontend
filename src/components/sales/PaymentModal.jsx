"use client"

import { useState, useRef, useEffect, Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { NumericFormat } from "react-number-format"
import { useSalesStore } from "../../stores/salesStore"
import { useCustomerStore } from "../../stores/customerStore"
import { useToast } from "../../contexts/ToastContext"
import { formatCurrency } from "../../lib/formatters"
import { PAYMENT_METHODS } from "../../lib/constants"
import Button from "../common/Button"
import CustomerSelectModal from "./CustomerSelect"
import TicketPrintModal from "./TicketPrintModal"
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

const PaymentModal = () => {
  const {
    showPaymentModal,
    setShowPaymentModal,
    cartTotal,
    cartDiscount, // Ensure cartDiscount is available for finalTotal calculation
    cartTax, // Ensure cartTax is available for finalTotal calculation
    paymentMethod,
    setPaymentMethod,
    customer,
    setCustomer,
    processSale,
    loading,
    multiplePaymentMode,
    setMultiplePaymentMode,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    validateMultiplePayments,
    showTicketPrintModal,
    setShowTicketPrintModal,
    lastCompletedSale,
  } = useSalesStore()

  const { customers, fetchCustomers, searchCustomers, getCustomerBalance } = useCustomerStore()
  const { showToast } = useToast()

  const [paymentData, setPaymentData] = useState({
    amountReceived: 0,
    cardNumber: "",
    installments: 1,
    reference: "",
    interestRate: 0,
  })

  const [showCustomerSelector, setShowCustomerSelector] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [customerBalance, setCustomerBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const amountInputRef = useRef(null)

  // FIX: Updated finalTotal calculation to include discount
  const finalTotal = cartTotal - cartDiscount + cartTax

  // FIX: Define 'change' here
  const change = paymentData.amountReceived - finalTotal

  // NUEVO: Validación de pagos múltiples
  const multiplePaymentValidation = validateMultiplePayments()

  // Verificar si es el cliente por defecto
  const isDefaultCustomer = customer && customer.document_number === "00000000" && customer.name === "Consumidor Final"

  // Métodos de pago disponibles
  const paymentMethodsOptions = [
    {
      id: PAYMENT_METHODS.EFECTIVO,
      name: "Efectivo",
      icon: BanknotesIcon,
      color: "bg-green-50 border-green-200 text-green-800",
      activeColor: "bg-green-500 text-white border-green-500",
      hoverColor: "hover:bg-green-100 hover:border-green-300",
    },
    {
      id: PAYMENT_METHODS.TARJETA_DEBITO,
      name: "Débito",
      icon: CreditCardIcon,
      color: "bg-teal-50 border-teal-200 text-teal-800",
      activeColor: "bg-teal-500 text-white border-teal-500",
      hoverColor: "hover:bg-teal-100 hover:border-teal-300",
    },
    {
      id: PAYMENT_METHODS.TARJETA_CREDITO,
      name: "Crédito",
      icon: CreditCardIcon,
      color: "bg-purple-50 border-purple-200 text-purple-800",
      activeColor: "bg-purple-500 text-white border-purple-500",
      hoverColor: "hover:bg-purple-100 hover:border-purple-300",
    },
    {
      id: PAYMENT_METHODS.TRANSFERENCIA,
      name: "Transferencia",
      icon: DevicePhoneMobileIcon,
      color: "bg-indigo-50 border-indigo-200 text-indigo-800",
      activeColor: "bg-indigo-500 text-white border-indigo-500",
      hoverColor: "hover:bg-indigo-100 hover:border-indigo-300",
    },
    {
      id: PAYMENT_METHODS.CUENTA_CORRIENTE,
      name: "Cuenta Corriente",
      icon: BuildingLibraryIcon,
      color: "bg-orange-50 border-orange-200 text-orange-800",
      activeColor: "bg-orange-500 text-white border-orange-500",
      hoverColor: "hover:bg-orange-100 hover:border-orange-300",
      disabled: !customer || isDefaultCustomer,
    },
  ]

  // Cargar clientes al abrir el modal
  useEffect(() => {
    if (showPaymentModal) {
      fetchCustomers({ active: "true" }, true) // Force refresh when modal opens
      // Set default customer if none is selected in salesStore
      if (!customer) {
        const defaultClient = customers.find((c) => c.document_number === "00000000" && c.name === "Consumidor Final")
        if (defaultClient) {
          setCustomer(defaultClient)
        }
      }
    }
  }, [showPaymentModal, fetchCustomers, customer, customers, setCustomer])

  // Filter customers for the inline selector (if used)
  useEffect(() => {
    if (customerSearch.trim()) {
      const filtered = searchCustomers(customerSearch.trim())
        .filter((c) => c.active)
        .slice(0, 10)
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers.filter((c) => c.active).slice(0, 10))
    }
  }, [customerSearch, customers, searchCustomers])

  // Obtener saldo del cliente cuando se selecciona (with debounce)
  useEffect(() => {
    if (!customer || isDefaultCustomer) {
      setCustomerBalance(null)
      return
    }

    let isMounted = true
    const timeoutId = setTimeout(async () => {
      if (!isMounted) return

      setLoadingBalance(true)
      try {
        const balance = await getCustomerBalance(customer.id, true) // Force refresh balance
        if (isMounted) {
          setCustomerBalance(balance)
        }
      } catch (error) {
        console.error("Error obteniendo saldo:", error)
        if (isMounted) {
          setCustomerBalance(null)
        }
      } finally {
        if (isMounted) {
          setLoadingBalance(false)
        }
      }
    }, 300) // Debounce de 300ms

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [customer, isDefaultCustomer, getCustomerBalance])

  // Reset payment data when modal opens
  useEffect(() => {
    if (showPaymentModal) {
      setPaymentData({
        amountReceived: !multiplePaymentMode && paymentMethod === PAYMENT_METHODS.EFECTIVO ? finalTotal : 0,
        cardNumber: "",
        installments: 1,
        reference: "",
        interestRate: 0,
      })
    }
  }, [showPaymentModal, paymentMethod, finalTotal, multiplePaymentMode])

  // Efecto para enfocar el input cuando se selecciona efectivo en modo simple
  useEffect(() => {
    if (
      !multiplePaymentMode &&
      paymentMethod === PAYMENT_METHODS.EFECTIVO &&
      showPaymentModal &&
      amountInputRef.current
    ) {
      setTimeout(() => {
        amountInputRef.current.focus()
        amountInputRef.current.select()
      }, 100)
    }
  }, [paymentMethod, showPaymentModal, multiplePaymentMode])

  // Cálculos corregidos
  const currentBalance = customerBalance ? Number.parseFloat(customerBalance.current_balance) || 0 : 0
  const creditLimit = customerBalance ? Number.parseFloat(customerBalance.credit_limit) || 0 : 0
  const availableCredit = Math.max(0, creditLimit - currentBalance)
  const newBalance = currentBalance + Number.parseFloat(finalTotal)
  const exceedsLimit = newBalance > creditLimit

  // NUEVO: Manejar toggle de múltiples pagos
  const handleToggleMultiplePayments = (enabled) => {
    setMultiplePaymentMode(enabled)
    if (enabled) {
      showToast("Modo de pagos múltiples activado", "info")
    } else {
      showToast("Modo de pago simple activado", "info")
    }
  }

  // NUEVO: Agregar método de pago
  const handleAddPaymentMethod = () => {
    const remainingAmount = finalTotal - paymentMethods.reduce((sum, pm) => sum + Number.parseFloat(pm.amount || 0), 0)
    addPaymentMethod(PAYMENT_METHODS.EFECTIVO, Math.max(0, remainingAmount))
  }

  // NUEVO: Actualizar método de pago múltiple
  const handleUpdatePaymentMethod = (index, field, value) => {
    updatePaymentMethod(index, { [field]: value })
  }

  const handleProcessSale = async () => {
    try {
      // Validaciones para modo simple
      if (!multiplePaymentMode) {
        if (paymentMethod === PAYMENT_METHODS.EFECTIVO && paymentData.amountReceived < finalTotal) {
          showToast("El monto recibido es insuficiente", "error")
          return
        }

        if (paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE && (!customer || isDefaultCustomer)) {
          showToast("Debe seleccionar un cliente válido para ventas a cuenta corriente", "error")
          return
        }

        if (paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE && exceedsLimit) {
          showToast("La venta excede el límite de crédito del cliente", "error")
          return
        }

        if (
          (paymentMethod === PAYMENT_METHODS.TARJETA_CREDITO || paymentMethod === PAYMENT_METHODS.TARJETA_DEBITO) &&
          !paymentData.cardNumber
        ) {
          showToast("Ingrese los últimos 4 dígitos de la tarjeta", "error")
          return
        }

        if (paymentMethod === PAYMENT_METHODS.TRANSFERENCIA && !paymentData.reference) {
          showToast("Ingrese la referencia de transferencia", "error")
          return
        }
      } else {
        // NUEVO: Validaciones para modo múltiple
        if (paymentMethods.length === 0) {
          showToast("Debe agregar al menos un método de pago", "error")
          return
        }

        if (!multiplePaymentValidation.valid) {
          showToast(`Los pagos no suman el total. ${multiplePaymentValidation.message}`, "error")
          return
        }

        // Validar cada método de pago
        for (let i = 0; i < paymentMethods.length; i++) {
          const pm = paymentMethods[i]

          if (!pm.amount || Number.parseFloat(pm.amount) <= 0) {
            showToast(`El método de pago ${i + 1} debe tener un monto válido`, "error")
            return
          }

          if (pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE && (!customer || isDefaultCustomer)) {
            showToast("Debe seleccionar un cliente válido para usar cuenta corriente", "error")
            return
          }

          if (pm.method === PAYMENT_METHODS.TARJETA_CREDITO) {
            if (!pm.data?.cardNumber) {
              showToast(`Ingrese los datos de la tarjeta para el método ${i + 1}`, "error")
              return
            }
          }

          if (pm.method === PAYMENT_METHODS.TRANSFERENCIA && !pm.data?.reference) {
            showToast(`Ingrese la referencia para la transferencia ${i + 1}`, "error")
            return
          }
        }

        // Validar límite de crédito para cuenta corriente en múltiples pagos
        const cuentaCorrienteAmount = paymentMethods
          .filter((pm) => pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE)
          .reduce((sum, pm) => sum + Number.parseFloat(pm.amount), 0)

        if (cuentaCorrienteAmount > 0 && customerBalance) {
          const newBalanceMultiple = currentBalance + cuentaCorrienteAmount
          if (newBalanceMultiple > creditLimit) {
            showToast("El monto a cuenta corriente excede el límite de crédito", "error")
            return
          }
        }
      }

      await processSale(paymentData)

      showToast("Venta procesada exitosamente", "success")
      setShowPaymentModal(false)

      // Reset payment data
      setPaymentData({
        amountReceived: 0,
        cardNumber: "",
        installments: 1,
        reference: "",
        interestRate: 0,
      })

      // Limpiar saldo del cliente para forzar recarga
      setCustomerBalance(null)

      setTimeout(() => {
        setShowTicketPrintModal(true)
      }, 300)
    } catch (error) {
      showToast(error.message || "Error al procesar la venta", "error")
    }
  }

  const handleAmountChange = (values) => {
    const { floatValue } = values
    setPaymentData({
      ...paymentData,
      amountReceived: floatValue || 0,
    })
  }

  const handleCardNumberChange = (values) => {
    const { value } = values
    setPaymentData({
      ...paymentData,
      cardNumber: value,
    })
  }

  const handleAmountFocus = (e) => {
    setTimeout(() => {
      e.target.select()
    }, 0)
  }

  const handleQuickAmount = (amount) => {
    setPaymentData({ ...paymentData, amountReceived: amount })
    if (amountInputRef.current) {
      amountInputRef.current.focus()
    }
  }

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer(selectedCustomer)
    const isSelectedDefault =
      selectedCustomer.document_number === "00000000" && selectedCustomer.name === "Consumidor Final"
    if (!isSelectedDefault && paymentMethod === PAYMENT_METHODS.EFECTIVO) {
      setPaymentMethod(PAYMENT_METHODS.CUENTA_CORRIENTE)
    }
    setShowCustomerSelector(false)
    setCustomerSearch("")
  }

  const handleRemoveCustomer = () => {
    setCustomer(null)
    setCustomerBalance(null)
    if (paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE) {
      setPaymentMethod(PAYMENT_METHODS.EFECTIVO)
    }
  }

  return (
    <>
      <Transition appear show={showPaymentModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowPaymentModal(false)}>
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
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[95vh]">
                  {/* Header con toggle */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center space-x-4">
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        Procesar Pago
                      </Dialog.Title>

                      {/* NUEVO: Toggle para múltiples pagos */}
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={multiplePaymentMode}
                            onChange={(e) => handleToggleMultiplePayments(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              multiplePaymentMode ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                multiplePaymentMode ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-700">
                            {multiplePaymentMode ? "Múltiples pagos" : "Pago simple"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Contenido Principal */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* MODO PAGO SIMPLE: Total + Información de validación para múltiples pagos */}
                    {!multiplePaymentMode && (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Total a pagar - Más compacto */}
                        <div className="lg:col-span-2">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
                            <p className="text-blue-100 text-xs font-medium mb-1">Total a pagar</p>
                            <p className="text-2xl font-bold mb-1">{formatCurrency(finalTotal)}</p>
                            {/* Removed cartDiscount display */}
                          </div>
                        </div>

                        {/* Métodos de pago - Compactos en la misma fila */}
                        <div className="lg:col-span-3">
                          <div className="flex flex-wrap gap-2 justify-between">
                            {paymentMethodsOptions.map((method) => (
                              <button
                                key={method.id}
                                onClick={() => !method.disabled && setPaymentMethod(method.id)}
                                disabled={method.disabled}
                                className={`flex-1 min-w-[calc(25%-0.5rem)] flex flex-col items-center p-2 border-2 rounded-lg text-center transition-all duration-200 ${
                                  paymentMethod === method.id
                                    ? `${method.activeColor} shadow-md transform scale-105`
                                    : method.disabled
                                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                      : `${method.color} ${method.hoverColor} hover:shadow-sm hover:transform hover:scale-102`
                                }`}
                              >
                                <method.icon className="h-4 w-4 mb-1" />
                                <p className="font-medium text-xs">{method.name}</p>
                                {paymentMethod === method.id && <CheckCircleIcon className="h-3 w-3 mt-1" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODO MÚLTIPLE: Layout original */}
                    {multiplePaymentMode && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Total a pagar */}
                        <div className="lg:col-span-1">
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center">
                            <p className="text-blue-100 text-sm font-medium mb-1">Total a pagar</p>
                            <p className="text-3xl font-bold mb-2">{formatCurrency(finalTotal)}</p>
                            {/* Removed cartDiscount display */}
                          </div>
                        </div>

                        {/* Información de validación para múltiples pagos */}
                        <div className="lg:col-span-2">
                          <div
                            className={`rounded-xl p-4 border-2 ${
                              multiplePaymentValidation.valid
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {multiplePaymentValidation.valid ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                                ) : (
                                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                                )}
                                <div>
                                  <p
                                    className={`font-medium ${
                                      multiplePaymentValidation.valid ? "text-green-800" : "text-red-800"
                                    }`}
                                  >
                                    {multiplePaymentValidation.valid ? "Pagos válidos" : "Error en pagos"}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      multiplePaymentValidation.valid ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {multiplePaymentValidation.valid
                                      ? `${paymentMethods.length} método(s) de pago`
                                      : multiplePaymentValidation.message}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatCurrency(multiplePaymentValidation.totalPayments || 0)}
                                </p>
                                <p className="text-xs text-gray-500">Total pagos</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NUEVO: Lista de métodos de pago múltiples */}
                    {multiplePaymentMode && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Métodos de pago</h4>
                          <button
                            onClick={handleAddPaymentMethod}
                            className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Agregar método
                          </button>
                        </div>

                        <div className="space-y-3">
                          {paymentMethods.map((pm, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                {/* Método */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Método</label>
                                  <select
                                    value={pm.method}
                                    onChange={(e) => handleUpdatePaymentMethod(index, "method", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={
                                      pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE && (!customer || isDefaultCustomer)
                                    }
                                  >
                                    {paymentMethodsOptions.map((option) => (
                                      <option key={option.id} value={option.id} disabled={option.disabled}>
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Monto */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Monto</label>
                                  <NumericFormat
                                    value={pm.amount || ""}
                                    onValueChange={(values) =>
                                      handleUpdatePaymentMethod(index, "amount", values.floatValue || 0)
                                    }
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="$ "
                                    decimalScale={2}
                                    allowNegative={false}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="$ 0,00"
                                  />
                                </div>

                                {/* Datos específicos del método */}
                                <div>
                                  {pm.method === PAYMENT_METHODS.TARJETA_CREDITO && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Últimos 4 dígitos
                                      </label>
                                      <input
                                        type="text"
                                        maxLength="4"
                                        value={pm.data?.cardNumber || ""}
                                        onChange={(e) =>
                                          handleUpdatePaymentMethod(index, "data", {
                                            ...pm.data,
                                            cardNumber: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="1234"
                                      />
                                    </div>
                                  )}

                                  {pm.method === PAYMENT_METHODS.TRANSFERENCIA && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Referencia</label>
                                      <input
                                        type="text"
                                        value={pm.data?.reference || ""}
                                        onChange={(e) =>
                                          handleUpdatePaymentMethod(index, "data", {
                                            ...pm.data,
                                            reference: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Referencia"
                                      />
                                    </div>
                                  )}

                                  {pm.method === PAYMENT_METHODS.EFECTIVO && (
                                    <div className="text-xs text-gray-500 pt-6">Efectivo</div>
                                  )}

                                  {pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE && (
                                    <div className="text-xs text-gray-500 pt-6">A cuenta</div>
                                  )}
                                </div>

                                {/* Botón eliminar */}
                                <div>
                                  {paymentMethods.length > 1 && (
                                    <button
                                      onClick={() => removePaymentMethod(index)}
                                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                      title="Eliminar método"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FILA 3: Detalles específicos según método seleccionado (solo modo simple) */}
                    {!multiplePaymentMode && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Columna izquierda: Cliente */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                              <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                              Cliente {paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE && "(Requerido)"}
                            </h4>

                            {customer ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                                    <p className="text-xs text-gray-500">{customer.document_number}</p>
                                  </div>
                                  <button
                                    onClick={handleRemoveCustomer}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => setShowCustomerSelector(true)} // Open CustomerSelectModal
                                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <UserIcon className="h-4 w-4 mr-2" />
                                  Cambiar Cliente
                                </button>

                                {/* Información de crédito compacta - Solo para cuenta corriente */}
                                {!isDefaultCustomer && paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE && (
                                  <>
                                    {loadingBalance ? (
                                      <div className="flex items-center justify-center py-3">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-xs text-gray-500">Cargando...</span>
                                      </div>
                                    ) : customerBalance ? (
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="text-center p-2 bg-white rounded-lg border">
                                            <p className="text-xs text-gray-500">Límite</p>
                                            <p className="font-medium text-xs text-gray-900">
                                              {formatCurrency(creditLimit)}
                                            </p>
                                          </div>
                                          <div className="text-center p-2 bg-white rounded-lg border">
                                            <p className="text-xs text-gray-500">Disponible</p>
                                            <p
                                              className={`font-medium text-xs ${availableCredit >= finalTotal ? "text-green-600" : "text-red-600"}`}
                                            >
                                              {formatCurrency(availableCredit)}
                                            </p>
                                          </div>
                                        </div>

                                        {exceedsLimit ? (
                                          <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                                            <div>
                                              <p className="text-xs font-medium text-red-800">Límite excedido</p>
                                              <p className="text-xs text-red-600">
                                                Excede: {formatCurrency(newBalance - creditLimit)}
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-lg">
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                            <p className="text-xs font-medium text-green-800">Crédito suficiente</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </>
                                )}

                                {/* Indicador de cliente por defecto */}
                                {isDefaultCustomer && (
                                  <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <BoltIcon className="h-4 w-4 text-green-600 mr-2" />
                                    <div>
                                      <p className="text-xs font-medium text-green-800">Cliente por defecto</p>
                                      <p className="text-xs text-green-600">Para ventas rápidas</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <button
                                  onClick={() => setShowCustomerSelector(true)} // Open CustomerSelectModal
                                  className="w-full flex items-center justify-center px-3 py-3 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                  <UserIcon className="h-4 w-4 mr-2" />
                                  Seleccionar Cliente
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Venta rápida (only if no customer is selected) */}
                          {!customer && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                              <div className="flex items-center">
                                <BoltIcon className="h-5 w-5 text-green-600 mr-2" />
                                <div>
                                  <h4 className="font-medium text-green-900 text-sm">Venta Rápida</h4>
                                  <p className="text-xs text-green-700">Sin cliente específico</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Columna derecha: Campos específicos del método de pago */}
                        <div className="space-y-4">
                          {/* Campos para efectivo */}
                          {paymentMethod === PAYMENT_METHODS.EFECTIVO && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-200 space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-green-800 mb-2">Monto recibido</label>
                                <NumericFormat
                                  getInputRef={amountInputRef}
                                  value={paymentData.amountReceived || ""}
                                  onValueChange={handleAmountChange}
                                  onFocus={handleAmountFocus}
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  prefix="$ "
                                  decimalScale={2}
                                  allowNegative={false}
                                  className="w-full px-3 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium bg-white"
                                  placeholder="$ 0,00"
                                />
                              </div>

                              {/* Información de cambio compacta */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                  <p className="text-xs text-green-700">Recibido</p>
                                  <p className="text-lg font-bold text-green-900">
                                    {formatCurrency(paymentData.amountReceived)}
                                  </p>
                                </div>
                                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                  <p className="text-xs text-green-700">Vuelto</p>
                                  <p className={`text-lg font-bold ${change >= 0 ? "text-green-900" : "text-red-600"}`}>
                                    {formatCurrency(Math.max(0, change))}
                                  </p>
                                </div>
                              </div>

                              {/* Botones de montos rápidos compactos */}
                              <div>
                                <p className="text-xs font-medium text-green-800 mb-2">Montos rápidos</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    finalTotal,
                                    Math.ceil(finalTotal / 1000) * 1000,
                                    Math.ceil(finalTotal / 5000) * 5000,
                                    Math.ceil(finalTotal / 10000) * 10000,
                                  ].map((amount, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleQuickAmount(amount)}
                                      className="px-3 py-2 text-xs bg-white hover:bg-green-100 text-green-800 rounded-lg transition-colors font-medium border border-green-200"
                                    >
                                      {formatCurrency(amount)}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Alertas compactas */}
                              {paymentData.amountReceived > 0 && paymentData.amountReceived < finalTotal && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-xs font-medium text-red-700">
                                    Faltan: {formatCurrency(finalTotal - paymentData.amountReceived)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Campos para tarjeta de crédito / débito */}
                          {(paymentMethod === PAYMENT_METHODS.TARJETA_CREDITO ||
                            paymentMethod === PAYMENT_METHODS.TARJETA_DEBITO) && (
                            <div className="bg-purple-50 border-purple-200 rounded-xl p-4 border space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-purple-800 mb-2">
                                  Últimos 4 dígitos
                                </label>
                                <NumericFormat
                                  value={paymentData.cardNumber}
                                  onValueChange={handleCardNumberChange}
                                  format="####"
                                  mask="_"
                                  allowEmptyFormatting
                                  className="w-full px-3 py-3 border border-purple-300 focus:ring-purple-500 focus:border-purple-500 rounded-lg focus:ring-2 text-center text-lg font-mono bg-white"
                                  placeholder="1234"
                                />
                              </div>

                              <div className="space-y-3">
                                {/* Campos de cuotas e interés */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-purple-800 mb-1">Cuotas</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="24"
                                      value={paymentData.installments}
                                      onChange={(e) =>
                                        setPaymentData({
                                          ...paymentData,
                                          installments: Math.max(1, Number.parseInt(e.target.value) || 1),
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-center"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-purple-800 mb-1">
                                      Interés (%)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={paymentData.interestRate}
                                      onChange={(e) =>
                                        setPaymentData({
                                          ...paymentData,
                                          interestRate: Math.max(0, Number.parseFloat(e.target.value) || 0),
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-center"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>

                                {/* Resumen de cuotas */}
                                {paymentData.installments > 1 && (
                                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                      <div>
                                        <p className="text-xs text-purple-700">Total con interés</p>
                                        <p className="font-semibold text-purple-900">
                                          {formatCurrency(finalTotal * (1 + paymentData.interestRate / 100))}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-purple-700">Por cuota</p>
                                        <p className="font-semibold text-purple-900">
                                          {formatCurrency(
                                            (finalTotal * (1 + paymentData.interestRate / 100)) /
                                              paymentData.installments,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                      <p className="text-xs text-purple-600">
                                        {paymentData.installments} cuotas de{" "}
                                        {formatCurrency(
                                          (finalTotal * (1 + paymentData.interestRate / 100)) /
                                            paymentData.installments,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Campos para transferencia */}
                          {paymentMethod === PAYMENT_METHODS.TRANSFERENCIA && (
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                              <label className="block text-sm font-medium text-indigo-800 mb-2">
                                Referencia de transferencia
                              </label>
                              <input
                                type="text"
                                value={paymentData.reference}
                                onChange={(e) =>
                                  setPaymentData({
                                    ...paymentData,
                                    reference: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                placeholder="Número de referencia"
                              />
                            </div>
                          )}

                          {/* Información para cuenta corriente */}
                          {paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE && (
                            <div
                              className={`border-2 rounded-xl p-4 ${exceedsLimit ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  {exceedsLimit ? (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                                  ) : (
                                    <BuildingLibraryIcon className="h-5 w-5 text-orange-500" />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <p
                                    className={`text-sm font-medium ${exceedsLimit ? "text-red-800" : "text-orange-800"}`}
                                  >
                                    {exceedsLimit ? "Límite excedido" : "Cuenta Corriente"}
                                  </p>
                                  <p className={`text-xs ${exceedsLimit ? "text-red-700" : "text-orange-700"}`}>
                                    {exceedsLimit
                                      ? `Excede por: ${formatCurrency(newBalance - creditLimit)}`
                                      : "Se agregará al saldo pendiente"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* NUEVO: Sección de cliente para modo múltiple */}
                    {multiplePaymentMode && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                          Cliente{" "}
                          {paymentMethods.some((pm) => pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE) &&
                            "(Requerido para cuenta corriente)"}
                        </h4>

                        {customer ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.document_number}</p>
                              </div>
                              <button
                                onClick={handleRemoveCustomer}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </div>
                            {/* Add the "Cambiar Cliente" button here */}
                            <button
                              onClick={() => setShowCustomerSelector(true)} // Open CustomerSelectModal
                              className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              Cambiar Cliente
                            </button>
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={() => setShowCustomerSelector(true)} // Open CustomerSelectModal
                              className="w-full flex items-center justify-center px-3 py-3 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              Seleccionar Cliente
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer con botones */}
                  <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <Button
                      variant="outline"
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 py-3 text-sm font-medium rounded-lg"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleProcessSale}
                      loading={loading}
                      className="flex-1 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md"
                      disabled={
                        (!multiplePaymentMode &&
                          ((paymentMethod === PAYMENT_METHODS.EFECTIVO && paymentData.amountReceived < finalTotal) ||
                            (paymentMethod === PAYMENT_METHODS.TARJETA_CREDITO && !paymentData.cardNumber) ||
                            (paymentMethod === PAYMENT_METHODS.TRANSFERENCIA && !paymentData.reference) ||
                            (paymentMethod === PAYMENT_METHODS.CUENTA_CORRIENTE &&
                              (!customer || isDefaultCustomer || exceedsLimit)))) ||
                        (multiplePaymentMode &&
                          (paymentMethods.length === 0 ||
                            !multiplePaymentValidation.valid ||
                            (paymentMethods.some((pm) => pm.method === PAYMENT_METHODS.CUENTA_CORRIENTE) &&
                              (!customer || isDefaultCustomer))))
                      }
                    >
                      {loading ? "Procesando..." : "Confirmar Pago"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
          {/* Customer Select Modal (always rendered but hidden) */}
          <CustomerSelectModal
            show={showCustomerSelector}
            onClose={() => setShowCustomerSelector(false)}
            onSelectCustomer={handleCustomerSelect}
          />
        </Dialog>
      </Transition>

      <TicketPrintModal
        isOpen={showTicketPrintModal}
        onClose={() => setShowTicketPrintModal(false)}
        saleData={lastCompletedSale}
      />
    </>
  )
}

export default PaymentModal
