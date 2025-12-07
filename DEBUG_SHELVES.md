# 🔍 Debugging: Estanterías no aparecen en el combo

## Problema
Al seleccionar "Almacén" en el combo de lugares, no aparecen las estanterías ES-0001 y ES-0002.

## Verificación del Backend ✅

El backend funciona correctamente:

```bash
curl http://192.168.1.125:4000/api/shelves
```

Retorna:
- ES-0001 (Estantería A) - locationId: cmithkpqa0008unqp809wfrp5 (Almacén)
- ES-0002 (Estanteria cables) - locationId: cmithkpqa0008unqp809wfrp5 (Almacén)

## Cómo depurar en el navegador

1. **Abrir la consola del navegador** (F12)

2. **Ir al Dashboard**: http://192.168.1.125:3000/dashboard

3. **Buscar estos logs en la consola**:
   ```
   🔍 ShelvesRes recibido: {...}
   🔍 ShelvesRes.data: [...]
   🔍 ShelvesRes.data es array?: true
   ✅ Shelves establecidas en estado: [...]
   ```

4. **Al seleccionar "Almacén" en el combo, buscar**:
   ```
   🔍 Rendering shelves dropdown: { shelves: [...], shelvesArray: [...], isArray: true }
   ```

## Posibles causas

### 1. Estado `shelves` vacío
**Síntoma**: El log muestra `shelves: []`
**Solución**: El API no devolvió datos o hubo un error de red

### 2. `locationId` no coincide
**Síntoma**: Las estanterías se cargan pero no se muestran al filtrar
**Solución**: Verificar que el `filterLocation` coincida con el `locationId` de las estanterías

Para verificar, ejecuta esto en la consola del navegador:
```javascript
// Ver el estado de shelves
console.log('Shelves:', localStorage.getItem('shelves'));

// Ver el locationId del Almacén
fetch('http://192.168.1.125:4000/api/locations')
  .then(r => r.json())
  .then(d => console.log('Locations:', d));
```

### 3. Combo deshabilitado
**Síntoma**: El combo está gris (disabled)
**Solución**: Asegúrate de que `filterLocation` tenga un valor

## Rebuild del Frontend

Si los logs no aparecen, el frontend no tiene el código actualizado:

```bash
cd /Users/T054810/copilot/pruebas/kairo/inventory-system
docker compose build frontend
docker compose up -d frontend
```

## Verificación rápida

Ejecuta esto en la consola del navegador después de cargar el dashboard:

```javascript
// Ver el estado actual
const state = window.__NEXT_DATA__;
console.log('Next State:', state);

// Probar el API directamente
fetch('http://192.168.1.125:4000/api/shelves')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Shelves desde API:', data);
    console.log('📊 Cantidad:', data.data.length);
    console.log('📦 Almacén:', data.data.filter(s => s.location.name === 'Almacén'));
  });
```

## Solución temporal

Si el problema persiste, puedes asignar shelves manualmente a los items desde la base de datos:

```sql
-- Ver items sin estantería
SELECT code, name, "locationId", "shelfId" FROM items WHERE "shelfId" IS NULL;

-- Asignar ES-0001 a items específicos
UPDATE items 
SET "shelfId" = (SELECT id FROM shelves WHERE code = 'ES-0001') 
WHERE code = 'kf-0002';
```
