# Guía de Atributos Personalizados

## 🎯 ¿Qué son los atributos personalizados?

Los atributos personalizados te permiten definir campos específicos para cada categoría de equipos. Por ejemplo:

- **Cables**: Tipo de conector, longitud
- **Cámaras**: Sensor, resolución, formato de grabación
- **Audio**: Patrón polar, impedancia, tipo de conector

## 📝 Tipos de Atributos Disponibles

### 1. TEXT (Texto)
Texto libre para cualquier tipo de información.
- **Ejemplo**: Modelo, número de serie, notas

### 2. NUMBER (Número)
Valores numéricos.
- **Ejemplo**: Longitud (metros), peso (kg), potencia (watts)

### 3. SELECT (Lista Desplegable)
Lista de opciones predefinidas separadas por comas.
- **Ejemplo**: 
  - Tipo de conector: `XLR-XLR,XLR-JACK,JACK-JACK`
  - Estado: `Nuevo,Usado,Requiere Mantenimiento`

### 4. DATE (Fecha)
Para fechas específicas.
- **Ejemplo**: Fecha de calibración, fecha de última revisión

### 5. BOOLEAN (Sí/No)
Valores verdadero/falso.
- **Ejemplo**: ¿Tiene estuche?, ¿Requiere calibración?

## 🔧 Cómo Crear Atributos

### Desde la Interfaz Web

1. Ve a **http://localhost:3000/admin**
2. Busca la categoría donde quieres agregar atributos
3. Haz clic en **"Ver/Editar Atributos"**
4. Haz clic en **"+ Nuevo Atributo"**
5. Completa el formulario:
   - **Nombre**: Nombre descriptivo (ej: "Tipo de Conector")
   - **Clave**: Se genera automáticamente (ej: "tipo_conector")
   - **Tipo**: Selecciona el tipo de dato
   - **Opciones**: Solo para SELECT, lista separada por comas
   - **Obligatorio**: Marca si el campo es requerido
   - **Orden**: Número para ordenar los atributos (1, 2, 3...)
6. Haz clic en **"Guardar"**

### Ejemplo: Atributos para Cables

```
Atributo 1:
- Nombre: Tipo de Conector
- Tipo: SELECT
- Opciones: XLR-XLR,XLR-JACK,JACK-JACK,USB-C,HDMI
- Obligatorio: ✅
- Orden: 1

Atributo 2:
- Nombre: Longitud
- Tipo: TEXT
- Opciones: (vacío)
- Obligatorio: ❌
- Orden: 2

Atributo 3:
- Nombre: Color
- Tipo: SELECT
- Opciones: Negro,Azul,Rojo,Blanco
- Obligatorio: ❌
- Orden: 3
```

## 📊 Cómo se Usan los Atributos

Una vez que defines atributos para una categoría:

1. **Al crear un nuevo item** de esa categoría, aparecerán automáticamente los campos personalizados
2. **Al editar un item**, podrás modificar los valores de los atributos
3. **Al ver un item**, se mostrarán los atributos con sus valores

Los atributos se guardan en formato JSON en la base de datos, lo que permite flexibilidad total.

## 🔍 Ejemplos de Uso

### Categoría: Cámaras
- **Sensor**: TEXT - "Full Frame", "APS-C", "Micro 4/3"
- **Resolución**: SELECT - "4K,6K,8K"
- **Formato de Grabación**: SELECT - "ProRes,H.264,H.265,RAW"
- **Estabilización**: BOOLEAN - Sí/No

### Categoría: Micrófonos
- **Patrón Polar**: SELECT - "Cardioide,Supercardioide,Omnidireccional,Figura 8"
- **Tipo de Conector**: SELECT - "XLR,Jack 6.35mm,Mini Jack"
- **Requiere Phantom Power**: BOOLEAN - Sí/No
- **Impedancia**: NUMBER - En ohmios

### Categoría: Iluminación
- **Potencia**: NUMBER - En watts
- **Temperatura de Color**: TEXT - "3200K", "5600K", etc.
- **Tipo de Luz**: SELECT - "LED,Tungsteno,Fluorescente"
- **Dimeable**: BOOLEAN - Sí/No

## 🛠️ Gestión de Atributos

### Editar Atributos
1. Ve a la categoría en **/admin**
2. Expande los atributos
3. Haz clic en el botón de editar (✏️)
4. Modifica los campos necesarios
5. Guarda los cambios

### Eliminar Atributos
1. Ve a la categoría en **/admin**
2. Expande los atributos
3. Haz clic en el botón de eliminar (🗑️)
4. Confirma la eliminación

**⚠️ Nota**: Eliminar un atributo no elimina los datos guardados en los items existentes, pero el campo ya no aparecerá en el formulario.

## 📋 Mejores Prácticas

1. **Nombres Descriptivos**: Usa nombres claros y descriptivos para los atributos
2. **Orden Lógico**: Numera los atributos en el orden que quieres que aparezcan (1, 2, 3...)
3. **Opciones SELECT**: Para listas desplegables, separa las opciones con comas
4. **Campos Obligatorios**: Marca como obligatorios solo los campos realmente necesarios
5. **Consistencia**: Mantén nombres y formatos consistentes entre categorías similares

## 🐛 Solución de Problemas

### Error "Internal server error" al crear atributos
**Solución**: Ya fue corregido. Las columnas `createdAt` y `updatedAt` faltaban en la tabla. Si sigues teniendo el error:

```bash
# Verificar que la tabla tenga las columnas
docker exec inventory_db psql -U inventory_user -d inventory_db -c "\d category_attributes"

# Si faltan, agregar manualmente:
docker exec inventory_db psql -U inventory_user -d inventory_db -c "ALTER TABLE category_attributes ADD COLUMN IF NOT EXISTS \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;"
docker exec inventory_db psql -U inventory_user -d inventory_db -c "ALTER TABLE category_attributes ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;"
```

### Los atributos no aparecen al crear items
**Solución**: Recarga la página o cierra sesión e inicia sesión nuevamente.

### No puedo eliminar un atributo
**Solución**: Solo puedes eliminar atributos si tienes permisos de administrador.

## 📚 Recursos Adicionales

- [Guía de Administración](./ADMIN_GUIDE.md)
- [Guía de Etiquetas](./LABELS_GUIDE.md)
- [Inicio Rápido](./QUICK_START.md)

## ✅ Estado Actual

- ✅ Crear atributos personalizados
- ✅ Editar atributos existentes
- ✅ Eliminar atributos
- ✅ Ordenar atributos
- ✅ 5 tipos de datos soportados
- ✅ Validación de campos obligatorios
- ✅ Opciones para listas desplegables

---

**Última actualización**: 2 de diciembre de 2025
