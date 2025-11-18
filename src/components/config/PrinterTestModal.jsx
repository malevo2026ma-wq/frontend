"use client"

import { useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import printerDetectionService from "@/services/printerDetectionService"
import escposService from "@/services/escposService"
import { useToast } from "@/contexts/ToastContext"
import {
  XMarkIcon,
  PrinterIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import Button from "@/components/common/Button"

const PrinterTestModal = ({ isOpen, onClose, onPrinterSelected }) => {
  const { showToast } = useToast()
  const [printers, setPrinters] = useState([])
  const [selectedPrinter, setSelectedPrinter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (isOpen) {
      detectPrinters()
    }
  }, [isOpen])

  const detectPrinters = async () => {
    setDetecting(true)
    try {
      console.log('[v0] Iniciando detección de impresoras...')
      
      // Primero obtener puertos ya conectados
      const detectedPrinters = await printerDetectionService.detectSerialPrinters()
      setPrinters(detectedPrinters)
      
      console.log('[v0] Impresoras detectadas:', detectedPrinters.length)
      
      if (detectedPrinters.length === 0) {
        showToast('No se detectaron impresoras. Conecte una impresora USB y vuelva a intentar.', 'info')
      } else {
        showToast(`${detectedPrinters.length} impresora(s) detectada(s)`, 'success')
      }
    } catch (error) {
      console.error('[v0] Error detectando:', error)
      showToast(error.message, 'error')
    } finally {
      setDetecting(false)
    }
  }

  const handleRequestPrinter = async () => {
    setLoading(true)
    try {
      console.log('[v0] Solicitando selección de impresora...')
      const printer = await printerDetectionService.requestPrinterSelection()
      setPrinters(prev => [printer, ...prev])
      setSelectedPrinter(printer)
      showToast('Impresora seleccionada correctamente', 'success')
    } catch (error) {
      console.error('[v0] Error:', error)
      showToast(error.message || 'Error seleccionando impresora', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectPrinter = async (printer) => {
    setLoading(true)
    try {
      console.log('[v0] Conectando a:', printer.name)
      const result = await printerDetectionService.connectToPrinter(printer)
      setSelectedPrinter({ ...printer, connected: true })
      showToast(result.message, 'success')
      setTestResult(null)
    } catch (error) {
      console.error('[v0] Error:', error)
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTestPrinter = async () => {
    if (!selectedPrinter) return

    setTestingConnection(true)
    try {
      console.log('[v0] Probando conexión con:', selectedPrinter.name)
      const result = await printerDetectionService.testConnection(selectedPrinter)
      setTestResult({ success: true, message: result.message })
      showToast('Prueba de conexión exitosa', 'success')
    } catch (error) {
      console.error('[v0] Error en prueba:', error)
      setTestResult({ success: false, message: error.message })
      showToast(error.message, 'error')
    } finally {
      setTestingConnection(false)
    }
  }

  const handlePrintTestTicket = async () => {
    if (!selectedPrinter) return

    setLoading(true)
    try {
      console.log('[v0] Imprimiendo ticket de prueba...')

      // Generar un pequeño ticket de prueba
      const testEscpos = Buffer.from([
        0x1b, 0x40,                           // ESC @ - Reset
        0x1b, 0x61, 0x01,                     // ESC a 1 - Centered
        0x1b, 0x45, 0x01,                     // ESC E 1 - Emphasis ON
        0x1b, 0x21, 0x10,                     // ESC ! 16 - Double height & width
      ]).toString('base64')

      const testMessage = '=== PRUEBA ===\n'
      const messageBinary = Buffer.from(testMessage).toString('base64')

      const combined = Buffer.from(
        Buffer.concat([
          Buffer.from(testEscpos, 'base64'),
          Buffer.from(messageBinary, 'base64'),
        ])
      ).toString('base64')

      const result = await printerDetectionService.sendDataToPrinter(selectedPrinter, combined)
      showToast('Ticket de prueba enviado', 'success')
    } catch (error) {
      console.error('[v0] Error imprimiendo:', error)
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrinter = () => {
    if (!selectedPrinter || !selectedPrinter.connected) {
      showToast('Seleccione y conecte una impresora primero', 'error')
      return
    }
    onPrinterSelected(selectedPrinter)
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <PrinterIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Configurar Impresora Térmica
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Botones de Detección */}
                  <div className="flex gap-2">
                    <Button
                      onClick={detectPrinters}
                      loading={detecting}
                      loadingText="Detectando..."
                      variant="secondary"
                      className="flex-1"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Detectar
                    </Button>
                    <Button
                      onClick={handleRequestPrinter}
                      loading={loading}
                      loadingText="Solicitando..."
                      className="flex-1"
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Seleccionar
                    </Button>
                  </div>

                  {/* Lista de Impresoras */}
                  {printers.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Impresoras Disponibles
                      </p>
                      <div className="space-y-2">
                        {printers.map((printer) => (
                          <div
                            key={printer.id}
                            onClick={() => setSelectedPrinter(printer)}
                            className={`p-2 rounded cursor-pointer border transition ${
                              selectedPrinter?.id === printer.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {printer.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {printer.type} {printer.connected ? '(Conectada)' : '(No conectada)'}
                                </p>
                              </div>
                              {printer.connected && (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de Control */}
                  {selectedPrinter && (
                    <div className="space-y-2">
                      {!selectedPrinter.connected ? (
                        <Button
                          onClick={() => handleConnectPrinter(selectedPrinter)}
                          loading={loading}
                          loadingText="Conectando..."
                          fullWidth
                        >
                          Conectar Impresora
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleTestPrinter}
                            loading={testingConnection}
                            loadingText="Probando..."
                            variant="secondary"
                            fullWidth
                          >
                            Probar Conexión
                          </Button>
                          <Button
                            onClick={handlePrintTestTicket}
                            loading={loading}
                            loadingText="Imprimiendo..."
                            variant="secondary"
                            fullWidth
                          >
                            Imprimir Prueba
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Resultado de Prueba */}
                  {testResult && (
                    <div
                      className={`p-3 rounded-lg border ${
                        testResult.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {testResult.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {testResult.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de Confirmación */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button onClick={onClose} variant="secondary">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePrinter}
                    disabled={!selectedPrinter?.connected}
                  >
                    Guardar Impresora
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

export default PrinterTestModal
