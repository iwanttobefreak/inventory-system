'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI, locationAttributesAPI, getBackendUrl } from '@/lib/api';
import { Item, LocationAttribute, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

export default function LocationPage() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [locationAttribute, setLocationAttribute] = useState<LocationAttribute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [code]);

  const loadData = async () => {
    try {
      // Cargar todos los items
      const itemsRes = await itemsAPI.getAll();
      const allItems = itemsRes.data;

      // El parámetro code viene CON el prefijo UB- porque la ruta es /UB-[code]
      // Por ejemplo: si la URL es /UB-0001, code = "UB-0001"
      const fullCode = code.toUpperCase();
      
      console.log('🔍 Parámetro code recibido:', code);
      console.log('🔍 Buscando items con ubicación:', fullCode);
      
      const filteredItems = allItems.filter((item: Item) => {
        const itemSublocation = item.attributes?.sublocation;
        const matches = itemSublocation && 
          typeof itemSublocation === 'string' &&
          itemSublocation.toUpperCase() === fullCode;
        
        if (matches) {
          console.log('✅ Item encontrado:', item.code, '- Ubicación:', itemSublocation);
        }
        
        return matches;
      });

      console.log('📊 Total items filtrados:', filteredItems.length);
      setItems(filteredItems);

      // Intentar obtener información de la ubicación si hay items
      if (filteredItems.length > 0 && filteredItems[0].locationId) {
        try {
          const attrsRes = await locationAttributesAPI.getAll(filteredItems[0].locationId);
          const attr = attrsRes.data.find((a: LocationAttribute) => 
            a.code.toUpperCase() === fullCode
          );
          if (attr) {
            setLocationAttribute(attr);
          }
        } catch (error) {
          console.error('Error loading location attribute:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // El parámetro code viene sin el prefijo UB- (ej: "0001")
  const fullCode = `UB-${code.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📍 Ubicación {fullCode}
              </h1>
              {locationAttribute && (
                <p className="text-lg text-gray-600">{locationAttribute.name}</p>
              )}
              {locationAttribute?.description && (
                <p className="text-sm text-gray-500 mt-1">{locationAttribute.description}</p>
              )}
            </div>
            <button
              onClick={() => {
                // Si tenemos locationAttribute, pasamos sus IDs como parámetros
                if (locationAttribute) {
                  router.push(
                    `/dashboard?location=${locationAttribute.locationId}&sublocation=${locationAttribute.id}`
                  );
                } else {
                  router.push('/dashboard');
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-primary-600">{items.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total de items</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">
              {items.filter((i) => i.status === 'AVAILABLE').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Disponibles</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              {items.filter((i) => i.status === 'IN_USE').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">En uso</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600">
              {items.filter((i) => i.status === 'MAINTENANCE' || i.status === 'REPAIR').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Mantenimiento</div>
          </div>
        </div>

        {/* Lista de items */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No hay items en esta ubicación</p>
            {isAuthenticated() && (
              <button
                onClick={() => router.push('/new')}
                className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
              >
                ➕ Añadir primer item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
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

                      {/* Ubicación */}
                      {item.location && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">{item.location.icon || '📍'}</span> {item.location.name}
                        </p>
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
        )}
      </div>
    </div>
  );
}
