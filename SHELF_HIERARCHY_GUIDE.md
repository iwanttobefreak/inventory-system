# Guía de Jerarquía de 3 Niveles: Lugar → Estantería → Ubicación

## Resumen

El sistema ahora soporta una jerarquía de 3 niveles para organizar items:

```
📍 Lugar (Location)
  └── 🗄️ Estantería (Shelf) - ES-XXXX
      └── 📦 Ubicación (LocationAttribute) - UB-XXXX
```

## Ejemplo Práctico

```
Almacén
├── ES-0001 (Estantería 1)
│   ├── UB-0001 (Caja micros)
│   └── UB-0002 (Caja USB)
└── ES-0002 (Estantería 2)
    └── UB-0003 (Caja cables)
```

## Backend API - FUNCIONANDO ✅

Todas las APIs del backend están completamente funcionales:

### 1. Crear Estantería

```bash
curl -X POST http://192.168.1.125:4000/api/shelves \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "TU_LOCATION_ID_AQUI",
    "code": "ES-0001",
    "name": "Estantería 1"
  }'
```

### 2. Listar Estanterías de un Lugar

```bash
curl http://192.168.1.125:4000/api/shelves?locationId=TU_LOCATION_ID_AQUI
```

### 3. Listar Todas las Estanterías

```bash
curl http://192.168.1.125:4000/api/shelves
```

### 4. Crear Ubicación con Estantería

```bash
curl -X POST http://192.168.1.125:4000/api/locations/TU_LOCATION_ID/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "shelfId": "TU_SHELF_ID_AQUI",
    "code": "UB-0001",
    "name": "Caja micros",
    "description": "Micrófonos inalámbricos",
    "order": 0
  }'
```

## Dashboard - FUNCIONANDO ✅

El dashboard (`/dashboard`) ahora tiene **3 dropdowns encadenados**:

1. **Lugar** - Selecciona el lugar
2. **Estantería** (ES-XXXX) - Se habilita al seleccionar un lugar, muestra solo las estanterías de ese lugar
3. **Ubicación** (UB-XXXX) - Se habilita al seleccionar una estantería, muestra solo las ubicaciones de esa estantería

**Funcionamiento**:
- Los dropdowns están encadenados (cascading)
- Al seleccionar un lugar, se cargan sus estanterías
- Al seleccionar una estantería, se filtran las ubicaciones
- Los filtros persisten al navegar

## Admin Panel - ESTADO ACTUAL ⚠️

El panel de administración (`/admin`) actualmente muestra el sistema antiguo de 2 niveles (Lugar → Ubicación).

**Para actualizar a 3 niveles, el panel de admin necesita**:
1. Agregar sección de estanterías dentro de cada lugar
2. Agregar formulario para crear/editar estanterías (ES-XXXX)
3. Mover las ubicaciones para que estén dentro de las estanterías
4. Actualizar los imports para incluir `shelvesAPI`

## Pasos para Probar el Sistema

### Opción 1: Usando curl (Recomendado para probar API)

1. **Obtener ID de un lugar existente:**
   ```bash
   curl http://192.168.1.125:4000/api/locations | jq
   ```

2. **Crear una estantería:**
   ```bash
   # Reemplaza LOCATION_ID con el ID del paso anterior
   curl -X POST http://192.168.1.125:4000/api/shelves \
     -H "Content-Type: application/json" \
     -d '{
       "locationId": "LOCATION_ID",
       "code": "ES-0001",
       "name": "Estantería 1"
     }'
   ```

3. **Verificar que se creó:**
   ```bash
   curl http://192.168.1.125:4000/api/shelves
   ```

4. **Crear ubicaciones en esa estantería:**
   ```bash
   # Reemplaza LOCATION_ID y SHELF_ID
   curl -X POST http://192.168.1.125:4000/api/locations/LOCATION_ID/attributes \
     -H "Content-Type: application/json" \
     -d '{
       "shelfId": "SHELF_ID",
       "code": "UB-0001",
       "name": "Caja micros"
     }'
   ```

### Opción 2: Usando el Dashboard

1. Ve a `http://192.168.1.125:3000/dashboard`
2. Verás 3 dropdowns: Lugar, Estantería, Ubicación
3. Selecciona un lugar → El segundo dropdown se habilitará
4. Selecciona una estantería → El tercer dropdown mostrará las ubicaciones de esa estantería
5. Los filtros funcionan en cascada

## Schema de Base de Datos

```prisma
model Location {
  id          String   @id @default(cuid())
  name        String
  shelves     Shelf[]  // NUEVO: Un lugar tiene múltiples estanterías
  @@map("locations")
}

model Shelf {
  id          String   @id @default(cuid())
  locationId  String
  code        String   @unique  // ES-XXXX
  name        String
  location    Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  sublocations LocationAttribute[]  // Una estantería tiene múltiples ubicaciones
  @@map("shelves")
}

model LocationAttribute {
  id          String    @id @default(cuid())
  locationId  String    // Para compatibilidad
  shelfId     String?   // NUEVO: ID de la estantería padre
  code        String    @unique  // UB-XXXX
  name        String
  shelf       Shelf?    @relation(fields: [shelfId], references: [id], onDelete: Cascade)
  @@map("location_attributes")
}
```

## Siguiente Paso Recomendado

Para completar la implementación del panel de administración con jerarquía de 3 niveles, necesitarías actualizar `frontend/app/admin/LocationsPanel.tsx` para:

1. Mostrar estanterías dentro de cada lugar expandido
2. Permitir crear/editar/eliminar estanterías
3. Mostrar ubicaciones dentro de cada estantería expandida
4. Asegurar que las ubicaciones se asocien con una estantería

El código del backend ya está completamente implementado y probado. Solo falta actualizar el UI del panel de administración.
