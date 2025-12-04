'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI, categoriesAPI, categoryAttributesAPI, locationsAPI, locationAttributesAPI, getBackendUrl } from '@/lib/api';
import { Item, Category, STATUS_LABELS, STATUS_COLORS, LocationAttribute } from '@/lib/types';
import QRCode from 'qrcode.react';

interface CategoryAttribute {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'BOOLEAN';
  options?: string;
  required: boolean;
  order: number;
}

export default function ItemCodePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { isAuthenticated } = useAuthStore();

  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationSublocations, setLocationSublocations] = useState<LocationAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false); // Para evitar problemas de hidratación SSR
  
  // Estados para imagen
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state para crear/editar
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    status: 'AVAILABLE',
    locationId: '',
    location: '',
    brand: '',
    model: '',
    serialNumber: '',
    notes: '',
    purchaseDate: '',
    purchaseValue: '',
    attributes: {} as Record<string, any>,
  });

  // Detectar si estamos en el cliente (para evitar problemas de hidratación)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Validar que el código tenga el formato kf-XXXX
    if (!code.match(/^kf-\d{4}$/i)) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [code]);

  // Efecto para actualizar el nombre automáticamente cuando cambian los atributos
  useEffect(() => {
    if (formData.categoryId && categoryAttributes.length > 0) {
      const category = categories.find(c => c.id === formData.categoryId);
      if (!category) return;

      let name = category.name;
      
      // Buscar el primer atributo SELECT con valor
      const selectAttribute = categoryAttributes
        .filter(attr => attr.type === 'SELECT' && formData.attributes[attr.key])
        .sort((a, b) => a.order - b.order)[0];
      
      if (selectAttribute && formData.attributes[selectAttribute.key]) {
        name = `${category.name} > ${formData.attributes[selectAttribute.key]}`;
      }
      
      // Solo actualizar si el nombre es diferente
      if (name !== formData.name) {
        setFormData(prev => ({ ...prev, name }));
      }
    }
  }, [formData.attributes, categoryAttributes, formData.categoryId]);

  const loadData = async () => {
    try {
      // Intentar cargar el item SIEMPRE (funciona sin autenticación)
      try {
        const itemRes = await itemsAPI.getByCode(code);
        setItem(itemRes.data);
        setNotFound(false);
        
        // Si estamos autenticados, cargar categorías y atributos
        if (isAuthenticated()) {
          const categoriesRes = await categoriesAPI.getAll();
          setCategories(categoriesRes.data);
          
          // Cargar lugares
          const locationsRes = await locationsAPI.getAll();
          setLocations(locationsRes.data);
          
          // Si existe, llenar el formulario con sus datos
          setFormData({
            name: itemRes.data.name,
            description: itemRes.data.description || '',
            categoryId: itemRes.data.categoryId,
            status: itemRes.data.status,
            locationId: itemRes.data.locationId || '',
            location: itemRes.data.location || '',
            brand: itemRes.data.brand || '',
            model: itemRes.data.model || '',
            serialNumber: itemRes.data.serialNumber || '',
            notes: itemRes.data.notes || '',
            purchaseDate: itemRes.data.purchaseDate ? itemRes.data.purchaseDate.split('T')[0] : '',
            purchaseValue: itemRes.data.purchaseValue?.toString() || '',
            attributes: itemRes.data.attributes || {},
          });

          // Cargar atributos de la categoría
          if (itemRes.data.categoryId) {
            await loadCategoryAttributes(itemRes.data.categoryId);
          }
          
          // Cargar ubicaciones del lugar si tiene locationId
          if (itemRes.data.locationId) {
            await loadLocationSublocations(itemRes.data.locationId);
          }
        }
      } catch (error: any) {
        // Si es 404 y estamos autenticados, mostrar formulario de creación
        if (error.response?.status === 404) {
          setNotFound(true);
          if (isAuthenticated()) {
            setIsEditing(true); // Activar modo edición para crear
            // Cargar categorías y lugares para el formulario
            const categoriesRes = await categoriesAPI.getAll();
            setCategories(categoriesRes.data);
            const locationsRes = await locationsAPI.getAll();
            setLocations(locationsRes.data);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryAttributes = async (categoryId: string) => {
    try {
      const response = await categoryAttributesAPI.getAll(categoryId);
      setCategoryAttributes(response.data);
    } catch (error) {
      console.error('Error loading category attributes:', error);
      setCategoryAttributes([]);
    }
  };

  const loadLocationSublocations = async (locationId: string) => {
    try {
      const response = await locationAttributesAPI.getAll(locationId);
      setLocationSublocations(response.data);
    } catch (error) {
      console.error('Error loading location sublocations:', error);
      setLocationSublocations([]);
    }
  };

  const handleLocationChange = async (locationId: string) => {
    setFormData({ ...formData, locationId, attributes: { ...formData.attributes, sublocation: '' } });
    if (locationId) {
      await loadLocationSublocations(locationId);
    } else {
      setLocationSublocations([]);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormData({ ...formData, categoryId, attributes: {} });
    if (categoryId) {
      await loadCategoryAttributes(categoryId);
      // Generar nombre automático basado en la categoría
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setFormData(prev => ({ ...prev, name: category.name, categoryId, attributes: {} }));
      }
    } else {
      setCategoryAttributes([]);
    }
  };

  const generateAutoName = () => {
    const category = categories.find(c => c.id === formData.categoryId);
    if (!category) return formData.name;

    let name = category.name;
    
    // Agregar el primer atributo de tipo SELECT que tenga valor
    const selectAttribute = categoryAttributes
      .filter(attr => attr.type === 'SELECT' && formData.attributes[attr.key])
      .sort((a, b) => a.order - b.order)[0];
    
    if (selectAttribute && formData.attributes[selectAttribute.key]) {
      name = `${category.name} > ${formData.attributes[selectAttribute.key]}`;
    }
    
    return name;
  };

  const handleAttributeChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value }
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        code,
        purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        attributes: Object.keys(formData.attributes).length > 0 ? formData.attributes : undefined,
      };

      let savedItem;
      if (notFound) {
        // Crear nuevo item
        const res = await itemsAPI.create(submitData);
        savedItem = res.data;
        setItem(savedItem);
        setNotFound(false);
        setIsEditing(false);
      } else {
        // Actualizar item existente
        const res = await itemsAPI.update(code, submitData);
        savedItem = res.data;
        setItem(savedItem);
        setIsEditing(false);
      }

      // Si hay imagen seleccionada, subirla
      if (selectedImage) {
        setUploadingImage(true);
        try {
          const imageRes = await itemsAPI.uploadImage(code, selectedImage);
          setItem(imageRes.data);
          setSelectedImage(null);
          setImagePreview(null);
          alert('✅ Item y foto guardados exitosamente');
        } catch (imageError: any) {
          console.error('Error uploading image:', imageError);
          alert('⚠️ Item guardado pero hubo un error al subir la imagen');
        } finally {
          setUploadingImage(false);
        }
      } else {
        alert('✅ Item guardado exitosamente');
      }
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(error.response?.data?.error || 'Error al guardar el item');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return;

    try {
      await itemsAPI.delete(item.code);
      alert('Item eliminado exitosamente');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error al eliminar el item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  // Vista de creación (item no existe)
  if (notFound) {
    // Si NO está autenticado, redirigir a login
    if (isClient && !isAuthenticated()) {
      router.push('/login');
      return null;
    }

    // Si está autenticado, mostrar formulario de creación
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📦</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nuevo Item: {code.toUpperCase()}
              </h1>
              <p className="text-gray-600">
                Este código aún no está registrado. Completa el formulario para añadirlo al inventario.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Atributos personalizados de la categoría */}
              {categoryAttributes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 mb-2">
                    📝 Atributos de {categories.find(c => c.id === formData.categoryId)?.name}
                  </h3>
                  {categoryAttributes.map((attr) => (
                    <div key={attr.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.name} {attr.required && <span className="text-red-500">*</span>}
                      </label>
                      {attr.type === 'TEXT' && (
                        <input
                          type="text"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'NUMBER' && (
                        <input
                          type="number"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'SELECT' && (
                        <select
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Selecciona una opción</option>
                          {attr.options?.split(',').map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {attr.type === 'DATE' && (
                        <input
                          type="date"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'BOOLEAN' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.attributes[attr.key] || false}
                            onChange={(e) => handleAttributeChange(attr.key, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Sí</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Se genera automáticamente, pero puedes editarlo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 El nombre se genera automáticamente con Categoría &gt; Atributo, pero puedes cambiarlo manualmente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Descripción detallada del item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Serie
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona un lugar</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.icon} {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación (UB-XXXX)
                  </label>
                  <select
                    value={formData.attributes.sublocation || ''}
                    onChange={(e) => handleAttributeChange('sublocation', e.target.value)}
                    disabled={!formData.locationId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona ubicación</option>
                    {locationSublocations.map((subloc) => (
                      <option key={subloc.id} value={subloc.code}>
                        {subloc.code} - {subloc.name}
                      </option>
                    ))}
                  </select>
                  {!formData.locationId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Primero selecciona un lugar
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de Compra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchaseValue}
                    onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Imagen del artículo
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Botón Cámara */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-primary-300 border-dashed rounded-lg cursor-pointer bg-primary-50 hover:bg-primary-100 transition">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-primary-700 font-medium">
                          � Tomar Foto
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                      />
                    </label>

                    {/* Botón Galería */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-700 font-medium">
                          🖼️ Subir Archivo
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
                >
                  ✅ Crear Item
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Vista de detalle (item existe)
  if (!item) return null;

  // Si NO está autenticado, mostrar SOLO mensaje de contacto (sin información del item)
  if (isClient && !isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          {/* Mensaje de contacto */}
          <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-lg">
            <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center justify-center">
              <span className="mr-3 text-4xl">📞</span>
              ¿Has encontrado este artículo?
            </h3>
            <p className="text-gray-700 mb-6 text-center text-lg">
              Si has encontrado este artículo es porque <strong>lo he perdido</strong>. 
              Por favor, contacta conmigo para devolverlo:
            </p>
            <div className="space-y-3">
              <p className="text-2xl font-semibold text-gray-900 text-center whitespace-nowrap">
                � Email: <a href="mailto:hola@kairoframe.com" className="text-blue-600 hover:underline">hola@kairoframe.com</a>
              </p>
              <p className="text-2xl font-semibold text-gray-900 text-center whitespace-nowrap">
                🌐 Web: <a href="https://kairoframe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">kairoframe.com</a>
              </p>
            </div>
            <p className="text-gray-600 mt-8 text-center text-lg italic">
              ¡Muchas gracias por tu ayuda! 🙏
            </p>
            
            {/* Botón de Login */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
              >
                🔐 Acceder al Sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const category = categories.find((c) => c.id === item.categoryId);
  const publicUrl = `https://kairoframe.lobo99.info/${code.toLowerCase()}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con botones */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            ← Volver al Dashboard
          </button>
          
          {isAuthenticated() && (
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={async () => {
                      setIsEditing(true);
                      // Cargar atributos de categoría y sublocaciones al entrar en modo edición
                      if (item?.categoryId) {
                        await loadCategoryAttributes(item.categoryId);
                      }
                      if (item?.locationId) {
                        await loadLocationSublocations(item.locationId);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    loadData(); // Recargar datos originales
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contenido principal */}
        {!isEditing ? (
          // Vista de solo lectura
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header con estado */}
            <div className={`p-6 ${STATUS_COLORS[item.status]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium opacity-90 mb-1">
                    {code.toUpperCase()}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-90">
                      {STATUS_LABELS[item.status]}
                    </span>
                    {category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-90">
                        {category.icon} {category.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <QRCode value={publicUrl} size={120} />
                  <div className="text-xs text-center mt-2 text-gray-600">
                    Escanear para ver
                  </div>
                </div>
              </div>
            </div>

            {/* Información */}
            <div className="p-6 space-y-6">
              {item.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Descripción</h3>
                  <p className="text-gray-900">{item.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                {item.brand && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Marca</h3>
                    <p className="text-gray-900">{item.brand}</p>
                  </div>
                )}
                {item.model && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Modelo</h3>
                    <p className="text-gray-900">{item.model}</p>
                  </div>
                )}
                {item.serialNumber && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Número de Serie</h3>
                    <p className="text-gray-900">{item.serialNumber}</p>
                  </div>
                )}
                {item.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Ubicación</h3>
                    <p className="text-gray-900">
                      {item.location.icon && <span className="mr-1">{item.location.icon}</span>}
                      {item.location.name}
                    </p>
                  </div>
                )}
                {item.purchaseDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Compra</h3>
                    <p className="text-gray-900">
                      {new Date(item.purchaseDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
                {item.purchaseValue && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Valor de Compra</h3>
                    <p className="text-gray-900">{item.purchaseValue}€</p>
                  </div>
                )}
              </div>

              {item.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notas</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}

              {/* Imagen del artículo */}
              {item.imageUrl && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">📷 Imagen</h3>
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={`${getBackendUrl()}${item.imageUrl}`}
                      alt={item.name}
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vista de edición
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Editar Item: {code.toUpperCase()}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Atributos personalizados de la categoría */}
              {categoryAttributes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 mb-2">
                    📝 Atributos de {categories.find(c => c.id === formData.categoryId)?.name}
                  </h3>
                  {categoryAttributes.map((attr) => (
                    <div key={attr.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.name} {attr.required && <span className="text-red-500">*</span>}
                      </label>
                      {attr.type === 'TEXT' && (
                        <input
                          type="text"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'NUMBER' && (
                        <input
                          type="number"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'SELECT' && (
                        <select
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Selecciona una opción</option>
                          {attr.options?.split(',').map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {attr.type === 'DATE' && (
                        <input
                          type="date"
                          required={attr.required}
                          value={formData.attributes[attr.key] || ''}
                          onChange={(e) => handleAttributeChange(attr.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      )}
                      {attr.type === 'BOOLEAN' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.attributes[attr.key] || false}
                            onChange={(e) => handleAttributeChange(attr.key, e.target.checked)}
                            className="mr-2"
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Se genera automáticamente, pero puedes editarlo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 El nombre se genera automáticamente con Categoría &gt; Atributo, pero puedes cambiarlo manualmente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Descripción detallada del item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Serie
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona un lugar</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.icon} {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación (UB-XXXX)
                  </label>
                  <select
                    value={formData.attributes.sublocation || ''}
                    onChange={(e) => handleAttributeChange('sublocation', e.target.value)}
                    disabled={!formData.locationId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona ubicación</option>
                    {locationSublocations.map((subloc) => (
                      <option key={subloc.id} value={subloc.code}>
                        {subloc.code} - {subloc.name}
                      </option>
                    ))}
                  </select>
                  {!formData.locationId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Primero selecciona un lugar
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor de Compra (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchaseValue}
                    onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📷 Imagen del artículo
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                ) : item?.imageUrl ? (
                  <div className="relative">
                    <img 
                      src={`${getBackendUrl()}${item.imageUrl}`}
                      alt={item.name}
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('¿Estás seguro de que quieres eliminar la imagen actual?')) {
                          try {
                            await itemsAPI.deleteImage(code);
                            alert('Imagen eliminada exitosamente');
                            loadData();
                          } catch (error) {
                            console.error('Error deleting image:', error);
                            alert('Error al eliminar la imagen');
                          }
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    >
                      🗑️ Eliminar imagen actual
                    </button>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">O selecciona una nueva imagen para reemplazarla:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Botón Cámara */}
                        <label className="flex flex-col items-center justify-center h-32 border-2 border-primary-300 border-dashed rounded-lg cursor-pointer bg-primary-50 hover:bg-primary-100 transition">
                          <svg className="w-12 h-12 text-primary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm font-medium text-primary-600">📸 Tomar Foto</p>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                          />
                        </label>

                        {/* Botón Galería */}
                        <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-600">🖼️ Subir Archivo</p>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Botón Cámara */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-primary-300 border-dashed rounded-lg cursor-pointer bg-primary-50 hover:bg-primary-100 transition">
                      <svg className="w-12 h-12 text-primary-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium text-primary-600">📸 Tomar Foto</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                      />
                    </label>

                    {/* Botón Galería */}
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-600">🖼️ Subir Archivo</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedImage(null);
                    setImagePreview(null);
                    loadData();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
