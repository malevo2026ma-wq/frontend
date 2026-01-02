"use client"

import { useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { useCustomerStore } from "../../stores/customerStore"
import { useToast } from "../../hooks/useToast"
import { formatCurrency } from "../../lib/formatters"
import Button from "../common/Button"
import { NumericFormat } from "react-number-format"
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline"

const CustomerForm = ({ customer, onClose, onSuccess }) => {
  const { createCustomer, updateCustomer, loading } = useCustomerStore()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document_number: "",
    address: "",
    city: "",
    credit_limit: "",
    notes: "",
    active: true,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        document_number: customer.document_number || "",
        address: customer.address || "",
        city: customer.city || "",
        credit_limit: customer.credit_limit?.toString() || "",
        notes: customer.notes || "",
        active: customer.active !== undefined ? customer.active : true,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        document_number: "",
        address: "",
        city: "",
        credit_limit: "",
        notes: "",
        active: true,
      })
    }
    setErrors({})
  }, [customer])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    if (formData.phone && formData.phone.length < 8) {
      newErrors.phone = "El teléfono debe tener al menos 8 dígitos"
    }

    if (formData.credit_limit && Number.parseFloat(formData.credit_limit) < 0) {
      newErrors.credit_limit = "El límite de crédito no puede ser negativo"
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
      const cleanData = { ...formData }
      Object.keys(cleanData).forEach((key) => {
        if (typeof cleanData[key] === "string" && cleanData[key].trim() === "") {
          cleanData[key] = null
        }
      })

      if (cleanData.credit_limit) {
        cleanData.credit_limit = Number.parseFloat(cleanData.credit_limit)
      } else {
        cleanData.credit_limit = 0
      }

      if (customer) {
        await updateCustomer(customer.id, cleanData)
        showToast("Cliente actualizado correctamente", "success")
      } else {
        await createCustomer(cleanData)
        showToast("Cliente creado correctamente", "success")
      }

      onSuccess()
    } catch (error) {
      console.error("Error guardando cliente:", error)
      showToast(error.message || "Error guardando cliente", "error")
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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        {customer ? (
                          <PencilIcon className="h-5 w-5 text-white" />
                        ) : (
                          <PlusIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                        {customer ? "Editar Cliente" : "Nuevo Cliente"}
                      </Dialog.Title>
                      <p className="text-xs text-blue-100 mt-0.5">
                        {customer ? "Actualiza la información del cliente" : "Completa los datos para crear el cliente"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/10 transition-colors p-1.5 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
                    <div className="lg:col-span-1 hidden lg:block border-r border-gray-100 bg-gray-50 p-6 overflow-y-auto">
                      <div className="sticky top-0">
                        <div className="flex items-center mb-4">
                          <UserIcon className="h-4 w-4 text-gray-600 mr-2" />
                          <h4 className="text-sm font-semibold text-gray-700">Vista Previa</h4>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-4 space-y-4">
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">
                              {formData.name || "Nombre del cliente"}
                            </h5>
                            {formData.document_number && (
                              <p className="text-xs text-gray-500">Doc: {formData.document_number}</p>
                            )}
                          </div>

                          <div className="space-y-2 pt-3 border-t border-gray-100">
                            {formData.email && (
                              <div className="flex items-start gap-2">
                                <EnvelopeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-gray-600 break-all">{formData.email}</span>
                              </div>
                            )}
                            {formData.phone && (
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{formData.phone}</span>
                              </div>
                            )}
                            {formData.city && (
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600">{formData.city}</span>
                              </div>
                            )}
                          </div>

                          {formData.credit_limit && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-1">Límite de Crédito</span>
                              <span className="block text-sm font-bold text-green-600">
                                {formatCurrency(Number.parseFloat(formData.credit_limit))}
                              </span>
                            </div>
                          )}

                          {formData.notes && (
                            <div className="pt-3 border-t border-gray-100">
                              <span className="block text-xs text-gray-500 mb-1">Notas</span>
                              <p className="text-xs text-gray-600 line-clamp-3">{formData.notes}</p>
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
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                                Información Básica
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nombre completo <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                      errors.name
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400 bg-white"
                                    }`}
                                    placeholder="Ej: Juan García López"
                                    autoFocus
                                  />
                                  {errors.name && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                      {errors.name}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label
                                    htmlFor="document_number"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                  >
                                    Número de Documento
                                  </label>
                                  <input
                                    type="text"
                                    name="document_number"
                                    id="document_number"
                                    value={formData.document_number}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white"
                                    placeholder="Ej: 12.345.678-9"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-2 text-blue-600" />
                                Información de Contacto
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                      errors.email
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400 bg-white"
                                    }`}
                                    placeholder="correo@ejemplo.com"
                                  />
                                  {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                      {errors.email}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Teléfono
                                  </label>
                                  <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                      errors.phone
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-300 hover:border-gray-400 bg-white"
                                    }`}
                                    placeholder="Ej: +56 9 1234 5678"
                                  />
                                  {errors.phone && (
                                    <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                      <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                      {errors.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-2 text-blue-600" />
                                  Ubicación
                                </h3>
                                <div className="space-y-4">
                                  <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                                      Dirección
                                    </label>
                                    <input
                                      type="text"
                                      name="address"
                                      id="address"
                                      value={formData.address}
                                      onChange={handleChange}
                                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white"
                                      placeholder="Ej: Calle Principal 123"
                                    />
                                  </div>

                                  <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                                      Ciudad
                                    </label>
                                    <input
                                      type="text"
                                      name="city"
                                      id="city"
                                      value={formData.city}
                                      onChange={handleChange}
                                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white"
                                      placeholder="Ej: Santiago"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-blue-600" />
                                  Crédito y Notas
                                </h3>
                                <div className="space-y-4">
                                  <div>
                                    <label
                                      htmlFor="credit_limit"
                                      className="block text-sm font-medium text-gray-700 mb-1.5"
                                    >
                                      Límite de Crédito
                                    </label>
                                    <NumericFormat
                                      name="credit_limit"
                                      value={formData.credit_limit}
                                      onValueChange={(values) => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          credit_limit: values.floatValue ? values.floatValue.toString() : "",
                                        }))
                                      }}
                                      thousandSeparator="."
                                      decimalSeparator=","
                                      prefix="$"
                                      decimalScale={2}
                                      fixedDecimalScale={false}
                                      allowLeadingZeros={false}
                                      className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                        errors.credit_limit
                                          ? "border-red-300 bg-red-50"
                                          : "border-gray-300 hover:border-gray-400 bg-white"
                                      }`}
                                      placeholder="$0"
                                    />
                                    {errors.credit_limit && (
                                      <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                        <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                        {errors.credit_limit}
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                                      Notas
                                    </label>
                                    <textarea
                                      name="notes"
                                      id="notes"
                                      value={formData.notes}
                                      onChange={handleChange}
                                      rows="2"
                                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-400 bg-white resize-none"
                                      placeholder="Ej: Información adicional o referencias"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Cliente activo</span>
                            </label>
                          </div>
                        </form>
                      </div>

                      <div className="flex justify-end gap-3 px-6 py-6 border-t border-gray-200 bg-gray-50">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} loading={loading}>
                          {loading ? "Guardando..." : customer ? "Actualizar Cliente" : "Crear Cliente"}
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

export default CustomerForm
