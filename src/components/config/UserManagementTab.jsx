"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/contexts/ToastContext"
import { userService } from "@/services/userService"
import Card from "@/components/common/Card"
import Button from "@/components/common/Button"
import LoadingButton from "@/components/common/LoandingButton"
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline"

const UserManagementTab = () => {
  const { showToast, error: toastError } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "empleado",
    active: true,
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const result = await userService.getUsers()
    
    if (result.success) {
      setUsers(result.data)
    } else {
      showToast(result.error, "error", { title: "Error al cargar usuarios" })
    }
    
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let result

      if (editingUser) {
        // Actualizar usuario
        const updateData = { ...formData }
        // Si no se ingresó nueva contraseña, no enviarla
        if (!updateData.password) {
          delete updateData.password
        }
        
        result = await userService.updateUser(editingUser.id, updateData)
        
        if (result.success) {
          showToast("Usuario actualizado correctamente", "success", {
            title: "Usuario actualizado"
          })
        }
      } else {
        // Crear nuevo usuario
        if (!formData.password || formData.password.length < 6) {
          showToast("La contraseña debe tener al menos 6 caracteres", "error", {
            title: "Error de validación"
          })
          setSubmitting(false)
          return
        }

        result = await userService.createUser(formData)
        
        if (result.success) {
          showToast("Usuario creado correctamente", "success", {
            title: "Usuario creado"
          })
        }
      }

      if (result.success) {
        await loadUsers()
        resetForm()
      } else {
        showToast(result.error, "error", {
          title: editingUser ? "Error al actualizar" : "Error al crear"
        })
      }
    } catch (error) {
      showToast("Error inesperado", "error", { title: "Error" })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "empleado",
      active: true,
    })
    setEditingUser(null)
    setShowForm(false)
    setShowPassword(false)
  }

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // No mostramos la contraseña actual
      role: user.role,
      active: user.active,
    })
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async (user) => {
    if (window.confirm(`¿Estás seguro de eliminar al usuario "${user.name}"?`)) {
      const result = await userService.deleteUser(user.id)
      
      if (result.success) {
        showToast("Usuario eliminado correctamente", "success", {
          title: "Usuario eliminado"
        })
        await loadUsers()
      } else {
        showToast(result.error, "error", {
          title: "Error al eliminar"
        })
      }
    }
  }

  const getRoleBadge = (role) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          Administrador
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <UserIcon className="h-3 w-3 mr-1" />
        Empleado
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UsersIcon className="h-6 w-6 text-blue-600 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
            <p className="text-sm text-gray-500">Administra los usuarios del sistema</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="juan@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña {editingUser ? "(dejar vacío para no cambiar)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Usuario Activo</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={submitting}>
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                loading={submitting}
                loadingText={editingUser ? "Actualizando..." : "Creando..."}
                className="flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {editingUser ? "Actualizar" : "Crear"} Usuario
              </LoadingButton>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Acceso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.last_login)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar usuario"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar usuario"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo usuario.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

export default UserManagementTab
