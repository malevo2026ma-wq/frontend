import { useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { useCashStore } from "@/stores/cashStore"

/**
 * Hook personalizado para manejar atajos de teclado globales
 * 
 * Atajos disponibles:
 * - F1: Ir a Ventas
 * - F5: Ir a Historial de Ventas (Reportes)
 * - F6: Ir a Caja y abrir modal de cierre de caja si está abierta
 * - F10: Ir a Stock y abrir modal para agregar producto, con foco en nombre
 * - F12: Cerrar sesión
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { showToast } = useToast()
  const { currentCash } = useCashStore()
  
  const openProductFormRef = useRef(null)
  const openCloseFormRef = useRef(null)
  const focusNameInputRef = useRef(null)

  const handleKeyPress = useCallback(
    async (event) => {
      // Ignorar si el usuario está escribiendo en un input, textarea o select
      const activeElement = document.activeElement
      const isTyping =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable

      // Detectar las teclas F1, F5, F6, F10, F12
      const key = event.key

      // F1 - Ir a Ventas
      if (key === "F1") {
        event.preventDefault()
        if (location.pathname !== "/ventas") {
          navigate("/ventas")
          showToast("Navegando a Ventas", "info")
        }
        return
      }

      if (key === "F5") {
        event.preventDefault()
        if (location.pathname !== "/reportes") {
          navigate("/reportes")
          showToast("Navegando a Historial de Ventas", "info")
          // Establecer pestaña activa en "history"
          setTimeout(() => {
            const historyTab = document.querySelector('[data-tab="history"]')
            if (historyTab) {
              historyTab.click()
            }
          }, 100)
        }
        return
      }

      if (key === "F6") {
        event.preventDefault()
        if (location.pathname !== "/caja") {
          navigate("/caja")
          showToast("Navegando a Control de Caja", "info")
          // Esperar a que la página cargue y luego abrir el modal si está abierta
          setTimeout(() => {
            if (currentCash.isOpen && openCloseFormRef.current) {
              openCloseFormRef.current()
              showToast("Abriendo modal de cierre de caja", "info")
            }
          }, 300)
        } else {
          // Si ya estamos en caja, solo abrir el modal
          if (currentCash.isOpen && openCloseFormRef.current) {
            openCloseFormRef.current()
            showToast("Abriendo modal de cierre de caja", "info")
          } else if (!currentCash.isOpen) {
            showToast("La caja está cerrada", "warning")
          }
        }
        return
      }

      if (key === "F10") {
        event.preventDefault()
        if (location.pathname !== "/stock") {
          navigate("/stock")
          showToast("Navegando a Gestión de Stock", "info")
          // Esperar a que la página cargue
          setTimeout(() => {
            if (openProductFormRef.current) {
              openProductFormRef.current()
              // Esperar a que el modal se renderice
              setTimeout(() => {
                if (focusNameInputRef.current) {
                  focusNameInputRef.current()
                }
              }, 100)
            }
          }, 300)
        } else {
          // Si ya estamos en stock, solo abrir el modal
          if (openProductFormRef.current) {
            openProductFormRef.current()
            setTimeout(() => {
              if (focusNameInputRef.current) {
                focusNameInputRef.current()
              }
            }, 100)
          }
        }
        return
      }

      // F12 - Cerrar sesión
      if (key === "F12") {
        event.preventDefault()
        
        // Confirmar cierre de sesión
        const confirmed = window.confirm("¿Estás seguro de que deseas cerrar sesión?")
        if (confirmed) {
          try {
            await logout()
            navigate("/login")
            showToast("Sesión cerrada correctamente", "success")
          } catch (error) {
            console.error("Error al cerrar sesión:", error)
            showToast("Error al cerrar sesión", "error")
          }
        }
        return
      }
    },
    [navigate, location, logout, showToast, currentCash.isOpen]
  )

  useEffect(() => {
    // Agregar event listener cuando el componente se monta
    document.addEventListener("keydown", handleKeyPress)

    // Limpiar event listener cuando el componente se desmonta
    return () => {
      document.removeEventListener("keydown", handleKeyPress)
    }
  }, [handleKeyPress])

  // Retornar información sobre los atajos disponibles e referencias para usar desde otros componentes
  return {
    shortcuts: [
      { key: "F1", action: "Ir a Ventas", path: "/ventas" },
      { key: "F5", action: "Historial de Ventas", path: "/reportes", tab: "history" },
      { key: "F6", action: "Ver Cierre de Caja", path: "/caja", requiresOpen: true },
      { key: "F10", action: "Carga de Productos", path: "/stock", openModal: true },
      { key: "F12", action: "Cerrar Sesión", path: null },
    ],
    registerOpenProductForm: (callback) => {
      openProductFormRef.current = callback
    },
    registerFocusNameInput: (callback) => {
      focusNameInputRef.current = callback
    },
    registerOpenCloseForm: (callback) => {
      openCloseFormRef.current = callback
    },
  }
}
