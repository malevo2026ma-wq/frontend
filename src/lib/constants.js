// Estados de productos
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
}

export const PRODUCT_STATUS_LABELS = {
  [PRODUCT_STATUS.ACTIVE]: "Activo",
  [PRODUCT_STATUS.INACTIVE]: "Inactivo",
}

// Tipos de movimientos de stock
export const STOCK_MOVEMENTS = {
  ENTRADA: "entrada",
  SALIDA: "salida",
  AJUSTE: "ajuste",
}

export const STOCK_MOVEMENT_LABELS = {
  [STOCK_MOVEMENTS.ENTRADA]: "Entrada",
  [STOCK_MOVEMENTS.SALIDA]: "Salida",
  [STOCK_MOVEMENTS.AJUSTE]: "Ajuste",
}

// Métodos de pago
export const PAYMENT_METHODS = {
  EFECTIVO: "efectivo",
  TARJETA_DEBITO: "tarjeta_debito",
  TARJETA_CREDITO: "tarjeta_credito",
  TRANSFERENCIA: "transferencia",
  CUENTA_CORRIENTE: "cuenta_corriente",
}

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.EFECTIVO]: "Efectivo",
  [PAYMENT_METHODS.TARJETA_DEBITO]: "Tarjeta de Débito",
  [PAYMENT_METHODS.TARJETA_CREDITO]: "Tarjeta de Crédito",
  [PAYMENT_METHODS.TRANSFERENCIA]: "Transferencia",
  [PAYMENT_METHODS.CUENTA_CORRIENTE]: "Cuenta Corriente",
}

// Estados de ventas
export const SALE_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
}

export const SALE_STATUS_LABELS = {
  [SALE_STATUS.COMPLETED]: "Completada",
  [SALE_STATUS.PENDING]: "Pendiente",
  [SALE_STATUS.CANCELLED]: "Cancelada",
}

// Tipos de documentos de clientes
export const DOCUMENT_TYPES = {
  DNI: "dni",
  CUIT: "cuit",
  CUIL: "cuil",
  PASAPORTE: "pasaporte",
}

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.DNI]: "DNI",
  [DOCUMENT_TYPES.CUIT]: "CUIT",
  [DOCUMENT_TYPES.CUIL]: "CUIL",
  [DOCUMENT_TYPES.PASAPORTE]: "Pasaporte",
}

// Tipos de transacciones de cuenta corriente
export const TRANSACTION_TYPES = {
  VENTA: "venta",
  PAGO: "pago",
  AJUSTE_DEBITO: "ajuste_debito",
  AJUSTE_CREDITO: "ajuste_credito",
}

export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPES.VENTA]: "Venta",
  [TRANSACTION_TYPES.PAGO]: "Pago",
  [TRANSACTION_TYPES.AJUSTE_DEBITO]: "Ajuste Débito",
  [TRANSACTION_TYPES.AJUSTE_CREDITO]: "Ajuste Crédito",
}

// Colores para tipos de transacciones
export const TRANSACTION_TYPE_COLORS = {
  [TRANSACTION_TYPES.VENTA]: "text-red-600 bg-red-50",
  [TRANSACTION_TYPES.PAGO]: "text-green-600 bg-green-50",
  [TRANSACTION_TYPES.AJUSTE_DEBITO]: "text-orange-600 bg-orange-50",
  [TRANSACTION_TYPES.AJUSTE_CREDITO]: "text-blue-600 bg-blue-50",
}

// Roles de usuario
export const USER_ROLES = {
  ADMIN: "admin",
  EMPLEADO: "empleado",
}

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.EMPLEADO]: "Empleado",
}

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
}

// Configuración de alertas de stock
export const STOCK_ALERT_LEVELS = {
  CRITICAL: 0,
  LOW: 5,
  MEDIUM: 20,
}

// Configuración de moneda
export const CURRENCY = {
  SYMBOL: "$",
  CODE: "ARS",
  DECIMAL_PLACES: 2,
}

// Configuración de fechas
export const DATE_FORMATS = {
  SHORT: "DD/MM/YYYY",
  LONG: "DD/MM/YYYY HH:mm",
  TIME: "HH:mm",
}

// Configuración de archivos
export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp"],
}

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Error de conexión. Verifica tu conexión a internet.",
  UNAUTHORIZED: "No tienes permisos para realizar esta acción.",
  NOT_FOUND: "El recurso solicitado no fue encontrado.",
  VALIDATION_ERROR: "Los datos ingresados no son válidos.",
  SERVER_ERROR: "Error interno del servidor. Intenta nuevamente.",
}

// Mensajes de éxito comunes
export const SUCCESS_MESSAGES = {
  CREATED: "Creado correctamente",
  UPDATED: "Actualizado correctamente",
  DELETED: "Eliminado correctamente",
  SAVED: "Guardado correctamente",
}
