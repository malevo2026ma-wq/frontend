"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { NumericFormat } from "react-number-format"
import { useProductStore } from "../../stores/productStore"
import { useCategoryStore } from "../../stores/categoryStore"
import { useToast } from "../../contexts/ToastContext"
import { formatQuantity } from "../../lib/formatters"
import Button from "../common/Button"
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilIcon,
  SwatchIcon,
  ScaleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline"

const ProductForm = ({ isOpen, product, onClose, onSave, nameInputRef }) => {
  const { createProduct, updateProduct, loading } = useProductStore()
  const { categories, fetchCategories } = useCategoryStore()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    stock: "",
    min_stock: "10",
    category_id: "",
    barcode: "",
    image: "",
    unit_type: "unidades",
    active: true,
  })

  const [errors, setErrors] = useState({})

  // Cargar categorías al montar
  useEffect(() => {
    if (isOpen) {
      fetchCategories({ active: "true" })
    }
  }, [isOpen, fetchCategories])

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (product) {
      const formatStockValue = (value, unitType) => {
        if (!value) return ""
        const num = Number.parseFloat(value)
        if (isNaN(num)) return ""

        // Para unidades, mostrar como entero
        if (unitType === "unidades") {
          return Math.floor(num).toString()
        }

        // Para kg, mantener decimales
        return num.toString()
      }

      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        cost: product.cost?.toString() || "",
        // Aplicando formateo correcto para stock y min_stock
        stock: formatStockValue(product.stock, product.unit_type || "unidades"),
        min_stock: formatStockValue(product.min_stock, product.unit_type || "unidades"),
        category_id: product.category_id?.toString() || "",
        barcode: product.barcode || "",
        image: product.image || "",
        unit_type: product.unit_type || "unidades",
        active: product.active !== undefined ? product.active : true,
      })
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        description: "",
        price: "",
        cost: "",
        stock: "",
        min_stock: "10",
        category_id: "",
        barcode: "",
        image: "",
        unit_type: "unidades",
        active: true,
      })
    }
    setErrors({})
  }, [product, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    // Lógica especial para cambios de unidad de medida
    if (name === "unit_type") {
      if (value === "unidades" && formData.unit_type === "kg") {
        setFormData((prev) => ({
          ...prev,
          [name]: newValue,
          stock: prev.stock ? Math.floor(Number.parseFloat(prev.stock)).toString() : "",
          min_stock: prev.min_stock ? Math.floor(Number.parseFloat(prev.min_stock)).toString() : "",
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: newValue,
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }))
    }

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Manejar cambios en campos numéricos con validación por unidad
  const handleNumericChange = (name, value) => {
    let processedValue = value

    // Para campos de stock, validar según el tipo de unidad
    if ((name === "stock" || name === "min_stock") && formData.unit_type === "unidades") {
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue)) {
        processedValue = Math.floor(numValue).toString()
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Manejar cambios en los campos de precio con formato
  const handlePriceChange = (name, values) => {
    const { value } = values
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

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      newErrors.price = "El precio debe ser mayor a 0"
    }
    
    if (formData.cost && Number.parseFloat(formData.cost) < 0) {
      newErrors.cost = "El costo no puede ser negativo"
    }

    // Validar stock solo si no estamos editando o si el stock fue modificado
    if (!product || formData.stock !== (product.stock?.toString() || "")) {
      if (formData.stock === "") {
        // Permitir vacío si no es requerido explícitamente, pero validamos si se proporciona
      } else {
        const stockValue = Number.parseFloat(formData.stock)
        if (stockValue < 0) {
          newErrors.stock = "El stock no puede ser negativo"
        } else if (formData.unit_type === "unidades" && !Number.isInteger(stockValue)) {
          newErrors.stock = "Para productos por unidades, el stock debe ser un número entero"
        }
      }
    }


    if (!formData.min_stock || Number.parseFloat(formData.min_stock) < 0) {
      newErrors.min_stock = "El stock mínimo es requerido y no puede ser negativo"
    } else if (formData.unit_type === "unidades" && !Number.isInteger(Number.parseFloat(formData.min_stock))) {
      newErrors.min_stock = "Para productos por unidades, el stock mínimo debe ser un número entero"
    }

    if (formData.image && formData.image.trim() !== "") {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(formData.image)) {
        newErrors.image = "La imagen debe ser una URL válida (http:// o https://)"
      }
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
      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: Number.parseFloat(formData.price),
        cost: formData.cost ? Number.parseFloat(formData.cost) : 0,
        min_stock: formData.min_stock ? Number.parseFloat(formData.min_stock) : 10,
        category_id: formData.category_id ? Number.parseInt(formData.category_id) : null,
        barcode: formData.barcode.trim() || null,
        image: formData.image.trim() || null,
        unit_type: formData.unit_type,
        active: formData.active,
      }

      // Solo agregar stock si no estamos editando
      if (!product) {
        dataToSend.stock = formData.stock ? Number.parseFloat(formData.stock) : 0
      }

      if (product) {
        await updateProduct(product.id, dataToSend)
        showToast("Producto actualizado correctamente", "success")
      } else {
        await createProduct(dataToSend)
        showToast("Producto creado correctamente", "success")
      }

      onSave?.()
      onClose()
    } catch (error) {
      console.error("Error saving product:", error)
      showToast(error.message || "Error al guardar el producto", "error")
    }
  }

  // Verificar si generará alerta
  const willGenerateAlert = () => {
    const currentStock = Number.parseFloat(formData.stock) || 0
    const minStock = Number.parseFloat(formData.min_stock) || 0
    // Solo generar alerta si el stock actual es menor o igual al mínimo Y el stock actual es mayor a cero (para no alertar cuando está en 0 y el mínimo también)
    return currentStock <= minStock && currentStock > 0
  }

  // Calcular margen de ganancia
  const calculateMargin = () => {
    const price = Number.parseFloat(formData.price) || 0
    const cost = Number.parseFloat(formData.cost) || 0
    if (price > 0 && cost > 0) {
      return (((price - cost) / price) * 100).toFixed(1)
    }
    return 0
  }

  // Obtener configuración de input según tipo de unidad
  const getQuantityInputProps = (fieldName) => {
    const baseProps = {
      name: fieldName,
      value: formData[fieldName],
      onChange: (e) => handleNumericChange(fieldName, e.target.value),
      className: `block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
        errors[fieldName] ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400 bg-white"
      }`,
    }

    if (formData.unit_type === "unidades") {
      return {
        ...baseProps,
        type: "number",
        min: "0",
        step: "1",
        placeholder: "0",
      }
    } else {
      return {
        ...baseProps,
        type: "number",
        min: "0",
        step: "0.001",
        placeholder: "0.000",
      }
    }
  }

  const selectedCategory = categories.find((cat) => cat.id === Number.parseInt(formData.category_id))

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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        {product ? (
                          <PencilIcon className="h-5 w-5 text-white" />
                        ) : (
                          <PlusIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                        {product ? "Editar Producto" : "Nuevo Producto"}
                      </Dialog.Title>
                      <p className="text-xs text-blue-100 mt-0.5">
                        {product ? "Actualiza la información del producto" : "Completa los datos para crear el producto"}
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

                {/* Contenido Principal */}
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

                    {/* Sidebar derecho con vista previa */}
                    <div className="lg:col-span-1 hidden lg:block border-r border-gray-100 bg-gray-50 p-6 overflow-y-auto">
                      <div className="sticky top-0">
                        <div className="flex items-center mb-4">
                          <TagIcon className="h-4 w-4 text-gray-600 mr-2" />
                          <h4 className="text-sm font-semibold text-gray-700">Vista Previa</h4>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                          {/* Imagen */}
                          <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                            {formData.image ? (
                              <img
                                src={formData.image || "/placeholder.svg"}
                                alt={formData.name || "Vista previa"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <PhotoIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-4 space-y-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 line-clamp-2">
                                {formData.name || "Nombre del producto"}
                              </h5>
                              {formData.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{formData.description}</p>
                              )}
                            </div>

                            {selectedCategory && (
                              <span
                                className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                                style={{
                                  backgroundColor: `${selectedCategory.color}15`,
                                  color: selectedCategory.color,
                                }}
                              >
                                {selectedCategory.name}
                              </span>
                            )}

                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-gray-900">
                                ${formData.price ? Number.parseFloat(formData.price).toFixed(2) : "0.00"}
                              </span>
                              {formData.cost && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${Number.parseFloat(formData.cost).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                              <div>
                                <span className="block text-xs text-gray-500">Stock</span>
                                <span className="block text-sm font-semibold text-gray-900">
                                  {formData.stock || "0"} {formData.unit_type === "kg" ? "kg" : "u"}
                                </span>
                              </div>
                              <div>
                                <span className="block text-xs text-gray-500">Mínimo</span>
                                <span className="block text-sm font-semibold text-gray-900">
                                  {formData.min_stock || "10"} {formData.unit_type === "kg" ? "kg" : "u"}
                                </span>
                              </div>
                            </div>

                            {formData.barcode && (
                              <div className="pt-3 border-t border-gray-100">
                                <span className="block text-xs text-gray-500">Código de Barras</span>
                                <span className="block font-mono text-xs font-medium text-gray-900">
                                  {formData.barcode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info tip */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700">
                            <span className="font-semibold">Tip:</span> Usa <kbd className="px-1.5 py-0.5 bg-white rounded text-blue-900 font-mono text-xs shadow-sm">Tab</kbd> para navegar entre campos
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Formulario principal */}
                    <div className="lg:col-span-3 flex flex-col">
                      <div className="flex-1 overflow-y-auto max-h-[calc(95vh-180px)] p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nombre del producto <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="name"
                                id="name"
                                ref={nameInputRef}
                                value={formData.name}
                                onChange={handleChange}
                                className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                  errors.name
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400 bg-white"
                                }`}
                                placeholder="Ej: Laptop Dell XPS 15"
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
                              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Descripción
                              </label>
                              <input
                                type="text"
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all bg-white"
                                placeholder="Descripción breve (opcional)"
                              />
                            </div>
                          </div>

                          {/* Fila 2: Categoría y Código de Barras */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Categoría <span className="text-xs text-gray-400">(opcional)</span>
                              </label>
                              <div className="relative">
                                <select
                                  name="category_id"
                                  id="category_id"
                                  value={formData.category_id}
                                  onChange={handleChange}
                                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all bg-white appearance-none"
                                >
                                  <option value="">Sin categoría</option>
                                  {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                                <SwatchIcon className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                              </div>
                              {!formData.category_id && (
                                <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                                  <InformationCircleIcon className="h-3.5 w-3.5 mr-1" />
                                  El producto se creará sin categoría asignada
                                </p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Código de Barras <span className="text-xs text-gray-400">(opcional)</span>
                              </label>
                              <input
                                type="text"
                                name="barcode"
                                id="barcode"
                                value={formData.barcode}
                                onChange={handleChange}
                                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-all bg-white"
                                placeholder="Ej: 7501234567890"
                              />
                            </div>
                          </div>

                          {/* Fila 3: Precios */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Precio de Venta <span className="text-red-500">*</span>
                              </label>
                              <NumericFormat
                                name="price"
                                value={formData.price}
                                onValueChange={(values) => handlePriceChange("price", values)}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="$ "
                                decimalScale={2}
                                allowNegative={false}
                                className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                  errors.price
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400 bg-white"
                                }`}
                                placeholder="$ 0,00"
                              />
                              {errors.price && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                  <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                  {errors.price}
                                </p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Costo
                              </label>
                              <NumericFormat
                                name="cost"
                                value={formData.cost}
                                onValueChange={(values) => handlePriceChange("cost", values)}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="$ "
                                decimalScale={2}
                                allowNegative={false}
                                className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                  errors.cost
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400 bg-white"
                                }`}
                                placeholder="$ 0,00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Margen</label>
                              <div className="flex h-[42px] items-center rounded-lg border border-gray-200 bg-gray-50 px-4">
                                <span className="text-sm font-semibold text-blue-600">{calculateMargin()}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Fila 4: Inventario */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1.5">
                                {product ? "Stock Actual" : "Stock Inicial"} <span className="text-red-500">*</span>
                              </label>
                              <input {...getQuantityInputProps("stock")} disabled={!!product} />
                              {errors.stock && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                  <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                  {errors.stock}
                                </p>
                              )}
                              {product && (
                                <p className="mt-1.5 text-xs text-blue-600 flex items-center">
                                  <InformationCircleIcon className="h-3.5 w-3.5 mr-1" />
                                  Usa "Movimientos de Stock" para modificar
                                </p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Stock Mínimo <span className="text-red-500">*</span>
                              </label>
                              <input {...getQuantityInputProps("min_stock")} />
                              {errors.min_stock && (
                                <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                  <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                  {errors.min_stock}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Fila 5: Unidad de Medida */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Unidad de Medida <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              <label
                                className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                  formData.unit_type === "unidades"
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name="unit_type"
                                    value="unidades"
                                    checked={formData.unit_type === "unidades"}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <div className="flex items-center">
                                      <CubeIcon className="h-4 w-4 text-gray-600 mr-1.5" />
                                      <span className="text-sm font-medium text-gray-900">Unidades</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Productos individuales</p>
                                  </div>
                                </div>
                              </label>

                              <label
                                className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                  formData.unit_type === "kg"
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center">
                                  <input
                                    type="radio"
                                    name="unit_type"
                                    value="kg"
                                    checked={formData.unit_type === "kg"}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                  />
                                  <div className="ml-3">
                                    <div className="flex items-center">
                                      <ScaleIcon className="h-4 w-4 text-gray-600 mr-1.5" />
                                      <span className="text-sm font-medium text-gray-900">Kilogramos</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Productos por peso</p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>

                          {/* Fila 6: Imagen */}
                          <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1.5">
                              URL de Imagen <span className="text-xs text-gray-400">(opcional)</span>
                            </label>
                            <input
                              type="url"
                              name="image"
                              id="image"
                              value={formData.image}
                              onChange={handleChange}
                              className={`block w-full px-4 py-2.5 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                  errors.image
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-300 hover:border-gray-400 bg-white"
                                }`}
                              placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            {errors.image && (
                              <p className="mt-1.5 text-xs text-red-600 flex items-center">
                                <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                {errors.image}
                              </p>
                            )}
                          </div>

                          {/* Estado activo (solo edición) */}
                          {product && (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <input
                                  id="active"
                                  name="active"
                                  type="checkbox"
                                  checked={formData.active}
                                  onChange={handleChange}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                                  Producto activo y disponible para venta
                                </label>
                              </div>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con botones */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="py-2.5 px-5 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="py-2.5 px-5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        {product ? "Actualizar" : "Crear"}
                      </>
                    )}
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

export default ProductForm
