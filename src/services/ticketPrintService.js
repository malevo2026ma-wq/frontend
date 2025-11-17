// Servicio de impresión de tickets térmicos para Argentina
import { formatCurrency, formatDate } from "@/lib/formatters"

class TicketPrintService {
  constructor() {
    this.printerName = null
    this.paperWidth = 80 // 58mm o 80mm
  }

  /**
   * Configura el servicio de impresión
   */
  configure(printerName, paperWidth = 80) {
    this.printerName = printerName
    this.paperWidth = paperWidth
  }

  /**
   * Genera el HTML del ticket para impresión
   */
  generateTicketHTML(saleData, businessConfig, ticketConfig) {
    const { sale, items } = saleData
    
    const widthPx = this.paperWidth === 58 ? '220px' : '300px'
    
    // Determinar tamaño de fuente
    const fontSize = ticketConfig.font_size === 'small' ? '10px' : 
                     ticketConfig.font_size === 'large' ? '14px' : '12px'

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket #${sale.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: 100%;
            height: 100%;
          }

          @page {
            size: ${this.paperWidth}mm auto;
            margin: 0;
            padding: 0;
          }

          @media print {
            @page {
              size: ${this.paperWidth}mm auto;
              margin: 0;
              padding: 0;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: ${widthPx} !important;
              background: white !important;
            }
            
            .ticket-container {
              margin: 0 !important;
              padding: 0 !important;
              width: ${widthPx} !important;
              page-break-after: avoid;
            }
            
            .footer {
              page-break-inside: avoid;
            }
          }
          
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${fontSize};
            line-height: 1.3;
            width: ${widthPx};
            margin: 0 auto;
            padding: 6px;
            color: #000;
            background: #fff;
          }
          
          .ticket-container {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          .ticket {
            width: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .center {
            text-align: center;
          }
          
          .bold {
            font-weight: bold;
          }
          
          .separator {
            border-top: 1px dashed #000;
            margin: 6px 0;
            padding: 0;
          }
          
          .double-separator {
            border-top: 2px solid #000;
            margin: 6px 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 8px;
            padding: 0;
          }
          
          .business-name {
            font-size: ${ticketConfig.font_size === 'small' ? '12px' : 
                         ticketConfig.font_size === 'large' ? '16px' : '14px'};
            font-weight: bold;
            margin-bottom: 3px;
            line-height: 1.3;
          }
          
          .header-info {
            font-size: ${fontSize};
            line-height: 1.3;
            margin-bottom: 2px;
          }
          
          .info-line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            padding: 0;
            font-size: ${fontSize};
            line-height: 1.3;
          }
          
          .item-row {
            margin: 4px 0;
            padding: 0;
          }
          
          .item-name {
            font-weight: bold;
            font-size: ${fontSize};
            line-height: 1.3;
            margin-bottom: 2px;
            word-wrap: break-word;
          }
          
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: ${ticketConfig.font_size === 'small' ? '9px' : 
                         ticketConfig.font_size === 'large' ? '12px' : '10px'};
            line-height: 1.3;
            gap: 10px;
          }
          
          .item-qty {
            flex: 0 0 auto;
          }
          
          .item-price {
            flex: 1 1 auto;
            text-align: right;
          }
          
          .total-section {
            margin-top: 8px;
            font-weight: bold;
            font-size: ${ticketConfig.font_size === 'small' ? '12px' : 
                         ticketConfig.font_size === 'large' ? '16px' : '14px'};
            line-height: 1.3;
          }
          
          .footer {
            text-align: center;
            margin-top: 8px;
            font-size: ${ticketConfig.font_size === 'small' ? '8px' : 
                         ticketConfig.font_size === 'large' ? '12px' : '10px'};
            line-height: 1.3;
            word-wrap: break-word;
          }
          
          .barcode {
            text-align: center;
            margin: 8px 0;
            padding: 0;
          }
          
          img {
            max-width: 100%;
            height: auto;
            display: block;
          }

          .section-title {
            font-weight: bold;
            font-size: ${fontSize};
            margin: 4px 0 2px 0;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="ticket">
    `

    if (ticketConfig.show_business_info && businessConfig) {
      html += `<div class="header">`
      
      if (ticketConfig.show_logo && businessConfig.business_logo) {
        html += `<div style="margin-bottom: 3px;"><img src="${businessConfig.business_logo}" style="max-width: 70px; max-height: 70px; margin: 0 auto; display: block;" alt="Logo"></div>`
      }
      
      html += `<div class="business-name">${businessConfig.business_name || 'MI NEGOCIO'}</div>`
      
      if (businessConfig.business_address) {
        html += `<div class="header-info">${businessConfig.business_address}</div>`
      }
      
      if (businessConfig.business_phone) {
        html += `<div class="header-info">Tel: ${businessConfig.business_phone}</div>`
      }
      
      if (ticketConfig.show_cuit && businessConfig.business_cuit) {
        html += `<div class="header-info">CUIT: ${businessConfig.business_cuit}</div>`
      }
      
      if (businessConfig.business_email) {
        html += `<div class="header-info">${businessConfig.business_email}</div>`
      }
      
      html += `</div>`
    }

    if (ticketConfig.header_message) {
      html += `
        <div class="separator"></div>
        <div class="center header-info">${ticketConfig.header_message}</div>
      `
    }

    html += `<div class="double-separator"></div>`

    html += `
      <div class="center bold" style="font-size: ${ticketConfig.font_size === 'small' ? '12px' : ticketConfig.font_size === 'large' ? '16px' : '14px'}; margin: 3px 0;">
        ${ticketConfig.fiscal_type || 'TICKET'} #${sale.id}
      </div>
      <div class="center header-info">
        ${formatDate(sale.created_at, 'DD/MM/YYYY HH:mm')}
      </div>
    `

    html += `<div class="separator"></div>`

    if (ticketConfig.show_customer && sale.customer_name && sale.customer_name !== 'Consumidor Final') {
      html += `
        <div class="info-line">
          <span>Cliente:</span>
          <span>${sale.customer_name}</span>
        </div>
      `
      
      if (sale.customer_document) {
        html += `
          <div class="info-line">
            <span>DNI/CUIT:</span>
            <span>${sale.customer_document}</span>
          </div>
        `
      }
    }

    if (ticketConfig.show_cashier && sale.cashier_name) {
      html += `
        <div class="info-line">
          <span>Cajero:</span>
          <span>${sale.cashier_name}</span>
        </div>
      `
    }

    html += `<div class="separator"></div>`

    html += `<div class="section-title">DETALLE DE COMPRA</div>`
    html += `<div class="separator"></div>`

    items.forEach(item => {
      const quantity = Number.parseFloat(item.quantity)
      const unitPrice = Number.parseFloat(item.unit_price)
      const totalPrice = quantity * unitPrice
      
      // Determinar unidad
      const unit = item.product_unit_type === 'kg' ? 'kg' : 'un'
      
      html += `
        <div class="item-row">
          <div class="item-name">${item.product_name}</div>
          <div class="item-details">
            <span class="item-qty">${quantity} ${unit} x ${formatCurrency(unitPrice)}</span>
            <span class="item-price">${formatCurrency(totalPrice)}</span>
          </div>
        </div>
      `
    })

    html += `<div class="double-separator"></div>`

    const subtotal = Number.parseFloat(sale.subtotal)
    const tax = Number.parseFloat(sale.tax || 0)
    const total = Number.parseFloat(sale.total)

    html += `
      <div class="info-line">
        <span>Subtotal:</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
    `

    if (ticketConfig.show_tax_breakdown && tax > 0) {
      html += `
        <div class="info-line">
          <span>IVA (21%):</span>
          <span>${formatCurrency(tax)}</span>
        </div>
      `
    }

    html += `
      <div class="double-separator"></div>
      <div class="info-line total-section">
        <span>TOTAL:</span>
        <span>${formatCurrency(total)}</span>
      </div>
    `

    if (ticketConfig.show_payment_method) {
      html += `<div class="separator"></div>`
      
      if (sale.payment_method === 'multiple' && sale.payment_methods_formatted) {
        html += `<div class="section-title">FORMAS DE PAGO:</div>`
        sale.payment_methods_formatted.forEach(pm => {
          const methodLabel = this.getPaymentMethodLabel(pm.method)
          html += `
            <div class="info-line">
              <span>${methodLabel}:</span>
              <span>${formatCurrency(pm.amount)}</span>
            </div>
          `
        })
      } else {
        const methodLabel = this.getPaymentMethodLabel(sale.payment_method)
        html += `
          <div class="info-line">
            <span>Forma de pago:</span>
            <span>${methodLabel}</span>
          </div>
        `
      }
    }

    if (ticketConfig.include_cae && sale.cae) {
      html += `
        <div class="separator"></div>
        <div class="center header-info">
          <div>CAE: ${sale.cae}</div>
          <div>Vto. CAE: ${sale.cae_expiration}</div>
        </div>
      `
    }

    if (ticketConfig.show_barcode) {
      html += `
        <div class="barcode">
          <svg id="barcode-${sale.id}"></svg>
        </div>
      `
    }

    if (ticketConfig.return_policy) {
      html += `
        <div class="double-separator"></div>
        <div class="footer">
          <div class="bold">POLÍTICA DE DEVOLUCIONES</div>
          <div>${ticketConfig.return_policy}</div>
        </div>
      `
    }

    if (ticketConfig.footer_message || businessConfig.business_footer_message) {
      html += `
        <div class="double-separator"></div>
        <div class="footer">
          ${ticketConfig.footer_message || businessConfig.business_footer_message}
        </div>
      `
    }

    if (businessConfig.business_slogan) {
      html += `
        <div class="footer">
          ${businessConfig.business_slogan}
        </div>
      `
    }

    if (businessConfig.business_website) {
      html += `
        <div class="footer">
          ${businessConfig.business_website}
        </div>
      `
    }

    html += `
          </div>
        </div>
      </body>
      </html>
    `

    return html
  }

  /**
   * Obtiene la etiqueta legible del método de pago
   */
  getPaymentMethodLabel(method) {
    const labels = {
      efectivo: 'Efectivo',
      tarjeta_credito: 'Tarjeta de Crédito',
      tarjeta_debito: 'Tarjeta de Débito',
      transferencia: 'Transferencia',
      cuenta_corriente: 'Cuenta Corriente',
      multiple: 'Múltiples'
    }
    return labels[method] || method
  }

  /**
   * Imprime el ticket usando la API de impresión del navegador
   */
  async printTicket(saleData, businessConfig, ticketConfig) {
    try {
      const html = this.generateTicketHTML(saleData, businessConfig, ticketConfig)
      
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '-9999px'
      iframe.style.bottom = '-9999px'
      iframe.style.border = 'none'
      
      document.body.appendChild(iframe)
      
      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(html)
      doc.close()

      await new Promise(resolve => setTimeout(resolve, 300))

      iframe.contentWindow.focus()
      
      const printPromise = new Promise((resolve) => {
        setTimeout(() => {
          iframe.contentWindow.print()
          // Dar tiempo al navegador para preparar la impresión
          setTimeout(() => {
            resolve()
          }, 500)
        }, 50)
      })

      await printPromise

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 2000)

      return { success: true }
    } catch (error) {
      console.error('Error al imprimir ticket:', error)
      return { 
        success: false, 
        error: error.message || 'Error al imprimir el ticket'
      }
    }
  }

  /**
   * Vista previa del ticket en una nueva ventana
   */
  previewTicket(saleData, businessConfig, ticketConfig) {
    try {
      const html = this.generateTicketHTML(saleData, businessConfig, ticketConfig)
      
      const width = ticketConfig.paper_width === 58 ? 400 : 500
      const previewWindow = window.open('', '_blank', `width=${width},height=800`)
      
      if (!previewWindow) {
        throw new Error('No se pudo abrir la ventana de vista previa. Verifique que las ventanas emergentes estén habilitadas.')
      }
      
      previewWindow.document.write(html)
      previewWindow.document.close()
      
      return { success: true }
    } catch (error) {
      console.error('Error al mostrar vista previa:', error)
      return { 
        success: false, 
        error: error.message || 'Error al mostrar vista previa del ticket'
      }
    }
  }

  /**
   * Descarga el ticket como HTML
   */
  downloadTicket(saleData, businessConfig, ticketConfig) {
    try {
      const html = this.generateTicketHTML(saleData, businessConfig, ticketConfig)
      
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${saleData.sale.id}-${Date.now()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      console.error('Error al descargar ticket:', error)
      return { 
        success: false, 
        error: error.message || 'Error al descargar el ticket'
      }
    }
  }
}

// Exportar instancia única
const ticketPrintService = new TicketPrintService()
export default ticketPrintService
