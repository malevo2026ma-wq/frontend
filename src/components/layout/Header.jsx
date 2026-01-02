"use client"

import { Fragment, useEffect, useState } from "react"
import { Menu, Transition } from "@headlessui/react"
import { useNavigate } from "react-router-dom"
import {
  Bars3Icon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline"
import { useAuth } from "@/contexts/AuthContext"
import { useCashStore } from "@/stores/cashStore"
import { formatCurrency } from "@/lib/formatters"
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp"

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth()
  const { currentCash, fetchCurrentStatus } = useCashStore()
  const navigate = useNavigate()
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  useEffect(() => {
    fetchCurrentStatus().catch((error) => {
      console.error("Error cargando estado de caja en header:", error)
    })
  }, [fetchCurrentStatus])

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "?" && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const activeElement = document.activeElement
        const isTyping =
          activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable

        if (!isTyping) {
          event.preventDefault()
          setShowShortcutsHelp(true)
        }
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const getRoleDisplay = (role) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "empleado":
        return "Empleado"
      default:
        return role || "Usuario"
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "text-blue-700 bg-blue-50 border border-blue-200 font-semibold"
      case "empleado":
        return "text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold"
      default:
        return "text-neutral-700 bg-neutral-50 border border-neutral-200 font-semibold"
    }
  }

  const getCashStatusColor = () => {
    if (!currentCash.isOpen) {
      return "text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 shadow-sm"
    }
    return "text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm"
  }

  const getCashStatusText = () => {
    if (!currentCash.isOpen) {
      return "Caja Cerrada"
    }
    return formatCurrency(currentCash.totalGeneralCaja)
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white/95 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Botón menú móvil */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-all duration-200 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-neutral-300 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          {/* Información de la caja */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="hidden sm:block">
              <button
                onClick={() => navigate("/caja")}
                className={`flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${getCashStatusColor()}`}
                title={
                  currentCash.isOpen ? "Caja abierta - Click para ver detalles" : "Caja cerrada - Click para abrir"
                }
              >
                {currentCash.isOpen ? (
                  <BanknotesIcon className="h-4 w-4 mr-2.5" />
                ) : (
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2.5" />
                )}
                <span>{getCashStatusText()}</span>
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 p-2 rounded-xl transition-all duration-200"
              title="Atajos de teclado (presiona ?)"
            >
              <QuestionMarkCircleIcon className="h-6 w-6" />
            </button>

            {/* Separador */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-300" aria-hidden="true" />

            {/* Menú de perfil */}
            <Menu as="div" className="relative">
              <Menu.Button className="-m-1.5 flex items-center p-2.5 hover:bg-neutral-100 rounded-xl transition-all duration-200">
                <span className="sr-only">Abrir menú de usuario</span>
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-500 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  </div>
                  <span className="hidden lg:flex lg:items-center lg:ml-3">
                    <span className="text-sm font-semibold text-neutral-800" aria-hidden="true">
                      {user?.name || "Usuario"}
                    </span>
                    <span className={`ml-3 text-xs px-2.5 py-1 rounded-full ${getRoleBadgeColor(user?.role)}`}>
                      {getRoleDisplay(user?.role)}
                    </span>
                  </span>
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2.5 w-72 origin-top-right rounded-2xl bg-white py-2 shadow-xl ring-1 ring-neutral-200 focus:outline-none">
                  {/* Información del usuario */}
                  <div className="px-4 py-4 border-b border-neutral-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-500 flex items-center justify-center shadow-sm">
                        <span className="text-base font-bold text-white">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate">{user?.name || "Usuario"}</p>
                        <p className="text-xs text-neutral-500 truncate font-medium">
                          {user?.email || "email@ejemplo.com"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs ${getRoleBadgeColor(user?.role)}`}
                      >
                        {getRoleDisplay(user?.role)}
                      </span>
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate("/configuracion")}
                          className={`${
                            active ? "bg-neutral-50" : ""
                          } flex w-full items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-medium`}
                        >
                          <Cog6ToothIcon className="h-5 w-5 mr-3 text-neutral-500" />
                          Mi Perfil
                        </button>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate("/configuracion")}
                          className={`${
                            active ? "bg-neutral-50" : ""
                          } flex w-full items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-medium`}
                        >
                          <KeyIcon className="h-5 w-5 mr-3 text-neutral-500" />
                          Cambiar Contraseña
                        </button>
                      )}
                    </Menu.Item>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-neutral-100 my-2"></div>

                  {/* Cerrar sesión */}
                  <div className="py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? "bg-red-50 text-red-700" : "text-neutral-700"
                          } flex w-full items-center px-4 py-3 text-sm hover:bg-red-50 hover:text-red-700 transition-colors font-medium`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                          Cerrar Sesión
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>

      <KeyboardShortcutsHelp isOpen={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />
    </>
  )
}

export default Header
