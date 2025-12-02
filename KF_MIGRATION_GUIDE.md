# 🔄 Cambio de Sistema de Códigos: kf-XXXX

## 📋 Resumen de Cambios

Se ha actualizado el sistema completo para usar códigos en formato **kf-XXXX** (ej: `kf-0001`, `kf-0002`, etc.).

### ✅ Cambios Implementados

#### 1. Backend
- ✅ Función automática para generar códigos secuenciales (`getNextCode()`)
- ✅ Nuevo endpoint `GET /api/items/next-code` para obtener el siguiente código disponible
- ✅ Código opcional al crear items (se genera automáticamente si no se provee)
- ✅ URLs de QR actualizadas: `https://kairoframe.lobo99.info/kf-0001`
- ✅ Seed data actualizado con códigos kf-0001 a kf-0005

#### 2. Frontend

**Nueva Estructura de Rutas:**
- ✅ `/[code]/page.tsx` - Ruta unificada para mostrar/crear items con códigos kf-XXXX
  - Si el item existe: muestra información completa
  - Si no existe y estás autenticado: muestra formulario de creación
  - Si no existe y no estás autenticado: redirige al dashboard
- ✅ `/new/page.tsx` - Página para crear nuevo item (genera código automático)
- ✅ `/scanner/page.tsx` - Actualizado para reconocer formato kf-XXXX

**Funcionalidad de la Ruta Unificada `/[code]`:**
```
https://kairoframe.lobo99.info/kf-0001
```

**Flujo:**
1. Valida que el código tenga formato `kf-\d{4}` (ej: kf-0001)
2. Intenta cargar el item desde la API
3. Si existe:
   - Modo lectura: Muestra toda la información
   - Modo edición: Formulario para modificar
   - Botones: Editar, Eliminar, Ver QR
4. Si NO existe (404):
   - Muestra formulario de creación
   - Código ya pre-asignado (kf-XXXX)
   - Al crear, se registra con ese código

#### 3. Scanner
- ✅ Reconoce formato `https://kairoframe.lobo99.info/kf-0001`
- ✅ Redirige a `/{code}` automáticamente
- ✅ Mensajes de error actualizados

#### 4. Dashboard
- ✅ Botón "Nuevo Item" actualizado para usar `/new`
- ✅ Items mostrados con códigos kf-XXXX

---

## 🎯 Flujos de Uso

### Crear Nuevo Item (Método 1: Botón Dashboard)

```
1. Dashboard → Click "➕ Nuevo Item"
2. Sistema genera siguiente código (ej: kf-0010)
3. Página /new muestra el código generado
4. Click "Continuar con este código"
5. Redirige a /kf-0010 (que no existe)
6. Muestra formulario de creación
7. Completar datos y guardar
8. Item creado con código kf-0010
```

### Crear Nuevo Item (Método 2: Escanear QR No Existente)

```
1. Imprimir pegatina con QR de código futuro (ej: kf-0025)
2. Escanear el QR
3. Sistema detecta que kf-0025 no existe
4. Muestra formulario de creación
5. Completar datos y guardar
6. Item creado con código kf-0025
```

### Ver Item Existente

```
1. Escanear QR de item existente (ej: kf-0001)
2. Sistema carga información del item
3. Muestra todos los detalles
   - Si estás autenticado: puedes editar/eliminar
   - Si NO estás autenticado: solo info de devolución
```

---

## 📱 Formatos de URL Soportados

### Rutas Públicas (Frontend)
```
✅ https://kairoframe.lobo99.info/kf-0001
✅ https://kairoframe.lobo99.info/kf-9999
✅ http://localhost:3000/kf-0001 (desarrollo)
```

### API Backend
```
✅ GET /api/items/next-code → Obtiene siguiente código
✅ GET /api/items/kf-0001 → Obtiene item por código
✅ POST /api/items → Crea item (código opcional)
✅ PUT /api/items/kf-0001 → Actualiza item
✅ DELETE /api/items/kf-0001 → Elimina item
```

---

## 🔧 Configuración Nginx

La nueva configuración es **mucho más simple**:

### Antes (Complejo)
```nginx
location /items {
    # Múltiples reglas para /items/[code], /items/new, etc.
}
```

### Ahora (Simple)
```nginx
location /api {
    # Backend API
    proxy_pass http://192.168.1.84:4000;
}

location / {
    # Frontend - maneja TODO lo demás (incluyendo /kf-XXXX)
    proxy_pass http://192.168.1.84:3000;
}
```

**Razón:** Next.js maneja dinámicamente las rutas `/[code]`, así que nginx solo necesita pasar todo lo que no sea `/api` al frontend.

---

## 🗄️ Base de Datos

**Schema Prisma:** No requiere cambios. El campo `code` ya permite cualquier string único.

```prisma
model Item {
  code String @unique // Acepta "kf-0001", "kf-0002", etc.
  // ... resto de campos
}
```

**Migración:** No es necesaria. Los códigos existentes siguen funcionando.

**Seed Data:** Actualizado con códigos kf-0001 a kf-0005.

---

## 🔄 Migración de Datos Existentes

Si ya tienes items con códigos antiguos (CAM001, MIC001, etc.), puedes:

### Opción 1: Mantener ambos formatos
```typescript
// El sistema soporta cualquier formato de código
// Nuevos items usan kf-XXXX
// Items antiguos mantienen su código original
```

