# Guía de Administración - Panel de Categorías

## 📍 Acceso
Dashboard → **⚙️ Administración** → http://localhost:3000/admin

## ✅ Funcionalidades Implementadas

### 📁 Gestión de Categorías (CRUD Completo)

#### 1. **Crear Categoría**
- Botón: "+ Nueva Categoría"
- Campos:
  - **Nombre** (obligatorio)
  - **Descripción** (opcional)
  - **Icono**: Selector visual con 16 emojis sugeridos o emoji personalizado
  - **Color**: Selector de color + 8 colores predefinidos
  - **Vista Previa**: Muestra cómo se verá la categoría en tiempo real
- Endpoint: `POST /api/categories`

#### 2. **Ver Categorías**
- Lista todas las categorías con:
  - Icono y color personalizados
  - Nombre y descripción
  - Contador de items asociados
- Ordenadas alfabéticamente por nombre
- Endpoint: `GET /api/categories`

#### 3. **Editar Categoría**
- Botón: "✏️ Editar" en cada categoría
- Permite modificar todos los campos
- Vista previa actualizada en tiempo real
- Endpoint: `PUT /api/categories/:id`

#### 4. **Eliminar Categoría**
- Botón: "🗑️ Eliminar" en cada categoría
- Protección: No se puede eliminar si tiene items asociados
- Confirmación antes de eliminar
- Endpoint: `DELETE /api/categories/:id`

## 🎨 Características de Diseño

### Iconos Sugeridos
📷 🎥 🎬 🎤 💡 🔌 🎧 📡 🖥️ 💻 ⌨️ 🖱️ 📱 🔋 🎮 🎯

### Colores Predefinidos
- Azul: #3B82F6
- Verde: #10B981
- Ámbar: #F59E0B
- Rojo: #EF4444
- Morado: #8B5CF6
- Rosa: #EC4899
- Índigo: #6366F1
- Teal: #14B8A6

## 🔒 Validaciones

### En el Frontend
- ✅ Nombre obligatorio
- ✅ Confirmación antes de eliminar
- ✅ Verificación de items asociados antes de permitir eliminación
- ✅ Vista previa en tiempo real

### En el Backend
- ✅ Verificación de existencia antes de actualizar/eliminar
- ✅ Conteo de items asociados
- ✅ Prevención de eliminación si hay items asociados
- ✅ Autenticación requerida en todos los endpoints

## 📊 Endpoints de la API

```typescript
// Listar todas las categorías
GET /api/categories
Headers: Authorization: Bearer <token>
Response: Category[]

// Crear categoría
POST /api/categories
Headers: Authorization: Bearer <token>
Body: {
  name: string,
  description?: string,
  icon?: string,
  color?: string
}
Response: Category

// Actualizar categoría
PUT /api/categories/:id
Headers: Authorization: Bearer <token>
Body: {
  name: string,
  description?: string,
  icon?: string,
  color?: string
}
Response: Category

// Eliminar categoría
DELETE /api/categories/:id
Headers: Authorization: Bearer <token>
Response: { message: string }
Error 400: Si tiene items asociados
Error 404: Si no existe
```

## 🏷️ Estados del Sistema

Actualmente hay 5 estados predefinidos en el código:
- `disponible`
- `en uso`
- `mantenimiento`
- `reparación`
- `baja`

**Nota**: Los estados están hardcodeados. Para hacerlos editables se necesitaría:
1. Crear modelo `State` en Prisma
2. Crear endpoints `/api/states` (similar a categorías)
3. Migrar items existentes a usar referencia a states

## 🚀 Uso Recomendado

### Flujo de Trabajo
1. **Crear categorías** antes de agregar items
2. **Usar iconos y colores** distintivos para fácil identificación
3. **No eliminar** categorías con items asociados (primero reasignar los items)
4. **Editar** en lugar de eliminar/recrear para mantener la integridad

### Buenas Prácticas
- Usa nombres descriptivos y concisos
- Elige colores que representen el tipo de equipo
- Usa emojis relevantes para identificación visual rápida
- Añade descripciones para categorías que puedan ser ambiguas

## 🔧 Archivos Modificados

### Backend
- `/backend/src/routes/categories.ts` - Endpoints CRUD completos
- Incluye: GET, POST, PUT, DELETE con validaciones

### Frontend
- `/frontend/app/admin/page.tsx` - Interfaz completa de administración
- `/frontend/lib/api.ts` - Funciones de API actualizadas
- `/frontend/app/dashboard/page.tsx` - Botón de acceso a administración

## 📝 Ejemplos de Categorías

```typescript
// Cámara de video
{
  name: "Cámaras",
  description: "Cámaras de video profesionales",
  icon: "📷",
  color: "#3B82F6"
}

// Iluminación
{
  name: "Iluminación",
  description: "Equipos de iluminación y accesorios",
  icon: "💡",
  color: "#F59E0B"
}

// Audio
{
  name: "Audio",
  description: "Micrófonos, grabadoras y equipos de sonido",
  icon: "🎤",
  color: "#10B981"
}
```

## ⚠️ Limitaciones Conocidas

1. **Estados**: Actualmente no son editables desde la interfaz
2. **Bulk Operations**: No hay selección múltiple para operaciones masivas
3. **Ordenamiento**: Solo por nombre alfabético (no hay opción de ordenar por otros campos)
4. **Búsqueda**: No hay filtro de búsqueda en la lista de categorías

## 🎯 Próximas Mejoras Sugeridas

- [ ] Sistema de gestión de estados dinámicos
- [ ] Búsqueda/filtrado de categorías
- [ ] Ordenamiento customizable
- [ ] Operaciones masivas (eliminar múltiples)
- [ ] Importar/exportar categorías
- [ ] Historial de cambios
- [ ] Estadísticas de uso por categoría
