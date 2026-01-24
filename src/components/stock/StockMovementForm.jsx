"use client"

import React from "react"
import { useState, useEffect, useCallback } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { useStockStore } from "../../stores/stockStore"
import { useToast } from "../../contexts/ToastContext"
import { STOCK_MOVEMENTS, STOCK_MOVEMENT_LABELS } from "../../lib/constants"
import { formatQuantity, formatStock, validateQuantity } from "../../lib/formatters"
import Button from "../common/Button"
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PhotoIcon, // AGREGADO: Icono para productos sin imagen
} from "@heroicons/react/24/outline"

const StockMovementForm = ({ isOpen, selectedProduct, onClose, onSave }) => {
  const { addStockMovement, loading } = useStockStore()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    product_id: "",
    type: STOCK_MOVEMENTS.ENTRADA,
    quantity: "",
    reason: "",
  })

  const [errors, setErrors] = useState({})
  const [activeSection, setActiveSection] = useState("movement")
  const [completedSections, setCompletedSections] = useState(new Set())

  // Usar useCallback para evitar recreación de la función
  const resetForm = useCallback(() => {
    setFormData({
      product_id: selectedProduct?.id?.toString() || "",
      type: STOCK_MOVEMENTS.ENTRADA,
      quantity: "",
      reason: "",
    })
    setCompletedSections(new Set(["product"]))
    setActiveSection("movement")
    setErrors({})
  }, [selectedProduct])

  // useEffect con dependencias estables
  useEffect(() => {
    if (!selectedProduct) {
      // Si no hay producto seleccionado, cerrar el modal
      if (isOpen) {
        onClose()
      }
      return
    }

    if (isOpen && selectedProduct) {
      resetForm()
    }
  }, [selectedProduct, isOpen, onClose, resetForm])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar error del campo
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }))
  }, [])

  // Manejar cambios en cantidad - solo enteros
  const handleQuantityChange = useCallback(
    (value) => {
      let processedValue = value

      // Solo permitir enteros positivos
      if (value) {
        const numValue = Number.parseInt(value)
        if (!isNaN(numValue)) {
          processedValue = Math.floor(Math.abs(numValue)).toString()
        }
      }

      setFormData((prev) => ({
        ...prev,
        quantity: processedValue,
      }))

      // Limpiar error
      setErrors((prev) => ({
        ...prev,
        quantity: "",
      }))
    },
    [],
  )

  // Validación por sección
  const validateSection = useCallback(
    (sectionId) => {
      const newErrors = {}

      switch (sectionId) {
        case "movement":
          if (!formData.type) {
            newErrors.type = "Selecciona el tipo de movimiento"
          }

          if (!formData.quantity || Number.parseInt(formData.quantity) <= 0) {
            newErrors.quantity = "La cantidad debe ser mayor a 0"
          } else if (selectedProduct) {
            // Validar que sea entero positivo
            if (!validateQuantity(formData.quantity)) {
              newErrors.quantity = "Ingresa un número entero válido"
            }

            // Validar stock suficiente para salidas
            if (formData.type === STOCK_MOVEMENTS.SALIDA) {
              const quantity = Number.parseInt(formData.quantity)
              if (quantity > selectedProduct.stock) {
                newErrors.quantity = `Stock insuficiente. Disponible: ${formatStock(selectedProduct.stock)}`
              }
            }
          }
          break

        case "details":
          if (!formData.reason.trim() || formData.reason.trim().length < 5) {
            newErrors.reason = "La razón debe tener al menos 5 caracteres"
          }
          break
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [formData, selectedProduct],
  )

  const validateForm = useCallback(() => {
    return validateSection("movement") && validateSection("details")
  }, [validateSection])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()

      if (!validateForm()) {
        showToast("Por favor corrige los errores en el formulario", "error")
        return
      }

      try {
        const movementData = {
          product_id: Number.parseInt(formData.product_id),
          type: formData.type,
          quantity: Number.parseInt(formData.quantity),
          reason: formData.reason.trim(),
        }

        await addStockMovement(movementData)
        showToast("Movimiento de stock registrado correctamente", "success")
        onSave?.()
        onClose()
      } catch (error) {
        console.error("Error creating stock movement:", error)
        showToast(error.message || "Error al registrar el movimiento", "error")
      }
    },
    [formData, validateForm, addStockMovement, showToast, onSave, onClose],
  )

  // Navegación entre secciones
  const handleContinue = useCallback(() => {
    if (!validateSection(activeSection)) {
      showToast("Por favor corrige los errores antes de continuar", "error")
      return
    }

    // Marcar sección como completada
    setCompletedSections((prev) => new Set([...prev, activeSection]))

    // Ir a la siguiente sección
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id)
    }
  }, [activeSection, validateSection, showToast])

  const handleBack = useCallback(() => {
    const currentIndex = sections.findIndex((s) => s.id === activeSection)
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id)
    }
  }, [activeSection])

  const canNavigateToSection = useCallback(
    (sectionId) => {
      const sectionIndex = sections.findIndex((s) => s.id === sectionId)
      const currentIndex = sections.findIndex((s) => s.id === activeSection)

      // Puede navegar a secciones completadas o a la siguiente sección disponible
      return completedSections.has(sectionId) || sectionIndex <= currentIndex
    },
    [activeSection, completedSections],
  )

  const getSectionStatus = useCallback(
    (sectionId) => {
      if (completedSections.has(sectionId)) return "completed"
      if (sectionId === activeSection) return "current"
      if (canNavigateToSection(sectionId)) return "available"
      return "locked"
    },
    [completedSections, activeSection, canNavigateToSection],
  )

  // Calcular nuevo stock - solo enteros
  const calculateNewStock = useCallback(() => {
    if (!selectedProduct || !formData.quantity) return selectedProduct?.stock || 0

    const quantity = Number.parseInt(formData.quantity)
    const currentStock = Number.parseInt(selectedProduct.stock)

    switch (formData.type) {
      case STOCK_MOVEMENTS.ENTRADA:
        return currentStock + quantity
      case STOCK_MOVEMENTS.SALIDA:
        return Math.max(0, currentStock - quantity)
      case STOCK_MOVEMENTS.AJUSTE:
        return quantity
      default:
        return currentStock
    }
  }, [selectedProduct, formData.quantity, formData.type])

  const getMovementDescription = useCallback(() => {
    switch (formData.type) {
      case STOCK_MOVEMENTS.ENTRADA:
        return "Se sumará la cantidad al stock actual"
      case STOCK_MOVEMENTS.SALIDA:
        return "Se restará la cantidad del stock actual"
      case STOCK_MOVEMENTS.AJUSTE:
        return "El stock se establecerá exactamente a la cantidad indicada"
      default:
        return ""
    }
  }, [formData.type])

  const getMovementIcon = useCallback((type) => {
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
  }, [])

  const getMovementColor = useCallback((type) => {
    switch (type) {
      case STOCK_MOVEMENTS.ENTRADA:
        return "from-green-500 to-green-600"
      case STOCK_MOVEMENTS.SALIDA:
        return "from-red-500 to-red-600"
      case STOCK_MOVEMENTS.AJUSTE:
        return "from-blue-500 to-blue-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }, [])

  // Obtener configuración de input - solo enteros
  const getQuantityInputProps = useCallback(() => {
    return {
      value: formData.quantity,
      onChange: (e) => handleQuantityChange(e.target.value),
      type: "number",
      min: "0",
      step: "1",
      placeholder: "0",
      className: `block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold text-center ${
        errors.quantity ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
      }`,
    }
  }, [formData.quantity, handleQuantityChange, errors.quantity])

  // Solo secciones de movimiento y detalles
  const sections = [
    { id: "movement", name: "Movimiento", icon: ArrowsRightLeftIcon },
    { id: "details", name: "Detalles", icon: InformationCircleIcon },
  ]

  const currentSectionIndex = sections.findIndex((s) => s.id === activeSection)
  const isLastSection = currentSectionIndex === sections.length - 1

  const movementTypes = [
    {
      value: STOCK_MOVEMENTS.ENTRADA,
      label: STOCK_MOVEMENT_LABELS[STOCK_MOVEMENTS.ENTRADA],
      icon: ArrowTrendingUpIcon,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
    },
    {
      value: STOCK_MOVEMENTS.SALIDA,
      label: STOCK_MOVEMENT_LABELS[STOCK_MOVEMENTS.SALIDA],
      icon: ArrowTrendingDownIcon,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
    },
    {
      value: STOCK_MOVEMENTS.AJUSTE,
      label: STOCK_MOVEMENT_LABELS[STOCK_MOVEMENTS.AJUSTE],
      icon: AdjustmentsHorizontalIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    },
  ]

  // Si no hay producto seleccionado, no mostrar el modal
  if (!selectedProduct) {
    return null
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${getMovementColor(formData.type)} rounded-xl flex items-center justify-center shadow-lg`}
                      >
                        {React.createElement(getMovementIcon(formData.type), { className: "h-6 w-6 text-white" })}
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        Movimiento de Stock - {selectedProduct.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">Registra un movimiento para este producto</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 w-full">
                    {/* Sidebar de navegación - Fijo */}
                    <div className="lg:col-span-1 lg:sticky lg:top-0 lg:h-fit">
                      {/* Información del producto */}
                      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center mb-3">
                          <CubeIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <h4 className="text-sm font-medium text-blue-900">Producto</h4>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* ACTUALIZADO: Icono por defecto cuando no hay imagen */}
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-blue-200">
                            {selectedProduct.image ? (
                              <img
                                src={selectedProduct.image || "/placeholder.svg"}
                                alt={selectedProduct.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{selectedProduct.name}</div>
                            <div className="text-xs text-gray-500">
                              Stock: {formatStock(selectedProduct.stock)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ELIMINADO: Barra de progreso */}

                      <div className="space-y-2">
                        {sections.map((section, index) => {
                          const status = getSectionStatus(section.id)
                          const canNavigate = canNavigateToSection(section.id)

                          return (
                            <button
                              key={section.id}
                              onClick={() => canNavigate && setActiveSection(section.id)}
                              disabled={!canNavigate}
                              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                                status === "current"
                                  ? "bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm"
                                  : status === "completed"
                                    ? "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100"
                                    : status === "available"
                                      ? "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
                                      : "text-gray-400 border-2 border-transparent cursor-not-allowed"
                              }`}
                            >
                              <section.icon className="h-5 w-5 mr-3" />
                              <span className="font-medium flex-1">{section.name}</span>
                              {status === "completed" && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                              {status === "current" && <div className="h-2 w-2 bg-blue-600 rounded-full" />}
                              {status === "locked" && <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />}
                            </button>
                          )
                        })}
                      </div>

                      {/* Vista previa del movimiento */}
                      {formData.quantity && (
                        <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Vista Previa</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Producto:</span>
                              <span className="text-xs font-medium text-gray-900 truncate ml-2">
                                {selectedProduct.name}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Tipo:</span>
                              <span className="text-xs font-medium text-blue-600">
                                {STOCK_MOVEMENT_LABELS[formData.type]}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Cantidad:</span>
                              <span className="text-xs font-bold text-green-600">
                                {formatQuantity(formData.quantity)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Stock actual:</span>
                              <span className="text-xs font-medium text-gray-900">
                                {formatStock(selectedProduct.stock)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Stock nuevo:</span>
                              <span className="text-xs font-bold text-blue-600">
                                {formatStock(calculateNewStock())}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Stock actual:</span>
                              <span className="text-xs font-medium text-gray-900">
                                {formatStock(selectedProduct.stock)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Nuevo stock:</span>
                              <span className="text-xs font-bold text-blue-600">
                                {formatStock(calculateNewStock())}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contenido del formulario - Con scroll */}
                    <div className="lg:col-span-3 flex flex-col">
                      <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full pr-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          {/* Sección Movimiento */}
                          {activeSection === "movement" && (
                            <div className="space-y-6">
                              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                                <div className="flex items-center mb-4">
                                  <ArrowsRightLeftIcon className="h-6 w-6 text-purple-600 mr-3" />
                                  <h3 className="text-lg font-semibold text-purple-900">Tipo de Movimiento</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {movementTypes.map((type) => (
                                    <div
                                      key={type.value}
                                      className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                        formData.type === type.value
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      onClick={() => handleChange({ target: { name: "type", value: type.value } })}
                                    >
                                      <div className="flex items-center">
                                        <input
                                          type="radio"
                                          name="type"
                                          value={type.value}
                                          checked={formData.type === type.value}
                                          onChange={handleChange}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <div className="ml-3 flex-1">
                                          <div className="flex items-center">
                                            <type.icon className={`h-5 w-5 mr-2 ${type.color}`} />
                                            <span className="text-sm font-medium text-gray-900">{type.label}</span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">{getMovementDescription()}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Cantidad */}
                                <div className="mt-6">
                                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                                    Cantidad * (unidades)
                                  </label>
                                  <input {...getQuantityInputProps()} />
                                  {errors.quantity && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                      {errors.quantity}
                                    </p>
                                  )}
                                  <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                                    <div className="text-sm text-gray-600">
                                      <p className="font-medium mb-1">Información del producto:</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Stock actual:</span>
                                        <span className="font-semibold">
                                          {formatStock(selectedProduct.stock)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-blue-600 mt-2">
                                        💡 Solo números enteros (ej: 1, 5, 10 unidades)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sección Detalles */}
                          {activeSection === "details" && (
                            <div className="space-y-6">
                              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                                <div className="flex items-center mb-4">
                                  <InformationCircleIcon className="h-6 w-6 text-orange-600 mr-3" />
                                  <h3 className="text-lg font-semibold text-orange-900">Detalles del Movimiento</h3>
                                </div>

                                {/* Razón */}
                                <div>
                                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Razón del movimiento *
                                  </label>
                                  <textarea
                                    name="reason"
                                    id="reason"
                                    rows={4}
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className={`block w-full px-4 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all resize-none ${
                                      errors.reason ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"
                                    }`}
                                    placeholder="Describe la razón de este movimiento de stock (mínimo 5 caracteres)"
                                  />
                                  {errors.reason && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                      {errors.reason}
                                    </p>
                                  )}
                                </div>

                                {/* Vista previa del cambio */}
                                {formData.quantity && (
                                  <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200">
                                    <h4 className="text-sm font-medium text-orange-900 mb-3">
                                      Resumen del Movimiento:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Stock Actual</p>
                                        <p className="text-lg font-bold text-gray-900">
                                          {formatStock(selectedProduct.stock)}
                                        </p>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Movimiento</p>
                                        <p
                                          className={`text-lg font-bold ${
                                            formData.type === STOCK_MOVEMENTS.ENTRADA
                                              ? "text-green-600"
                                              : formData.type === STOCK_MOVEMENTS.SALIDA
                                                ? "text-red-600"
                                                : "text-blue-600"
                                          }`}
                                        >
                                          {formData.type === STOCK_MOVEMENTS.ENTRADA
                                            ? "+"
                                            : formData.type === STOCK_MOVEMENTS.SALIDA
                                              ? "-"
                                              : "="}
                                          {formatQuantity(formData.quantity)}
                                        </p>
                                      </div>
                                      <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Nuevo Stock</p>
                                        <p className="text-lg font-bold text-green-600">
                                          {formatStock(calculateNewStock())}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Alertas */}
                                    {formData.type === STOCK_MOVEMENTS.SALIDA && calculateNewStock() === 0 && (
                                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start">
                                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                                          <div className="text-sm text-yellow-800">
                                            <p className="font-medium">⚠️ Advertencia</p>
                                            <p>El producto quedará sin stock después de este movimiento</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {calculateNewStock() <= selectedProduct.min_stock && calculateNewStock() > 0 && (
                                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start">
                                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                                          <div className="text-sm text-amber-800">
                                            <p className="font-medium">📊 Stock bajo</p>
                                            <p>
                                              El stock quedará por debajo del mínimo recomendado (
                                              {formatStock(selectedProduct.min_stock)})
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con navegación */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="py-3 text-sm font-medium rounded-xl bg-transparent"
                  >
                    Cancelar
                  </Button>

                  <div className="flex-1 flex gap-3">
                    {currentSectionIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex items-center py-3 text-sm font-medium rounded-xl bg-white border-gray-300 hover:bg-gray-50"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Atrás
                      </Button>
                    )}

                    {!isLastSection ? (
                      <Button
                        type="button"
                        onClick={handleContinue}
                        className="flex-1 flex items-center justify-center py-3 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg text-white"
                      >
                        Continuar
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        loading={loading}
                        onClick={handleSubmit}
                        className={`flex-1 py-3 text-sm font-medium bg-gradient-to-r ${getMovementColor(formData.type)} hover:opacity-90 rounded-xl shadow-lg text-white`}
                        disabled={loading}
                      >
                        {loading ? "Registrando..." : `Registrar ${STOCK_MOVEMENT_LABELS[formData.type]}`}
                      </Button>
                    )}
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

export default StockMovementForm
