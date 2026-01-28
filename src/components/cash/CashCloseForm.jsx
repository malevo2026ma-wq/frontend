"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { NumericFormat } from "react-number-format"
import { useCashStore } from "@/stores/cashStore"
import { useToast } from "@/hooks/useToast"
import { formatCurrency, formatDateTime } from "@/lib/formatters"
import Button from "@/components/common/Button"
import {
  XMarkIcon,
  CalculatorIcon,
  ChartBarIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

const schema = yup.object({
  notes: yup.string(),
  physicalCount: yup.number().nullable(),
  usePhysicalCount: yup.boolean(),
})

const CashCloseForm = ({ isOpen, onClose }) => {
  const { currentCash, closeCash, loading, getClosingSummary, fetchCurrentStatus } = useCashStore()
  const { success, error } = useToast()
  const [showPhysicalCount, setShowPhysicalCount] = useState(false)
  const closingSummary = getClosingSummary()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      notes: "",
      physicalCount: null,
      usePhysicalCount: false,
    },
  })

  const usePhysicalCount = watch("usePhysicalCount")
  const physicalCount = watch("physicalCount")

  const handlePhysicalCountChange = (values) => {
    const { floatValue } = values
    setValue("physicalCount", floatValue || 0)
  }

  const onSubmit = async (data) => {
    try {
      const countData = data.usePhysicalCount ? { physicalAmount: data.physicalCount } : null
      const result = await closeCash(countData, data.notes)

      if (result.success) {
        const difference = result.data?.difference || 0

        if (Math.abs(difference) === 0) {
          success("Caja cerrada correctamente sin diferencias")
        } else {
          success(`Caja cerrada con diferencia de ${formatCurrency(difference)}`)
        }

        await fetchCurrentStatus()
        onClose && onClose()
      }
    } catch (err) {
      error(err.message || "Error al cerrar la caja")
    }
  }

  const expectedAmount = closingSummary.efectivoFisico
  const countedAmount = usePhysicalCount ? physicalCount || 0 : expectedAmount
  const difference = countedAmount - expectedAmount

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
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CalculatorIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                        Cierre de Caja
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">
                        Sesión iniciada: {formatDateTime(currentCash.openingDate)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                          <div className="flex items-center text-green-700 mb-3">
                            <ChartBarIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Total Ingresos del Día</span>
                          </div>
                          <p className="text-3xl font-bold text-green-900 mb-2">
                            {formatCurrency(closingSummary.totalIngresos)}
                          </p>
                          <div className="space-y-1 text-xs text-green-700">
                            <p>
                              Ventas:{" "}
                              {formatCurrency(
                                closingSummary.desglose.ventasEfectivo +
                                  closingSummary.desglose.ventasTarjeta +
                                  closingSummary.desglose.ventasTransferencia,
                              )}
                            </p>
                            <p>Pagos cta cte: {formatCurrency(closingSummary.desglose.pagosCuentaCorriente)}</p>
                            <p>Depósitos: {formatCurrency(closingSummary.desglose.depositos)}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                          <div className="flex items-center text-blue-700 mb-3">
                            <BanknotesIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Efectivo en Caja Física</span>
                          </div>
                          <p className="text-3xl font-bold text-blue-900 mb-2">
                            {formatCurrency(closingSummary.efectivoFisico)}
                          </p>
                          <p className="text-xs text-blue-700">Solo dinero físico en caja</p>
                        </div>

                        <div
                          className={`bg-gradient-to-br rounded-xl p-5 border ${closingSummary.gananciaNeta >= 0 ? "from-purple-50 to-violet-50 border-purple-200" : "from-red-50 to-rose-50 border-red-200"}`}
                        >
                          <div
                            className={`flex items-center mb-3 ${closingSummary.gananciaNeta >= 0 ? "text-purple-700" : "text-red-700"}`}
                          >
                            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Ganancia Neta</span>
                          </div>
                          <p
                            className={`text-3xl font-bold mb-2 ${closingSummary.gananciaNeta >= 0 ? "text-purple-900" : "text-red-900"}`}
                          >
                            {formatCurrency(closingSummary.gananciaNeta)}
                          </p>
                          <p
                            className={`text-xs ${closingSummary.gananciaNeta >= 0 ? "text-purple-700" : "text-red-700"}`}
                          >
                            Ingresos - Gastos - Retiros
                          </p>
                        </div>
                      </div>

                      {/* Desglose detallado */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-4">Desglose Detallado</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700">Ingresos:</p>
                            <div className="pl-3 space-y-1 text-gray-600">
                              <p>Ventas efectivo: {formatCurrency(closingSummary.desglose.ventasEfectivo)}</p>
                              <p>
                                Ventas tarjeta crédito:{" "}
                                {formatCurrency(closingSummary.desglose.ventasTarjetaCredito)}
                              </p>
                              <p>
                                Ventas tarjeta débito:{" "}
                                {formatCurrency(closingSummary.desglose.ventasTarjetaDebito)}
                              </p>
                              <p>Ventas transferencia: {formatCurrency(closingSummary.desglose.ventasTransferencia)}</p>
                              <p>
                                Pagos cuenta corriente: {formatCurrency(closingSummary.desglose.pagosCuentaCorriente)}
                              </p>
                              <p>Depósitos: {formatCurrency(closingSummary.desglose.depositos)}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700">Egresos:</p>
                            <div className="pl-3 space-y-1 text-gray-600">
                              <p>Gastos: {formatCurrency(closingSummary.desglose.gastos)}</p>
                              <p>Retiros: {formatCurrency(closingSummary.desglose.retiros)}</p>
                              {closingSummary.desglose.cancelaciones > 0 && (
                                <p>Cancelaciones: {formatCurrency(closingSummary.desglose.cancelaciones)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comparación con efectivo físico */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <input
                            {...register("usePhysicalCount")}
                            type="checkbox"
                            id="usePhysicalCount"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            onChange={(e) => setShowPhysicalCount(e.target.checked)}
                          />
                          <label htmlFor="usePhysicalCount" className="ml-2 text-sm font-medium text-gray-700">
                            Comparar con efectivo físico contado manualmente
                          </label>
                        </div>

                        {(showPhysicalCount || usePhysicalCount) && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Efectivo físico contado
                              </label>
                              <NumericFormat
                                value={physicalCount || ""}
                                onValueChange={handlePhysicalCountChange}
                                thousandSeparator="."
                                decimalSeparator=","
                                prefix="$ "
                                decimalScale={2}
                                allowNegative={false}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold text-center bg-white"
                                placeholder="$ 0,00"
                              />
                            </div>

                            {/* Comparación */}
                            <div className="bg-white p-4 rounded-lg border">
                              <h5 className="font-medium text-gray-900 mb-3">Comparación</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Efectivo esperado (sistema):</span>
                                  <span className="font-medium">{formatCurrency(expectedAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Efectivo físico contado:</span>
                                  <span className="font-medium">{formatCurrency(countedAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                  <span className="font-medium">Diferencia:</span>
                                  <span
                                    className={`font-bold ${
                                      difference === 0
                                        ? "text-green-600"
                                        : difference > 0
                                          ? "text-blue-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {difference === 0 ? (
                                      <span className="flex items-center">
                                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                                        Sin diferencia
                                      </span>
                                    ) : (
                                      formatCurrency(difference)
                                    )}
                                  </span>
                                </div>
                              </div>

                              {difference !== 0 && (
                                <div
                                  className={`mt-3 p-3 rounded border ${difference > 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
                                >
                                  <div className="flex items-start">
                                    <ExclamationTriangleIcon
                                      className={`h-5 w-5 mr-2 flex-shrink-0 ${difference > 0 ? "text-blue-600" : "text-red-600"}`}
                                    />
                                    <p className={`text-xs ${difference > 0 ? "text-blue-700" : "text-red-700"}`}>
                                      {difference > 0
                                        ? "Hay más efectivo del esperado. Verifica si hubo ingresos no registrados."
                                        : "Falta efectivo. Verifica si hubo gastos o retiros no registrados."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones del cierre</label>
                        <textarea
                          {...register("notes")}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition-all resize-none bg-white"
                          placeholder="Observaciones sobre el cierre de caja..."
                        />
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 py-3 text-sm font-medium rounded-xl bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    loading={loading}
                    className="flex-1 py-3 text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Cerrando..." : "Cerrar Caja"}
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

export default CashCloseForm
