/**
 * Servicio para detectar y gestionar impresoras USB térmicas
 * Compatible con XPrinter XP-58 y similares
 */

class PrinterDetectionService {
  constructor() {
    this.connectedPorts = new Map()
  }

  /**
   * Detecta todos los puertos seriales disponibles
   */
  async detectSerialPrinters() {
    console.log('[v0] Detectando impresoras seriales...')
    
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API no disponible. Use Chrome, Edge, o Brave.')
      }

      const ports = await navigator.serial.getPorts()
      console.log('[v0] Puertos encontrados:', ports.length)

      const printers = ports.map((port, index) => ({
        id: `port_${index}_${Date.now()}`,
        name: `Puerto Serial ${index + 1}`,
        port: port,
        type: 'serial',
        connected: false,
        lastConnection: null,
      }))

      return printers
    } catch (error) {
      console.error('[v0] Error detectando puertos seriales:', error)
      throw error
    }
  }

  /**
   * Solicita seleccionar una impresora USB
   */
  async requestPrinterSelection() {
    console.log('[v0] Solicitando selección de impresora...')
    
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API no disponible. Use Chrome, Edge, o Brave.')
      }

      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x0483 }, // STMicroelectronics (común en XPrinter)
          { usbVendorId: 0x1a86 }, // QinHeng Electronics
          { usbVendorId: 0x0400 }, // National Instruments
        ]
      })

      console.log('[v0] Puerto seleccionado:', port)

      const printer = {
        id: `port_${Date.now()}`,
        name: port.getInfo?.()?.usbProductString || 'Impresora Térmica USB',
        port: port,
        type: 'serial',
        connected: false,
        lastConnection: null,
        usbInfo: port.getInfo?.()
      }

      return printer
    } catch (error) {
      console.error('[v0] Error solicitando selección:', error)
      throw error
    }
  }

  /**
   * Conecta a una impresora específica
   */
  async connectToPrinter(printer) {
    console.log('[v0] Conectando a impresora:', printer.name)
    
    try {
      const port = printer.port

      // Si el puerto ya está abierto, no hacer nada
      if (this.connectedPorts.has(printer.id)) {
        console.log('[v0] Puerto ya conectado')
        return { success: true, message: 'Impresora ya conectada' }
      }

      // Abrir puerto con configuración estándar para impresoras térmicas
      await port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      })

      this.connectedPorts.set(printer.id, port)
      console.log('[v0] Impresora conectada correctamente')

      return { 
        success: true, 
        message: 'Conexión establecida con la impresora',
        printer: {
          ...printer,
          connected: true,
          lastConnection: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('[v0] Error conectando a impresora:', error)
      throw error
    }
  }

  /**
   * Desconecta de una impresora
   */
  async disconnectPrinter(printer) {
    console.log('[v0] Desconectando impresora:', printer.name)
    
    try {
      const port = this.connectedPorts.get(printer.id)
      
      if (!port) {
        console.log('[v0] Impresora no estaba conectada')
        return { success: true, message: 'Impresora no estaba conectada' }
      }

      await port.close()
      this.connectedPorts.delete(printer.id)
      
      console.log('[v0] Impresora desconectada')
      return { success: true, message: 'Impresora desconectada' }
    } catch (error) {
      console.error('[v0] Error desconectando:', error)
      throw error
    }
  }

  /**
   * Envía datos a una impresora conectada
   */
  async sendDataToPrinter(printer, escposBase64) {
    console.log('[v0] Enviando datos a impresora:', printer.name)
    
    try {
      const port = this.connectedPorts.get(printer.id)
      
      if (!port) {
        throw new Error('Impresora no conectada. Conecte primero.')
      }

      // Decodificar Base64 a bytes
      const binaryString = atob(escposBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('[v0] Enviando', bytes.length, 'bytes...')

      const writer = port.writable.getWriter()
      await writer.write(bytes)
      writer.releaseLock()

      console.log('[v0] Datos enviados correctamente')
      return { success: true, message: 'Ticket impreso correctamente' }
    } catch (error) {
      console.error('[v0] Error enviando datos:', error)
      throw error
    }
  }

  /**
   * Prueba la conexión con un pequeño comando
   */
  async testConnection(printer) {
    console.log('[v0] Probando conexión con impresora:', printer.name)
    
    try {
      // Comando ESC/POS simple: desactivar énfasis y alimentar una línea
      const testCommand = '\x1b\x45\x00'  // ESC E 0 (disable emphasis)
      const testBytes = new Uint8Array(testCommand.length)
      for (let i = 0; i < testCommand.length; i++) {
        testBytes[i] = testCommand.charCodeAt(i)
      }

      const port = this.connectedPorts.get(printer.id)
      
      if (!port) {
        throw new Error('Impresora no conectada')
      }

      const writer = port.writable.getWriter()
      await writer.write(testBytes)
      writer.releaseLock()

      console.log('[v0] Test exitoso')
      return { success: true, message: 'Conexión verificada correctamente' }
    } catch (error) {
      console.error('[v0] Error en test:', error)
      throw error
    }
  }

  /**
   * Obtiene lista de puertos conectados
   */
  getConnectedPrinters() {
    return Array.from(this.connectedPorts.keys())
  }

  /**
   * Limpia todos los puertos al desmontar
   */
  async cleanup() {
    console.log('[v0] Limpiando puertos...')
    for (const [id, port] of this.connectedPorts) {
      try {
        await port.close()
        console.log('[v0] Puerto cerrado:', id)
      } catch (error) {
        console.error('[v0] Error cerrando puerto:', error)
      }
    }
    this.connectedPorts.clear()
  }
}

export default new PrinterDetectionService()
