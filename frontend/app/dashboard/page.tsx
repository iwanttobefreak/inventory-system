'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { itemsAPI, categoriesAPI, getBackendUrl } from '@/lib/api';
import { Item, Category, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        itemsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
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
    return matchesSearch && matchesCategory && matchesStatus;
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total de items</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600 mt-1">Disponibles</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.inUse}</div>
            <div className="text-sm text-gray-600 mt-1">En uso</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600">{stats.maintenance}</div>
            <div className="text-sm text-gray-600 mt-1">Mantenimiento</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {/* Header con icono y miniatura */}
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icono de categoría */}
                    <span className="text-3xl flex-shrink-0">{item.category.icon}</span>
                    
                    {/* Nombre y código */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{item.code}</p>
                    </div>
                  </div>
                  
                  {/* Miniatura de imagen */}
                  {item.imageUrl && (
                    <div className="flex-shrink-0 w-[100px] h-[110px] bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={`${getBackendUrl()}${item.imageUrl}`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>

                  {item.brand && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Marca:</span> {item.brand} {item.model}
                    </p>
                  )}

                  {item.location && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{item.location.icon || '📍'}</span> {item.location.name}
                    </p>
                  )}

                  <p className="text-xs text-gray-400">
                    {item.category.name}
                  </p>
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
