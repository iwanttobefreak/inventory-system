'use client';

import { useState, useEffect } from 'react';
import { locationsAPI, locationAttributesAPI } from '@/lib/api';
import { LocationAttribute } from '@/lib/types';

interface Location {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count?: { items: number };
}

const ICONOS_LUGARES = [
  '📦', '🔧', '🎬', '🎛️', '🔊', '🥽', '🏢', '🏭',
  '🗄️', '📁', '🏪', '🏬', '🚪', '🪑', '🛠️', '⚙️'
];

const COLORES_SUGERIDOS = [
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#10B981', // green
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
];

export default function LocationsPanel() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario de lugar
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [locationIcon, setLocationIcon] = useState('📦');
  const [locationColor, setLocationColor] = useState('#3B82F6');

  // Estados para ubicaciones (sublocations)
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [locationSublocations, setLocationSublocations] = useState<Record<string, LocationAttribute[]>>({});
  const [loadingSublocations, setLoadingSublocations] = useState<string | null>(null);
  const [showSublocationForm, setShowSublocationForm] = useState<string | null>(null);
  const [editingSublocation, setEditingSublocation] = useState<LocationAttribute | null>(null);
  const [sublocationCode, setSublocationCode] = useState('');
  const [sublocationName, setSublocationName] = useState('');
  const [sublocationDescription, setSublocationDescription] = useState('');
  const [sublocationOrder, setSublocationOrder] = useState(0);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await locationsAPI.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error cargando lugares:', error);
      alert('Error al cargar los lugares');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!locationName.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: locationName.trim(),
        description: locationDescription.trim() || undefined,
        icon: locationIcon,
        color: locationColor,
      };

      if (editingLocation) {
        await locationsAPI.update(editingLocation.id, data);
        alert('✅ Lugar actualizado exitosamente');
      } else {
        await locationsAPI.create(data);
        alert('✅ Lugar creado exitosamente');
      }

      await loadLocations();
      handleCancelLocation();
    } catch (error) {
      console.error('Error guardando lugar:', error);
      alert('❌ Error al guardar el lugar');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationDescription(location.description || '');
    setLocationIcon(location.icon || '📦');
    setLocationColor(location.color || '#3B82F6');
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lugar? Esto también eliminará todas sus ubicaciones.')) {
      return;
    }

    try {
      await locationsAPI.delete(id);
      alert('✅ Lugar eliminado exitosamente');
      await loadLocations();
    } catch (error: any) {
      console.error('Error eliminando lugar:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar el lugar';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleCancelLocation = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
    setLocationName('');
    setLocationDescription('');
    setLocationIcon('📦');
    setLocationColor('#3B82F6');
  };

  // Funciones para ubicaciones (sublocations)
  const handleToggleLocation = async (locationId: string) => {
    if (expandedLocation === locationId) {
      setExpandedLocation(null);
      return;
    }

    setExpandedLocation(locationId);
    
    if (!locationSublocations[locationId]) {
      setLoadingSublocations(locationId);
      try {
        const response = await locationAttributesAPI.getAll(locationId);
        setLocationSublocations(prev => ({ ...prev, [locationId]: response.data }));
      } catch (error) {
        console.error('Error cargando ubicaciones:', error);
        alert('Error al cargar las ubicaciones');
      } finally {
        setLoadingSublocations(null);
      }
    }
  };

  const handleSaveSublocation = async () => {
    if (!sublocationCode.trim() || !sublocationName.trim()) {
      alert('El código y el nombre son obligatorios');
      return;
    }

    if (!showSublocationForm) return;

    setSaving(true);
    try {
      const data = {
        code: sublocationCode.trim().toUpperCase(),
        name: sublocationName.trim(),
        description: sublocationDescription.trim() || undefined,
        order: sublocationOrder,
      };

      if (editingSublocation) {
        await locationAttributesAPI.update(showSublocationForm, editingSublocation.id, data);
        alert('✅ Ubicación actualizada exitosamente');
      } else {
        await locationAttributesAPI.create(showSublocationForm, data);
        alert('✅ Ubicación creada exitosamente');
      }

      // Recargar ubicaciones
      const response = await locationAttributesAPI.getAll(showSublocationForm);
      setLocationSublocations(prev => ({ ...prev, [showSublocationForm]: response.data }));
      handleCancelSublocation();
    } catch (error: any) {
      console.error('Error guardando ubicación:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar la ubicación';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSublocation = (locationId: string, sublocation: LocationAttribute) => {
    setEditingSublocation(sublocation);
    setSublocationCode(sublocation.code);
    setSublocationName(sublocation.name);
    setSublocationDescription(sublocation.description || '');
    setSublocationOrder(sublocation.order);
    setShowSublocationForm(locationId);
  };

  const handleDeleteSublocation = async (locationId: string, sublocationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) {
      return;
    }

    try {
      await locationAttributesAPI.delete(locationId, sublocationId);
      alert('✅ Ubicación eliminada exitosamente');
      
      // Recargar ubicaciones
      const response = await locationAttributesAPI.getAll(locationId);
      setLocationSublocations(prev => ({ ...prev, [locationId]: response.data }));
    } catch (error: any) {
      console.error('Error eliminando ubicación:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar la ubicación';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleCancelSublocation = () => {
    setShowSublocationForm(null);
    setEditingSublocation(null);
    setSublocationCode('');
    setSublocationName('');
    setSublocationDescription('');
    setSublocationOrder(0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-600">Cargando lugares...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">📍 Lugares y Ubicaciones</h2>
        <button
          onClick={() => setShowLocationForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm"
        >
          + Nuevo Lugar
        </button>
      </div>

      {/* Formulario de Lugar */}
      {showLocationForm && (
        <div className="mb-6 p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
          <h3 className="font-bold text-gray-900 mb-4">
            {editingLocation ? 'Editar Lugar' : 'Nuevo Lugar'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: Almacén"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="Descripción opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icono
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={locationIcon}
                  onChange={(e) => setLocationIcon(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-2xl"
                  maxLength={2}
                />
                <span className="text-sm text-gray-600">o selecciona:</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {ICONOS_LUGARES.map((icono) => (
                  <button
                    key={icono}
                    onClick={() => setLocationIcon(icono)}
                    className={`text-2xl p-2 rounded hover:bg-gray-100 transition ${
                      locationIcon === icono ? 'bg-primary-100 ring-2 ring-primary-500' : ''
                    }`}
                  >
                    {icono}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={locationColor}
                  onChange={(e) => setLocationColor(e.target.value)}
                  className="w-20 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={locationColor}
                  onChange={(e) => setLocationColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COLORES_SUGERIDOS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLocationColor(color)}
                    className={`h-10 rounded border-2 transition ${
                      locationColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : (editingLocation ? 'Actualizar' : 'Crear')}
              </button>
              <button
                onClick={handleCancelLocation}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Lugares */}
      <div className="space-y-2">
        {locations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay lugares creados. ¡Crea el primero!
          </p>
        ) : (
          locations.map((location) => (
            <div key={location.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabecera del lugar */}
              <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition">
                <button
                  onClick={() => handleToggleLocation(location.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-2xl">{location.icon || '📍'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      {location.color && (
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: location.color }}
                        />
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-600">{location.description}</p>
                    )}
                  </div>
                  <span className="text-gray-400">
                    {expandedLocation === location.id ? '▼' : '▶'}
                  </span>
                </button>

                <div className="flex gap-2 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditLocation(location);
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(location.id);
                    }}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Panel expandido de ubicaciones */}
              {expandedLocation === location.id && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">Ubicaciones (UB-XXXX)</h4>
                    <button
                      onClick={() => setShowSublocationForm(location.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                    >
                      + Nueva Ubicación
                    </button>
                  </div>

                  {/* Formulario de Ubicación */}
                  {showSublocationForm === location.id && (
                    <div className="mb-4 p-3 border-2 border-green-200 rounded-lg bg-green-50">
                      <h5 className="font-semibold text-gray-900 mb-3 text-sm">
                        {editingSublocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                      </h5>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Código * (UB-XXXX)
                            </label>
                            <input
                              type="text"
                              value={sublocationCode}
                              onChange={(e) => setSublocationCode(e.target.value.toUpperCase())}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="UB-0001"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nombre *
                            </label>
                            <input
                              type="text"
                              value={sublocationName}
                              onChange={(e) => setSublocationName(e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Estantería 1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={sublocationDescription}
                            onChange={(e) => setSublocationDescription(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Descripción opcional"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveSublocation}
                            disabled={saving}
                            className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : (editingSublocation ? 'Actualizar' : 'Crear')}
                          </button>
                          <button
                            onClick={handleCancelSublocation}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de ubicaciones */}
                  {loadingSublocations === location.id ? (
                    <p className="text-sm text-gray-500 text-center py-4">Cargando ubicaciones...</p>
                  ) : (
                    <div className="space-y-2">
                      {(!locationSublocations[location.id] || locationSublocations[location.id].length === 0) ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay ubicaciones. ¡Crea la primera!
                        </p>
                      ) : (
                        locationSublocations[location.id].map((sublocation) => (
                          <div
                            key={sublocation.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-blue-600">
                                  {sublocation.code}
                                </span>
                                <span className="text-sm text-gray-900">{sublocation.name}</span>
                              </div>
                              {sublocation.description && (
                                <p className="text-xs text-gray-600 mt-1">{sublocation.description}</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSublocation(location.id, sublocation)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteSublocation(location.id, sublocation.id)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
