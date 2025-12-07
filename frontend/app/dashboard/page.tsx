'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI, categoriesAPI, locationsAPI, shelvesAPI, locationAttributesAPI, getBackendUrl } from '@/lib/api';
import { Item, Category, Location, Shelf, LocationAttribute, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

// Forzar renderizado dinámico para evitar cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [locationAttributes, setLocationAttributes] = useState<LocationAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('� DASHBOARD COMPONENT LOADED - NEW VERSION');
  console.log('�🔍 Dashboard render - shelves:', shelves, 'type:', typeof shelves, 'isArray:', Array.isArray(shelves));
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterShelf, setFilterShelf] = useState('');
  const [filterLocationAttribute, setFilterLocationAttribute] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  // Efecto para leer parámetros de URL y setear filtros (cuando venimos de una página UB-XXXX o ES-XXXX)
  useEffect(() => {
    // Solo procesar si tenemos los datos necesarios
    if (shelves.length === 0 || locationAttributes.length === 0) {
      console.log('⏳ Esperando datos para procesar URL params...');
      return;
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const locationParam = urlParams.get('location');
      const sublocationParam = urlParams.get('sublocation');
      const shelfParam = urlParams.get('shelf');

      console.log('📍 URL params:', { locationParam, sublocationParam, shelfParam });
      console.log('📍 Location attributes disponibles:', locationAttributes.length);
      console.log('📍 Shelves disponibles:', shelves.length);

      if (locationParam) {
        setFilterLocation(locationParam);
      }
      
      // Si viene sublocation por URL, buscar el atributo por código
      if (sublocationParam && locationAttributes.length > 0) {
        console.log('🔍 Buscando atributo con código:', sublocationParam);
        const attr = locationAttributes.find(a => a.code.toUpperCase() === sublocationParam.toUpperCase());
        console.log('🔍 Atributo encontrado:', attr);
        
        if (attr) {
          // Establecer la ubicación padre
          setFilterLocation(attr.locationId);
          
          // Si la ubicación pertenece a una estantería, establecerla también
          if (attr.shelfId) {
            setFilterShelf(attr.shelfId);
            console.log('✅ Filtros establecidos - locationId:', attr.locationId, 'shelfId:', attr.shelfId, 'attributeId:', attr.id);
          } else {
            console.log('✅ Filtros establecidos - locationId:', attr.locationId, 'attributeId:', attr.id);
          }
          
          // Finalmente establecer el atributo
          setFilterLocationAttribute(attr.id);
        } else {
          console.error('❌ No se encontró atributo con código:', sublocationParam);
        }
      }

      // Si viene shelf por URL, buscar la estantería por código
      if (shelfParam && shelves.length > 0) {
        console.log('🔍 Buscando estantería con código:', shelfParam);
        console.log('🔍 shelfParam length:', shelfParam.length, 'chars');
        console.log('🔍 shelfParam toUpperCase:', shelfParam.toUpperCase());
        console.log('🔍 Estanterías disponibles:', shelves.map(s => ({ id: s.id, code: s.code, codeUpper: s.code.toUpperCase() })));
        
        const shelf = shelves.find(s => {
          const match = s.code.toUpperCase() === shelfParam.toUpperCase();
          console.log(`🔍 Comparando "${s.code.toUpperCase()}" === "${shelfParam.toUpperCase()}" => ${match}`);
          return match;
        });
        
        console.log('🔍 Estantería encontrada:', shelf);
        
        if (shelf) {
          // Establecer tanto el lugar padre como la estantería
          setFilterLocation(shelf.locationId);
          setFilterShelf(shelf.id);
          console.log('✅ Filtros establecidos - locationId:', shelf.locationId, 'shelfId:', shelf.id);
        } else {
          console.error('❌ No se encontró estantería con código:', shelfParam);
          console.error('❌ Códigos disponibles:', shelves.map(s => s.code));
        }
      }
    }
  }, [locationAttributes, shelves]);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes, locationsRes, shelvesRes] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll(),
        locationsAPI.getAll(),
        shelvesAPI.getAll().catch(err => {
          console.error('Error loading shelves:', err);
          return { data: [] }; // Devolver array vacío si falla
        }),
      ]);
      console.log('🔍 ShelvesRes recibido:', shelvesRes);
      console.log('🔍 ShelvesRes.data:', shelvesRes.data);
      console.log('🔍 ShelvesRes.data.data:', shelvesRes.data?.data);
      console.log('🔍 ShelvesRes.data.data es array?:', Array.isArray(shelvesRes.data?.data));
      
      setItems(itemsRes.data || []);
      setCategories(categoriesRes.data || []);
      setLocations(locationsRes.data || []);
      // Forzar shelves como array puro
      const shelvesArray = Array.isArray(shelvesRes.data?.data) ? shelvesRes.data.data : [];
      console.log('🔍 Setting shelves to:', shelvesArray);
      setShelves(shelvesArray);
      
      console.log('✅ Shelves establecidas en estado:', shelvesArray);
      
      // Cargar todos los atributos de ubicación
      const attrsRes = await locationAttributesAPI.getAll();
      setLocationAttributes(attrsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Asegurarse de que los estados tengan valores por defecto
      setItems([]);
      setCategories([]);
      setLocations([]);
      setShelves([]);
      setLocationAttributes([]);
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
    
    // Filtrar por estantería (shelf)
    const matchesShelf = !filterShelf || item.shelfId === filterShelf;
    
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
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesShelf && matchesLocationAttribute;
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
              {categories.map((cat: Category) => (
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
              {Object.entries(STATUS_LABELS).map(([key, label]: [string, string]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setFilterShelf(''); // Reset estantería al cambiar lugar
                setFilterLocationAttribute(''); // Reset ubicación al cambiar lugar
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los lugares</option>
              {locations.map((loc: Location) => (
                <option key={loc.id} value={loc.id}>
                  {loc.icon} {loc.name}
                </option>
              ))}
            </select>
            <select
              value={filterShelf}
              onChange={(e) => {
                setFilterShelf(e.target.value);
                setFilterLocationAttribute(''); // Reset ubicación al cambiar estantería
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!filterLocation}
            >
              <option value="">Todas las estanterías</option>
              {(() => {
                console.log('🔍 Filtro estanterías:', { filterLocation, shelves: shelves.map((s: Shelf) => ({ id: s.id, locationId: s.locationId, code: s.code })) });
                const filteredShelves = shelves.filter((shelf: Shelf) => !filterLocation || shelf.locationId === filterLocation);
                console.log('🔍 Estanterías filtradas:', filteredShelves.map((s: Shelf) => ({ id: s.id, code: s.code })));
                return filteredShelves.map((shelf: Shelf) => (
                  <option key={shelf.id} value={shelf.id}>
                    {shelf.code} - {shelf.name}
                  </option>
                ));
              })()}
            </select>
            <select
              value={filterLocationAttribute}
              onChange={(e) => setFilterLocationAttribute(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!filterLocation}
            >
              <option value="">Todas las ubicaciones</option>
              {(() => {
                const attrsArray: LocationAttribute[] = Array.isArray(locationAttributes) ? locationAttributes as LocationAttribute[] : [];
                console.log('🔍 Rendering locationAttributes dropdown:', { locationAttributes, attrsArray, isArray: Array.isArray(locationAttributes) });
                return attrsArray
                  .filter((attr: LocationAttribute) => {
                    if (filterShelf) {
                      // Si hay estantería seleccionada, mostrar solo ubicaciones de esa estantería
                      return attr.shelfId === filterShelf;
                    } else if (filterLocation) {
                      // Si solo hay lugar, mostrar ubicaciones sin estantería de ese lugar
                      return attr.locationId === filterLocation && !attr.shelfId;
                    }
                    return true;
                  })
                  .map((attr: LocationAttribute) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.code} - {attr.name}
                    </option>
                  ));
              })()}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item: Item) => (
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

                    {/* Lugar, Estantería y Ubicación en un cuadro */}
                    {(item.location || item.shelf || (item.attributes && item.attributes.sublocation)) && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        {item.location && (
                          <p className="text-xs text-blue-800 font-medium">
                            {item.location.icon || '📍'} {item.location.name}
                          </p>
                        )}
                        {item.shelf && (
                          <p className="text-xs text-blue-700 font-medium">
                            🗄️ {item.shelf.code} {item.shelf.name}
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
