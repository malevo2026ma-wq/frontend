"use client"

import { useEffect } from "react"
import { useCashStore } from "@/stores/cashStore"
import { formatCurrency, formatDateTime } from "@/lib/formatters"
import Card from "@/components/common/Card"
import {
  BanknotesIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  ChartBarIcon,
  XCircleIcon,
  ReceiptPercentIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline"

const CashSummary = () => {
  const { currentCash, fetchCurrentStatus, loading } = useCashStore()

  useEffect(() => {
    fetchCurrentStatus()
  }, [fetchCurrentStatus])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
        <span className="text-gray-600">Cargando resumen...</span>
      </div>
    )
  }

  if (!currentCash.isOpen) {
    return (
      <div className="text-center py-12">
        <BanknotesIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Caja Cerrada</h3>
        <p className="mt-2 text-gray-500">La caja debe estar abierta para ver el resumen</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información de la sesión */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Sesión Actual
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Fecha de apertura</p>
              <p className="font-semibold">{formatDateTime(currentCash.openingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Abierta por</p>
              <p className="font-semibold flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {currentCash.openedBy || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto inicial</p>
              <p className="font-bold text-lg text-gray-700">{formatCurrency(currentCash.openingAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ventas procesadas</p>
              <p className="font-bold text-lg text-indigo-600">{currentCash.cantidadVentas}</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Ingresos del Día */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <Card.Body>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center text-green-700 mb-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Total Ingresos del Día</span>
                </div>
                <p className="text-3xl font-bold text-green-900 mb-1">{formatCurrency(currentCash.totalIngresosDia)}</p>
                <p className="text-xs text-green-700">Ventas + Pagos cta cte + Depósitos</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Efectivo en Caja Física */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <Card.Body>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center text-blue-700 mb-2">
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Efectivo en Caja</span>
                </div>
                <p className="text-3xl font-bold text-blue-900 mb-1">{formatCurrency(currentCash.efectivoFisico)}</p>
                <p className="text-xs text-blue-700">Dinero físico disponible</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Ganancia Neta del Día */}
        <Card
          className={`bg-gradient-to-br ${currentCash.gananciaNeta >= 0 ? "from-purple-50 to-violet-50 border-purple-200" : "from-red-50 to-rose-50 border-red-200"}`}
        >
          <Card.Body>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div
                  className={`flex items-center mb-2 ${currentCash.gananciaNeta >= 0 ? "text-purple-700" : "text-red-700"}`}
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Ganancia Neta</span>
                </div>
                <p
                  className={`text-3xl font-bold mb-1 ${currentCash.gananciaNeta >= 0 ? "text-purple-900" : "text-red-900"}`}
                >
                  {formatCurrency(currentCash.gananciaNeta)}
                </p>
                <p className={`text-xs ${currentCash.gananciaNeta >= 0 ? "text-purple-700" : "text-red-700"}`}>
                  Ingresos - Gastos - Retiros
                </p>
              </div>
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${currentCash.gananciaNeta >= 0 ? "bg-purple-500" : "bg-red-500"}`}
                >
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Desglose de Ventas por Método de Pago</h3>
          <p className="text-sm text-gray-500 mt-1">Total de ventas: {formatCurrency(currentCash.totalVentas)}</p>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BanknotesIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Efectivo</p>
                    <p className="text-xs text-green-600">Afecta caja física</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-900">{formatCurrency(currentCash.ventasEfectivo)}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Tarjetas</p>
                    <p className="text-xs text-blue-600">Crédito y Débito (no afectan caja física)</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(currentCash.ventasTarjeta)}
                </p>
              </div>
              <div className="mt-2 text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Crédito:</span>
                  <span className="font-semibold">
                    {formatCurrency(currentCash.ventasTarjetaCredito)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Débito:</span>
                  <span className="font-semibold">
                    {formatCurrency(currentCash.ventasTarjetaDebito)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowsRightLeftIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Transferencia</p>
                    <p className="text-xs text-purple-600">No afecta caja física</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(currentCash.ventasTransferencia)}</p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Otros Ingresos */}
        <Card>
          <Card.Header>
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-green-600" />
              Otros Ingresos
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <ReceiptPercentIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <span className="text-sm text-gray-700">Pagos Cuenta Corriente</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(currentCash.pagosCuentaCorriente)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center">
                  <PlusIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Depósitos Adicionales</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(currentCash.depositos)}</span>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Egresos */}
        <Card>
          <Card.Header>
            <h3 className="text-base font-medium text-gray-900 flex items-center">
              <MinusIcon className="h-5 w-5 mr-2 text-red-600" />
              Egresos
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <MinusIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm text-gray-700">Gastos</span>
                </div>
                <span className="font-semibold text-red-600">{formatCurrency(currentCash.gastos)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <MinusIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm text-gray-700">Retiros</span>
                </div>
                <span className="font-semibold text-red-600">{formatCurrency(currentCash.retiros)}</span>
              </div>
              {currentCash.cancelaciones > 0 && (
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-gray-700">Cancelaciones</span>
                  </div>
                  <span className="font-semibold text-red-500">{formatCurrency(currentCash.cancelaciones)}</span>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-gray-300">
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Resumen del Día</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Efectivo Inicial</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentCash.openingAmount)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Total Recibido Hoy</p>
              <p className="text-2xl font-bold text-green-600">+ {formatCurrency(currentCash.totalIngresosDia)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Total Egresos</p>
              <p className="text-2xl font-bold text-red-600">- {formatCurrency(currentCash.totalEgresosDia)}</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-blue-900">Total General de Caja</p>
                <p className="text-xs text-blue-700 mt-1">(Inicial + Total Recibido - Egresos)</p>
              </div>
              <p className="text-4xl font-bold text-blue-900">{formatCurrency(currentCash.totalGeneralCaja)}</p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default CashSummary
