'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { categoriesAPI, categoryAttributesAPI } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  _count?: { items: number };
}

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

const ESTADOS = [
  'disponible',
  'en uso',
  'mantenimiento',
  'reparación',
  'baja'
];

const ICONOS_SUGERIDOS = [
  '📷', '🎥', '🎬', '🎤', '💡', '🔌', '🎧', '📡', 
  '🖥️', '💻', '⌨️', '🖱️', '📱', '🔋', '🎮', '🎯'
];

const COLORES_SUGERIDOS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
];

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados del formulario de categoría
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('📦');
  const [categoryColor, setCategoryColor] = useState('#3B82F6');

  // Estados para atributos
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, CategoryAttribute[]>>({});
  const [loadingAttributes, setLoadingAttributes] = useState<string | null>(null);
  const [showAttributeForm, setShowAttributeForm] = useState<string | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [attributeName, setAttributeName] = useState('');
  const [attributeKey, setAttributeKey] = useState('');
  const [attributeType, setAttributeType] = useState<CategoryAttribute['type']>('TEXT');
  const [attributeOptions, setAttributeOptions] = useState('');
  const [attributeRequired, setAttributeRequired] = useState(false);
  const [attributeOrder, setAttributeOrder] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      alert('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
        icon: categoryIcon,
        color: categoryColor,
      };

      if (editingCategory) {
        // Actualizar
        await categoriesAPI.update(editingCategory.id, data);
        alert('✅ Categoría actualizada exitosamente');
      } else {
        // Crear
        await categoriesAPI.create(data);
        alert('✅ Categoría creada exitosamente');
      }

      // Recargar y cerrar formulario
      await loadCategories();
      handleCancelCategory();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      alert('❌ Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCategoryIcon(category.icon || '📦');
    setCategoryColor(category.color || '#3B82F6');
    setShowCategoryForm(true);
  };

  const handleCancelCategory = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategoryIcon('📦');
    setCategoryColor('#3B82F6');
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category._count && category._count.items > 0) {
      alert(`No se puede eliminar "${category.name}" porque tiene ${category._count.items} items asociados`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      alert('✅ Categoría eliminada exitosamente');
      await loadCategories();
    } catch (error: any) {
      console.error('Error eliminando categoría:', error);
      const message = error.response?.data?.error || 'Error al eliminar la categoría';
      alert(`❌ ${message}`);
    }
  };

  // ===== FUNCIONES DE ATRIBUTOS =====

  const loadAttributes = async (categoryId: string) => {
    setLoadingAttributes(categoryId);
    try {
      const response = await categoryAttributesAPI.getAll(categoryId);
      setCategoryAttributes(prev => ({ ...prev, [categoryId]: response.data }));
    } catch (error) {
      console.error('Error cargando atributos:', error);
      alert('Error al cargar los atributos');
    } finally {
      setLoadingAttributes(null);
    }
  };

  const handleToggleAttributes = async (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      if (!categoryAttributes[categoryId]) {
        await loadAttributes(categoryId);
      }
    }
  };

  const handleShowAttributeForm = (categoryId: string) => {
    setShowAttributeForm(categoryId);
    setEditingAttribute(null);
    resetAttributeForm();
  };

  const handleEditAttribute = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setAttributeName(attribute.name);
    setAttributeKey(attribute.key);
    setAttributeType(attribute.type);
    setAttributeOptions(attribute.options || '');
    setAttributeRequired(attribute.required);
    setAttributeOrder(attribute.order);
    setShowAttributeForm(attribute.categoryId);
  };

  const resetAttributeForm = () => {
    setAttributeName('');
    setAttributeKey('');
    setAttributeType('TEXT');
    setAttributeOptions('');
    setAttributeRequired(false);
    setAttributeOrder(0);
  };

  const handleCancelAttributeForm = () => {
    setShowAttributeForm(null);
    setEditingAttribute(null);
    resetAttributeForm();
  };

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleAttributeNameChange = (name: string) => {
    setAttributeName(name);
    if (!editingAttribute) {
      // Auto-generate key only for new attributes
      setAttributeKey(generateKey(name));
    }
  };

  const handleSaveAttribute = async () => {
    if (!showAttributeForm) return;
    if (!attributeName.trim() || !attributeKey.trim()) {
      alert('El nombre y la clave son obligatorios');
      return;
    }

    if (attributeType === 'SELECT' && !attributeOptions.trim()) {
      alert('Debes proporcionar opciones para un campo de tipo SELECT');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: attributeName.trim(),
        key: attributeKey.trim(),
        type: attributeType,
        options: attributeType === 'SELECT' ? attributeOptions.trim() : undefined,
        required: attributeRequired,
        order: attributeOrder,
      };

      if (editingAttribute) {
        await categoryAttributesAPI.update(showAttributeForm, editingAttribute.id, data);
        alert('✅ Atributo actualizado exitosamente');
      } else {
        await categoryAttributesAPI.create(showAttributeForm, data);
        alert('✅ Atributo creado exitosamente');
      }

      await loadAttributes(showAttributeForm);
      handleCancelAttributeForm();
    } catch (error: any) {
      console.error('Error guardando atributo:', error);
      const message = error.response?.data?.error || 'Error al guardar el atributo';
      alert(`❌ ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAttribute = async (categoryId: string, attributeId: string, attributeName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el atributo "${attributeName}"?`)) {
      return;
    }

    try {
      await categoryAttributesAPI.delete(categoryId, attributeId);
      alert('✅ Atributo eliminado exitosamente');
      await loadAttributes(categoryId);
    } catch (error: any) {
      console.error('Error eliminando atributo:', error);
      const message = error.response?.data?.error || 'Error al eliminar el atributo';
      alert(`❌ ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            ← Volver al Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ Administración del Sistema
          </h1>
          <p className="text-gray-600">
            Gestiona categorías y estados del inventario
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Categorías */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">📁 Categorías</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm"
              >
                + Nueva Categoría
              </button>
            </div>

            {/* Formulario de Categoría */}
            {showCategoryForm && (
              <div className="mb-6 p-4 border-2 border-primary-200 rounded-lg bg-primary-50">
                <h3 className="font-bold text-gray-900 mb-4">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Cámaras"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
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
                        value={categoryIcon}
                        onChange={(e) => setCategoryIcon(e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-2xl"
                        maxLength={2}
                      />
                      <span className="text-sm text-gray-600">o selecciona:</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                      {ICONOS_SUGERIDOS.map((icono) => (
                        <button
                          key={icono}
                          onClick={() => setCategoryIcon(icono)}
                          className={`text-2xl p-2 rounded hover:bg-gray-100 transition ${
                            categoryIcon === icono ? 'bg-primary-100 ring-2 ring-primary-500' : ''
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
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="w-20 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {COLORES_SUGERIDOS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCategoryColor(color)}
                          className={`h-8 rounded transition ${
                            categoryColor === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-white rounded-lg border-2 border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Vista Previa:</div>
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
                      style={{ backgroundColor: categoryColor }}
                    >
                      <span className="text-xl">{categoryIcon}</span>
                      <span>{categoryName || 'Nombre de categoría'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveCategory}
                      disabled={saving || !categoryName.trim()}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:bg-gray-400"
                    >
                      {saving ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                    </button>
                    <button
                      onClick={handleCancelCategory}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Categorías */}
            <div className="space-y-3">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📁</div>
                  <p>No hay categorías creadas</p>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    {/* Category Header */}
                    <div className="p-4">
                      {/* Fila 1: Icono y Texto */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        >
                          {category.icon || '📦'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-600">{category.description}</div>
                          )}
                          {category._count && (
                            <div className="text-xs text-gray-500 mt-1">
                              {category._count.items} items
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Fila 2: Botones */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleAttributes(category.id)}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition whitespace-nowrap"
                        >
                          🔧 Atributos
                        </button>
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition whitespace-nowrap"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition whitespace-nowrap"
                          disabled={category._count && category._count.items > 0}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Attributes Panel (Expandable) */}
                    {expandedCategory === category.id && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-900">Atributos Personalizados</h3>
                          <button
                            onClick={() => handleShowAttributeForm(category.id)}
                            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                          >
                            + Nuevo Atributo
                          </button>
                        </div>

                        {/* Attribute Form */}
                        {showAttributeForm === category.id && (
                          <div className="mb-4 p-4 border-2 border-primary-200 rounded-lg bg-white">
                            <h4 className="font-bold text-gray-900 mb-3">
                              {editingAttribute ? 'Editar Atributo' : 'Nuevo Atributo'}
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nombre *
                                </label>
                                <input
                                  type="text"
                                  value={attributeName}
                                  onChange={(e) => handleAttributeNameChange(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  placeholder="Ej: Tipo de conector"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Clave (JSON) *
                                </label>
                                <input
                                  type="text"
                                  value={attributeKey}
                                  onChange={(e) => setAttributeKey(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                                  placeholder="Ej: connector_type"
                                  disabled={!!editingAttribute}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tipo *
                                </label>
                                <select
                                  value={attributeType}
                                  onChange={(e) => setAttributeType(e.target.value as CategoryAttribute['type'])}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="TEXT">Texto</option>
                                  <option value="NUMBER">Número</option>
                                  <option value="SELECT">Selección (dropdown)</option>
                                  <option value="DATE">Fecha</option>
                                  <option value="BOOLEAN">Sí/No</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Orden
                                </label>
                                <input
                                  type="number"
                                  value={attributeOrder}
                                  onChange={(e) => setAttributeOrder(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              </div>

                              {attributeType === 'SELECT' && (
                                <div className="col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opciones (separadas por comas) *
                                  </label>
                                  <input
                                    type="text"
                                    value={attributeOptions}
                                    onChange={(e) => setAttributeOptions(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="XLR-XLR,XLR-JACK,JACK-JACK,RCA-RCA"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Las opciones se mostrarán en un dropdown
                                  </p>
                                </div>
                              )}

                              <div className="col-span-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={attributeRequired}
                                    onChange={(e) => setAttributeRequired(e.target.checked)}
                                    className="rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    Campo obligatorio
                                  </span>
                                </label>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={handleSaveAttribute}
                                disabled={saving || !attributeName.trim() || !attributeKey.trim()}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:bg-gray-400 text-sm"
                              >
                                {saving ? 'Guardando...' : editingAttribute ? 'Actualizar' : 'Crear'}
                              </button>
                              <button
                                onClick={handleCancelAttributeForm}
                                disabled={saving}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Attributes List */}
                        {loadingAttributes === category.id ? (
                          <div className="text-center py-4 text-gray-500">Cargando atributos...</div>
                        ) : !categoryAttributes[category.id] || categoryAttributes[category.id].length === 0 ? (
                          <div className="text-center py-4 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-2xl mb-2">🔧</div>
                            <p className="text-sm">No hay atributos definidos para esta categoría</p>
                            <p className="text-xs mt-1">Los atributos permiten agregar campos personalizados a los items</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {categoryAttributes[category.id]
                              .sort((a, b) => a.order - b.order)
                              .map((attr) => (
                                <div
                                  key={attr.id}
                                  className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg gap-4"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">{attr.name}</span>
                                      {attr.required && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                          Obligatorio
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      <span className="font-mono bg-gray-100 px-1 rounded">{attr.key}</span>
                                      {' · '}
                                      <span className="capitalize">{attr.type.toLowerCase()}</span>
                                      {attr.type === 'SELECT' && attr.options && (
                                        <>
                                          {' · '}
                                          <span className="text-gray-500">
                                            {attr.options.split(',').length} opciones
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {attr.type === 'SELECT' && attr.options && (
                                      <div className="text-xs text-gray-500 mt-1 break-words">
                                        <span className="font-medium">Opciones:</span> {attr.options}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleEditAttribute(attr)}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAttribute(category.id, attr.id, attr.name)}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel de Estados */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏷️ Estados del Sistema</h2>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xl">ℹ️</span>
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Estados Predefinidos</p>
                  <p>Los estados actualmente están definidos en el código. Para modificarlos necesitas:</p>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Crear una tabla de Estados en la base de datos</li>
                    <li>Crear endpoints en el backend (/api/states)</li>
                    <li>Implementar el CRUD completo similar a categorías</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ESTADOS.map((estado) => (
                <div
                  key={estado}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <span className="font-medium text-gray-900 capitalize">{estado}</span>
                  <span className="text-sm text-gray-500">Sistema</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xl">💡</span>
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">¿Quieres gestionar estados dinámicamente?</p>
                  <p>Puedo ayudarte a implementar un sistema completo de gestión de estados similar al de categorías.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
