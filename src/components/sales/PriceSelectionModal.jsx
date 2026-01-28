'use client';

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, CreditCardIcon, BanknotesIcon, TagIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline"
import { formatCurrency } from "../../lib/formatters"
import { useSalesStore } from "../../stores/salesStore"
import Button from "../common/Button"

export default function PriceSelectionModal({ isOpen, onClose, product }) {
  const { addToCart } = useSalesStore()
  const selectedPriceType = null; // Declare the variable here
  const [quantity, setQuantity] = React.useState(1); // Declare quantity state

  const decrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity - 1);
  };

  const incrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  };

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedPriceType);
    onClose();
  };

  if (!product) return null

  const handleSelectPrice = (priceType) => {
    // Agregar al carrito con cantidad 1 y el tipo de precio seleccionado
    addToCart(product, 1, priceType)
    onClose()
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="relative border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <TagIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Seleccionar Precio
                      </Dialog.Title>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {product.image ? (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                        <TagIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        Stock disponible: {product.stock} unidades
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Options */}
                <div className="px-6 py-6 space-y-3">
                  {/* Precio de Lista */}
                  <button
                    onClick={() => handleSelectPrice("list")}
                    className={`group w-full rounded-xl border-2 p-5 text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                      selectedPriceType === "list"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 transition-colors group-hover:bg-purple-200">
                          <CreditCardIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Precio de Lista</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(product.price_list)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-purple-50 px-3 py-1">
                        <p className="text-xs font-medium text-purple-700">Tarjeta</p>
                      </div>
                    </div>
                  </button>

                  {/* Precio de Contado */}
                  <button
                    onClick={() => handleSelectPrice("cash")}
                    className={`group w-full rounded-xl border-2 p-5 text-left transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                      selectedPriceType === "cash"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-green-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                          <BanknotesIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Precio de Contado</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(product.price_cash)}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 px-3 py-1">
                        <p className="text-xs font-medium text-green-700">Efectivo</p>
                      </div>
                    </div>
                    {product.price_cash < product.price_list && (
                      <div className="mt-3 rounded-lg bg-green-50 px-3 py-2">
                        <p className="text-xs font-medium text-green-700">
                          Ahorro: {formatCurrency(product.price_list - product.price_cash)}
                        </p>
                      </div>
                    )}
                  </button>
                </div>

                {/* Quantity Selector */}
                {selectedPriceType && (
                  <div className="px-6 pb-6 space-y-3">
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={decrementQuantity}
                          disabled={quantity <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <MinusIcon className="h-5 w-5" />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={handleQuantityChange}
                          min="1"
                          max={product.stock}
                          className="h-10 w-20 rounded-lg border-2 border-gray-300 text-center text-lg font-semibold focus:border-primary-500 focus:outline-none"
                        />
                        <button
                          onClick={incrementQuantity}
                          disabled={quantity >= product.stock}
                          className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                        <div className="flex-1 text-right">
                          <p className="text-sm text-gray-500">
                            Disponible: <span className="font-medium text-gray-700">{product.stock}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-lg bg-gradient-to-r from-primary-50 to-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <span className="text-2xl font-bold text-primary-600">
                          {formatCurrency(
                            (selectedPriceType === "list" ? product.price_list : product.price_cash) * quantity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                  {selectedPriceType ? (
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 bg-transparent"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleAddToCart}
                        className="flex-1"
                      >
                        Agregar al Carrito
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="w-full bg-transparent"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