### Opción 2: Migrar códigos existentes
```sql
-- Script SQL para renumerar items existentes
UPDATE items SET code = 'kf-0001' WHERE code = 'CAM001';
UPDATE items SET code = 'kf-0002' WHERE code = 'MIC001';
-- etc...
```

### Opción 3: Limpiar y empezar de nuevo
```bash
# Desde el directorio inventory-system
./start.sh clean
```

---

## 📋 Checklist de Implementación

### Backend ✅
- [x] Función `getNextCode()` implementada
- [x] Endpoint `/api/items/next-code` creado
- [x] Código opcional en creación de items
- [x] URLs de QR actualizadas a `/{code}`
- [x] Seed data con códigos kf-XXXX

### Frontend ✅
- [x] Ruta unificada `/[code]/page.tsx`
- [x] Página `/new/page.tsx` para nuevo item
- [x] Scanner actualizado para formato kf-XXXX
- [x] Dashboard con botón "Nuevo Item" corregido
- [x] Validación de formato kf-XXXX

### Infraestructura ✅
- [x] Configuración nginx simplificada
- [x] Documentación actualizada

---

## 🎨 Generación de Pegatinas

### Formato QR
```
URL: https://kairoframe.lobo99.info/kf-0001
Tamaño: 3x3 cm (mínimo) para buena legibilidad
```

### Diseño Sugerido
```
┌─────────────────┐
│   🎬 KAIRO      │
│                 │
│   [QR CODE]     │
│                 │
│    kf-0001      │
└─────────────────┘
```

### Herramientas
- **Imprimir en lote:** Puedes usar la API `/api/items/:code/qr` para obtener el QR
- **Software:** Cualquier generador de etiquetas (Avery, Brother P-touch, etc.)

---

## 🚀 Despliegue

### 1. Reconstruir Backend
```bash
cd inventory-system
docker-compose up -d --build backend
```

### 2. Reconstruir Frontend
```bash
docker-compose up -d --build frontend
```

### 3. Actualizar Nginx
```bash
# En el servidor nginx
sudo cp nginx-kf-config.conf /etc/nginx/sites-available/kairoframe
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Limpiar Datos Antiguos (Opcional)
```bash
./start.sh clean
```

---

## 🧪 Testing

### Probar Nuevo Item
```bash
# 1. Obtener siguiente código
curl https://kairoframe.lobo99.info/api/items/next-code

# 2. Acceder a ese código en el navegador
# https://kairoframe.lobo99.info/kf-0006
# Debería mostrar formulario de creación
```

### Probar Scanner
```bash
# 1. Generar QR de prueba con URL:
# https://kairoframe.lobo99.info/kf-0001

# 2. Escanear con el scanner
# Debería redirigir a la página del item
```

### Probar Item Existente
```bash
# Acceder a item de seed data
# https://kairoframe.lobo99.info/kf-0001
# Debería mostrar la Sony A7S III
```

---

## 📝 Notas Importantes

1. **Formato Estricto:** Solo acepta `kf-XXXX` (4 dígitos)
   - ✅ kf-0001, kf-0999, kf-9999
   - ❌ kf-1, kf-01, kf-00001, KF-0001

2. **Códigos Secuenciales:** El sistema genera el siguiente código disponible
   - Si el último es kf-0005, el siguiente será kf-0006
   - Si borras kf-0003, NO se reutiliza (el siguiente sigue siendo kf-0006)

3. **Límite de Códigos:** Soporta hasta 9999 items (kf-0001 a kf-9999)
   - Si necesitas más, se puede cambiar a 5 dígitos (kf-00001 a kf-99999)

4. **Nginx:** El orden de las reglas `location` es importante
   - `/api` debe estar ANTES de `/`
   - Esto asegura que las llamadas API no vayan al frontend

---

## 🐛 Troubleshooting

### "Item not found" al escanear QR
- Verifica que el QR contiene la URL completa: `https://kairoframe.lobo99.info/kf-0001`
- Asegúrate de que el formato es exactamente `kf-XXXX` (minúsculas, 4 dígitos)

### Botón "Nuevo Item" no funciona
- Verifica que el endpoint `/api/items/next-code` responde
- Revisa la consola del navegador para errores

### Scanner no reconoce el QR
- El QR debe terminar en `/kf-XXXX`
- Formato válido: `https://kairoframe.lobo99.info/kf-0001`
- NO válido: `https://kairoframe.lobo99.info/items/kf-0001`

### Nginx 404 para /kf-XXXX
- Verifica que la regla `location /` está configurada
- Verifica que no hay reglas conflictivas antes de `location /`
- Reinicia nginx: `sudo systemctl reload nginx`

---

## 📚 Archivos Modificados

```
backend/
├── src/routes/items.ts          # ✅ Nuevo endpoint next-code, código opcional
└── prisma/seed.ts               # ✅ Códigos actualizados a kf-XXXX

frontend/
├── app/[code]/page.tsx          # ✅ NUEVO - Ruta unificada
├── app/new/page.tsx             # ✅ NUEVO - Página nuevo item
├── app/scanner/page.tsx         # ✅ Actualizado para kf-XXXX
└── app/dashboard/page.tsx       # ✅ Botón Nuevo Item corregido

nginx-kf-config.conf             # ✅ NUEVO - Config simplificada
```

---

**Actualizado:** 1 de diciembre de 2025
**Versión:** 2.0.0
**Estado:** ✅ Listo para producción
