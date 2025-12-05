'use client';

import { useState, useEffect } from 'react';
import { locationsAPI, shelvesAPI, locationAttributesAPI } from '@/lib/api';
import { Shelf, LocationAttribute } from '@/lib/types';

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

  // Estados para estanterías (nivel 2)
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);
  const [locationShelves, setLocationShelves] = useState<Record<string, Shelf[]>>({});
  const [loadingShelves, setLoadingShelves] = useState<string | null>(null);
  const [showShelfForm, setShowShelfForm] = useState<string | null>(null);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [shelfCode, setShelfCode] = useState('');
  const [shelfName, setShelfName] = useState('');

  // Estados para ubicaciones (nivel 3)
  const [expandedShelf, setExpandedShelf] = useState<string | null>(null);
  const [shelfSublocations, setShelfSublocations] = useState<Record<string, LocationAttribute[]>>({});
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

  // Funciones para estanterías (nivel 2)
  const handleToggleLocation = async (locationId: string) => {
    if (expandedLocation === locationId) {
      setExpandedLocation(null);
      return;
    }

    setExpandedLocation(locationId);
    
    if (!locationShelves[locationId]) {
      setLoadingShelves(locationId);
      try {
        console.log('🔍 Cargando estanterías para lugar:', locationId);
        const response = await shelvesAPI.getAll(locationId);
        console.log('✅ Respuesta completa:', response.data);
        const shelves = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('✅ Estanterías procesadas:', shelves);
        setLocationShelves(prev => ({ ...prev, [locationId]: shelves }));
      } catch (error) {
        console.error('❌ Error cargando estanterías:', error);
        alert('Error al cargar las estanterías');
      } finally {
        setLoadingShelves(null);
      }
    }
  };

  const handleSaveShelf = async () => {
    if (!shelfCode.trim() || !shelfName.trim()) {
      alert('El código y el nombre son obligatorios');
      return;
    }

    if (!showShelfForm) return;

    setSaving(true);
    try {
      if (editingShelf) {
        await shelvesAPI.update(editingShelf.id, {
          code: shelfCode,
          name: shelfName,
        });
      } else {
        await shelvesAPI.create({
          locationId: showShelfForm,
          code: shelfCode,
          name: shelfName,
        });
      }

      const response = await shelvesAPI.getAll(showShelfForm);
      const shelves = Array.isArray(response.data.data) ? response.data.data : [];
      setLocationShelves(prev => ({ ...prev, [showShelfForm]: shelves }));
      handleCancelShelf();
      alert(`✅ Estantería ${editingShelf ? 'actualizada' : 'creada'} exitosamente`);
    } catch (error: any) {
      console.error('Error guardando estantería:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar la estantería';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setShelfCode(shelf.code);
    setShelfName(shelf.name);
    setShowShelfForm(shelf.locationId);
  };

  const handleDeleteShelf = async (shelf: Shelf) => {
    if (!confirm(`¿Eliminar estantería ${shelf.code}? Esto eliminará también todas sus ubicaciones.`)) {
      return;
    }

    try {
      await shelvesAPI.delete(shelf.id);
      const response = await shelvesAPI.getAll(shelf.locationId);
      const shelves = Array.isArray(response.data.data) ? response.data.data : [];
      setLocationShelves(prev => ({ ...prev, [shelf.locationId]: shelves }));
      alert('✅ Estantería eliminada exitosamente');
    } catch (error: any) {
      console.error('Error eliminando estantería:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar la estantería';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleCancelShelf = () => {
    setShowShelfForm(null);
    setEditingShelf(null);
    setShelfCode('');
    setShelfName('');
  };

  // Funciones para ubicaciones (nivel 3)
  const handleToggleShelf = async (shelfId: string) => {
    if (expandedShelf === shelfId) {
      setExpandedShelf(null);
      return;
    }

    setExpandedShelf(shelfId);
    
    if (!shelfSublocations[shelfId]) {
      setLoadingSublocations(shelfId);
      try {
        const response = await locationAttributesAPI.getAll(shelfId, true);
        setShelfSublocations(prev => ({ ...prev, [shelfId]: response.data }));
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
        shelfId: showSublocationForm, // Ahora usamos shelfId
      };

      if (editingSublocation) {
        await locationAttributesAPI.update(editingSublocation.id, data);
        alert('✅ Ubicación actualizada exitosamente');
      } else {
        await locationAttributesAPI.create(data);
        alert('✅ Ubicación creada exitosamente');
      }

      // Recargar ubicaciones del shelf
      const response = await locationAttributesAPI.getAll(showSublocationForm, true);
      setShelfSublocations(prev => ({ ...prev, [showSublocationForm]: response.data }));
      handleCancelSublocation();
    } catch (error: any) {
      console.error('Error guardando ubicación:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar la ubicación';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSublocation = (shelfId: string, sublocation: LocationAttribute) => {
    setEditingSublocation(sublocation);
    setSublocationCode(sublocation.code);
    setSublocationName(sublocation.name);
    setSublocationDescription(sublocation.description || '');
    setSublocationOrder(sublocation.order);
    setShowSublocationForm(shelfId);
  };

  const handleDeleteSublocation = async (shelfId: string, sublocationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ubicación?')) {
      return;
    }

    try {
      await locationAttributesAPI.delete(sublocationId);
      alert('✅ Ubicación eliminada exitosamente');
      
      // Recargar ubicaciones del shelf
      const response = await locationAttributesAPI.getAll(shelfId, true);
      setShelfSublocations(prev => ({ ...prev, [shelfId]: response.data }));
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
        <h2 className="text-xl font-bold text-gray-900">📍 Lugares, Estanterías y Ubicaciones</h2>
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

              {/* Panel expandido de estanterías */}
              {expandedLocation === location.id && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-700">Estanterías (ES-XXXX)</h4>
                    <button
                      onClick={() => setShowShelfForm(location.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      + Nueva Estantería
                    </button>
                  </div>

                  {/* Formulario de Estantería */}
                  {showShelfForm === location.id && (
                    <div className="mb-4 p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <h5 className="font-semibold text-gray-900 mb-3 text-sm">
                        {editingShelf ? 'Editar Estantería' : 'Nueva Estantería'}
                      </h5>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Código * (ES-XXXX)
                            </label>
                            <input
                              type="text"
                              value={shelfCode}
                              onChange={(e) => setShelfCode(e.target.value.toUpperCase())}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="ES-0001"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nombre *
                            </label>
                            <input
                              type="text"
                              value={shelfName}
                              onChange={(e) => setShelfName(e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Estantería A"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveShelf}
                            disabled={saving}
                            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : (editingShelf ? 'Actualizar' : 'Crear')}
                          </button>
                          <button
                            onClick={handleCancelShelf}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de estanterías */}
                  {loadingShelves === location.id ? (
                    <p className="text-sm text-gray-500 text-center py-4">Cargando estanterías...</p>
                  ) : (
                    <div className="space-y-2">
                      {(!locationShelves[location.id] || locationShelves[location.id].length === 0) ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay estanterías. ¡Crea la primera!
                        </p>
                      ) : (
                        locationShelves[location.id].map((shelf) => (
                          <div key={shelf.id} className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50">
                            {/* Cabecera de la estantería */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition">
                              <button
                                onClick={() => handleToggleShelf(shelf.id)}
                                className="flex items-center gap-2 flex-1 text-left"
                              >
                                <span className="text-lg">📚</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-blue-600">
                                      {shelf.code}
                                    </span>
                                    <span className="text-sm text-gray-900">{shelf.name}</span>
                                  </div>
                                </div>
                                <span className="text-gray-400 text-xs">
                                  {expandedShelf === shelf.id ? '▼' : '▶'}
                                </span>
                              </button>

                              <div className="flex gap-2 ml-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditShelf(shelf);
                                  }}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShelf(shelf);
                                  }}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Panel expandido de ubicaciones dentro de la estantería */}
                            {expandedShelf === shelf.id && (
                              <div className="p-3 bg-white border-t border-blue-200">
                                <div className="flex justify-between items-center mb-3">
                                  <h5 className="font-semibold text-gray-700 text-sm">Ubicaciones (UB-XXXX)</h5>
                                  <button
                                    onClick={() => setShowSublocationForm(shelf.id)}
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                  >
                                    + Nueva Ubicación
                                  </button>
                                </div>

                                {/* Formulario de Ubicación */}
                                {showSublocationForm === shelf.id && (
                                  <div className="mb-3 p-2 border-2 border-green-200 rounded-lg bg-green-50">
                                    <h6 className="font-semibold text-gray-900 mb-2 text-xs">
                                      {editingSublocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
                                    </h6>

                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Código * (UB-XXXX)
                                          </label>
                                          <input
                                            type="text"
                                            value={sublocationCode}
                                            onChange={(e) => setSublocationCode(e.target.value.toUpperCase())}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Caja 1"
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
                                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          placeholder="Descripción opcional"
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSaveSublocation}
                                          disabled={saving}
                                          className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                          {saving ? 'Guardando...' : (editingSublocation ? 'Actualizar' : 'Crear')}
                                        </button>
                                        <button
                                          onClick={handleCancelSublocation}
                                          disabled={saving}
                                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Lista de ubicaciones */}
                                {loadingSublocations === shelf.id ? (
                                  <p className="text-xs text-gray-500 text-center py-3">Cargando ubicaciones...</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {(!shelfSublocations[shelf.id] || shelfSublocations[shelf.id].length === 0) ? (
                                      <p className="text-xs text-gray-500 text-center py-3">
                                        No hay ubicaciones. ¡Crea la primera!
                                      </p>
                                    ) : (
                                      shelfSublocations[shelf.id].map((sublocation) => (
                                        <div
                                          key={sublocation.id}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-xs font-semibold text-green-600">
                                                {sublocation.code}
                                              </span>
                                              <span className="text-xs text-gray-900">{sublocation.name}</span>
                                            </div>
                                            {sublocation.description && (
                                              <p className="text-xs text-gray-600 mt-0.5">{sublocation.description}</p>
                                            )}
                                          </div>

                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => handleEditSublocation(shelf.id, sublocation)}
                                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                            >
                                              Editar
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSublocation(shelf.id, sublocation.id)}
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
