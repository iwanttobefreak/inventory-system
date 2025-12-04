'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI, categoriesAPI, locationsAPI, locationAttributesAPI, getBackendUrl } from '@/lib/api';
import { Item, Category, Location, LocationAttribute, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationAttributes, setLocationAttributes] = useState<LocationAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterLocationAttribute, setFilterLocationAttribute] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  // Efecto para leer parámetros de URL y setear filtros (cuando venimos de una página UB-XXXX)
  useEffect(() => {
    if (typeof window !== 'undefined' && locationAttributes.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const locationParam = urlParams.get('location');
      const sublocationParam = urlParams.get('sublocation');

      console.log('📍 URL params:', { locationParam, sublocationParam });
      console.log('📍 Location attributes disponibles:', locationAttributes);

      if (locationParam) {
        setFilterLocation(locationParam);
      }
      
      // Si viene sublocation por URL, buscar el atributo por código
      if (sublocationParam) {
        console.log('🔍 Buscando atributo con código:', sublocationParam);
        const attr = locationAttributes.find(a => a.code.toUpperCase() === sublocationParam.toUpperCase());
        console.log('🔍 Atributo encontrado:', attr);
        
        if (attr) {
          // Establecer tanto la ubicación padre como el atributo
          setFilterLocation(attr.locationId);
          setFilterLocationAttribute(attr.id);
          console.log('✅ Filtros establecidos - locationId:', attr.locationId, 'attributeId:', attr.id);
        } else {
          console.error('❌ No se encontró atributo con código:', sublocationParam);
        }
      }
    }
  }, [locationAttributes]);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes, locationsRes] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll(),
        locationsAPI.getAll(),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
      setLocations(locationsRes.data);
      
      // Cargar todos los atributos de ubicación
      const allLocationAttributes: LocationAttribute[] = [];
      for (const location of locationsRes.data) {
        try {
          const attrsRes = await locationAttributesAPI.getAll(location.id);
          allLocationAttributes.push(...attrsRes.data);
        } catch (error) {
          console.error(`Error loading attributes for location ${location.id}:`, error);
        }
      }
      setLocationAttributes(allLocationAttributes);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.categoryId === filterCategory;
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesLocation = !filterLocation || item.locationId === filterLocation;
    
    // Buscar en attributes.sublocation si existe
    // Necesitamos encontrar el código de la ubicación seleccionada
    let matchesLocationAttribute = true;
    if (filterLocationAttribute) {
      const selectedAttr = locationAttributes.find(attr => attr.id === filterLocationAttribute);
      if (selectedAttr) {
        matchesLocationAttribute = 
          item.attributes && 
          typeof item.attributes === 'object' && 
          'sublocation' in item.attributes && 
          item.attributes.sublocation === selectedAttr.code;
      } else {
        matchesLocationAttribute = false;
      }
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesLocationAttribute;
  });

  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === 'AVAILABLE').length,
    inUse: items.filter((i) => i.status === 'IN_USE').length,
    maintenance: items.filter((i) => i.status === 'MAINTENANCE' || i.status === 'REPAIR').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📹 Inventario Audiovisual
              </h1>
              <p className="text-sm text-gray-600">Bienvenido, {user?.name}</p>
            </div>
            
            {/* Fila de botones */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/scanner')}
                className="flex-1 min-w-[140px] px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm whitespace-nowrap"
              >
                📱 Escanear QR
              </button>
              <button
                onClick={() => router.push('/new')}
                className="flex-1 min-w-[140px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm whitespace-nowrap"
              >
                ➕ Nuevo Item
              </button>
              <button
                onClick={() => router.push('/labels')}
                className="flex-1 min-w-[140px] px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm whitespace-nowrap"
              >
                🏷️ Generar Etiquetas
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="flex-1 min-w-[140px] px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-sm whitespace-nowrap"
              >
                ⚙️ Administración
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 min-w-[140px] px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm whitespace-nowrap"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Fila de estadísticas */}
            <div className="grid grid-cols-4 gap-2">
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-primary-600">{stats.total}</div>
                <div className="text-xs text-gray-600">Total items</div>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-green-600">{stats.available}</div>
                <div className="text-xs text-gray-600">Disponibles</div>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-blue-600">{stats.inUse}</div>
                <div className="text-xs text-gray-600">En uso</div>
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 flex flex-col justify-center">
                <div className="text-lg font-bold text-yellow-600">{stats.maintenance}</div>
                <div className="text-xs text-gray-600">Mantenimiento</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setFilterLocationAttribute(''); // Reset ubicación al cambiar lugar
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los lugares</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.icon} {loc.name}
                </option>
              ))}
            </select>
            <select
              value={filterLocationAttribute}
              onChange={(e) => setFilterLocationAttribute(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!filterLocation}
            >
              <option value="">Todas las ubicaciones</option>
              {locationAttributes
                .filter(attr => !filterLocation || attr.locationId === filterLocation)
                .map((attr) => (
                  <option key={attr.id} value={attr.id}>
                    {attr.code} - {attr.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/${item.code}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                {/* Tabla de dos columnas: Datos | Imagen */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Columna izquierda: Datos */}
                  <div className="space-y-2">
                    {/* Icono y nombre */}
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl flex-shrink-0">{item.category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 leading-tight">{item.name}</h3>
                      </div>
                    </div>

                    {/* Código */}
                    <p className="text-xs text-gray-500 font-mono">{item.code}</p>

                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    {/* Lugar y Ubicación en un cuadro */}
                    {(item.location || (item.attributes && item.attributes.sublocation)) && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        {item.location && (
                          <p className="text-xs text-blue-800 font-medium">
                            {item.location.icon || '📍'} {item.location.name}
                          </p>
                        )}
                        {item.attributes && item.attributes.sublocation && (() => {
                          const sublocationAttr = locationAttributes.find(
                            attr => attr.code === item.attributes.sublocation
                          );
                          return (
                            <p className="text-xs text-blue-600 font-mono">
                              📦 {item.attributes.sublocation}
                              {sublocationAttr && ` ${sublocationAttr.name}`}
                            </p>
                          );
                        })()}
                      </div>
                    )}

                    {/* Marca y modelo */}
                    {item.brand && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Marca:</span> {item.brand} {item.model}
                      </p>
                    )}

                    {/* Categoría */}
                    <p className="text-xs text-gray-400">
                      {item.category.name}
                    </p>
                  </div>

                  {/* Columna derecha: Imagen grande */}
                  <div className="flex items-center justify-center">
                    {item.imageUrl ? (
                      <div className="w-full h-full min-h-[200px] bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img 
                          src={`${getBackendUrl()}${item.imageUrl}`}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[200px] bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-300">{item.category.icon}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No se encontraron items</p>
            <button
              onClick={() => {
                setSearch('');
                setFilterCategory('');
                setFilterStatus('');
              }}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
