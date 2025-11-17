import { useState, useEffect } from "react"
import { useConfigStore } from "@/stores/configStore"
import { useToast } from "@/contexts/ToastContext"
import Button from "@/components/common/Button"
import LoadingButton from "@/components/common/LoandingButton"
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline"

const BusinessConfigTab = () => {
  const { businessConfig, updateBusinessConfig, fetchBusinessConfig, loading } = useConfigStore()
  const { showToast } = useToast()
  const [formData, setFormData] = useState(businessConfig)

  useEffect(() => {
    fetchBusinessConfig()
  }, [])

  useEffect(() => {
    setFormData(businessConfig)
  }, [businessConfig])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await updateBusinessConfig(formData)
    
    if (result?.success) {
      showToast("Los datos del negocio se han actualizado correctamente", "success", {
        title: "Configuración guardada"
      })
    } else {
      showToast(result?.error || "No se pudo actualizar la configuración", "error", {
        title: "Error"
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <BuildingStorefrontIcon className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Datos del Negocio</h3>
            <p className="text-sm text-gray-500">
              Configuración de la información del negocio que aparecerá en los tickets
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Nombre del negocio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Negocio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name || ""}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mi Negocio S.A."
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              name="business_address"
              value={formData.business_address || ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Calle 123, Ciudad, Provincia, Argentina"
            />
          </div>

          {/* Teléfono y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                name="business_phone"
                value={formData.business_phone || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="business_email"
                value={formData.business_email || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contacto@negocio.com.ar"
              />
            </div>
          </div>

          {/* CUIT y Sitio Web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CUIT
              </label>
              <input
                type="text"
                name="business_cuit"
                value={formData.business_cuit || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20-12345678-9"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                name="business_website"
                value={formData.business_website || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.minegocio.com.ar"
              />
            </div>
          </div>

          {/* Slogan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eslogan
            </label>
            <input
              type="text"
              name="business_slogan"
              value={formData.business_slogan || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Calidad y servicio"
            />
          </div>

          {/* Mensaje de pie de página */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje de pie de página
            </label>
            <textarea
              name="business_footer_message"
              value={formData.business_footer_message || ""}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Gracias por su compra. Vuelva pronto!"
            />
            <p className="mt-1 text-xs text-gray-500">
              Este mensaje aparecerá al final de cada ticket
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setFormData(businessConfig)}
          >
            Cancelar
          </Button>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Guardando..."
          >
            Guardar Cambios
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}

export default BusinessConfigTab
