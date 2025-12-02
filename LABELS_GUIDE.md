# 🏷️ Generador de Etiquetas - Guía de Uso

## 📋 Descripción

El generador de etiquetas permite crear pegatinas profesionales con:
- ✅ Logo de Kairoframe (oficial)
- ✅ Código QR funcional
- ✅ Código de identificación (kf-XXXX)
- ✅ Formatos predefinidos y personalizados
- ✅ Múltiples rangos en una sola hoja

---

## 🎯 Acceso

**Desde el Dashboard:**
```
Dashboard → Botón "🏷️ Generar Etiquetas"
```

**URL Directa:**
```
https://kairoframe.lobo99.info/labels
```

---

## 📐 Tamaños Disponibles

### Tamaños Predefinidos

| Nombre | Dimensiones | Uso Recomendado |
|--------|-------------|-----------------|
| Pequeña | 6cm x 2cm | Cables, accesorios pequeños |
| Mediana | 7cm x 2.5cm | Micrófonos, baterías, discos |
| Grande | 8cm x 3cm | Cámaras, luces, trípodes |
| Cuadrada | 5cm x 3cm | Cajas de transporte |
| Personalizado | A tu medida | Cualquier otro equipo |

### Distribución de la Etiqueta

```
┌─────────────────────────────────────────┐
│                                         │
│  [LOGO]    KF-0001      [QR CODE]      │
│   35%        30%           35%          │
│                                         │
└─────────────────────────────────────────┘
```

**Elementos:**
1. **Logo Kairoframe** (35% - Izquierda)
   - Logo oficial descargado de kairoframe.com
   - Mantiene proporciones originales
   - Margen de 2mm

2. **Código de Identificación** (30% - Centro)
   - Formato: KF-XXXX (mayúsculas en etiqueta)
   - Fuente Helvetica Bold
   - Tamaño proporcional al alto de etiqueta

3. **Código QR** (35% - Derecha)
   - URL: `https://kairoframe.lobo99.info/kf-XXXX`
   - Tamaño proporcional al alto de etiqueta
   - Margen de 1px interno para mejor escaneo

---

## 🔢 Formatos de Rangos

### Ejemplos de Entrada

| Input | Resultado | Total | Descripción |
|-------|-----------|-------|-------------|
| `1-50` | kf-0001 a kf-0050 | 50 | Rango simple |
| `1-10` | kf-0001 a kf-0010 | 10 | Primeras 10 etiquetas |
| `1,5,10,25` | kf-0001, kf-0005, kf-0010, kf-0025 | 4 | Códigos específicos |
| `1-10,40-77` | kf-0001 a kf-0010, kf-0040 a kf-0077 | 48 | Múltiples rangos |
| `1-10,40-77,91,102,205` | Combinación de todo | 51 | Rangos + específicos |
| `100-199` | kf-0100 a kf-0199 | 100 | Centena completa |

### Sintaxis

```
Rango:      INICIO-FIN         Ej: 1-50
Específico: NUMERO             Ej: 91
Múltiple:   RANGO,RANGO,...    Ej: 1-10,40-77
Mixto:      RANGO,NUM,RANGO    Ej: 1-10,25,40-50
```

---

## 🖨️ Proceso de Impresión

### 1. Configuración

1. Selecciona el tamaño de etiqueta
2. Ingresa los códigos a generar (ej: `1-50`)
3. Revisa el preview en tiempo real
4. Click en "📄 Generar PDF"

### 2. Descarga

El PDF se descarga automáticamente con el nombre:
```
etiquetas-kairoframe-kf-0001-kf-0050.pdf
```

### 3. Impresión

**Configuración de Impresora:**
```
✅ Papel: Adhesivo de alta calidad (recomendado: papel fotográfico adhesivo)
✅ Calidad: Máxima/Best
✅ Escala: 100% (sin ajustar al tamaño de página)
✅ Márgenes: Sin márgenes o mínimos
✅ Orientación: Retrato (vertical)
```

**Impresoras Recomendadas:**
- Brother QL-series (etiquetas)
- Dymo LabelWriter 4XL
- Zebra ZD410
- Cualquier impresora láser/inkjet con papel adhesivo A4

### 4. Aplicación

1. Recorta siguiendo las líneas grises (guías de corte)
2. Limpia la superficie del equipo
3. Pega la etiqueta en lugar visible
4. Presiona firmemente para asegurar adherencia

---

## 💡 Casos de Uso

### Caso 1: Inventario Inicial
```
Objetivo: Etiquetar todos los equipos existentes
Rangos: 1-100
Total: 100 etiquetas
Tiempo: ~5 minutos generar + imprimir
```

### Caso 2: Nuevos Equipos
```
Objetivo: Añadir 10 equipos nuevos
Rangos: 101-110
Total: 10 etiquetas
```

### Caso 3: Reemplazar Etiquetas Dañadas
```
Objetivo: Reimprimir etiquetas específicas
Rangos: 5,23,47,89
Total: 4 etiquetas
```

### Caso 4: Reorganización por Categorías
```
Objetivo: Etiquetas para nueva categoría (cámaras)
Rangos: 200-299
Total: 100 etiquetas reservadas
```

### Caso 5: Múltiples Hojas
```
Objetivo: Preparar varias hojas diferentes
Hoja 1: 1-50 (cámaras y audio)
Hoja 2: 51-100 (iluminación)
Hoja 3: 101-150 (cables y accesorios)
```

---

## 📊 Cálculo de Etiquetas por Hoja

### Hoja A4 (210mm x 297mm)

| Tamaño Etiqueta | Por Fila | Por Columna | Total/Hoja |
|-----------------|----------|-------------|------------|
| 6cm x 2cm | 3 | 14 | 42 |
| 7cm x 2.5cm | 2 | 11 | 22 |
| 8cm x 3cm | 2 | 9 | 18 |
| 5cm x 3cm | 4 | 9 | 36 |

**Nota:** Los márgenes de 10mm se aplican automáticamente.

---

## 🎨 Personalización Avanzada

### Tamaño Personalizado

Para crear etiquetas con dimensiones específicas:

1. Selecciona "Personalizado" en el menú
2. Ingresa:
   - **Ancho:** 20-200mm
   - **Alto:** 10-100mm
3. El sistema ajusta automáticamente logo, código y QR

**Recomendaciones:**
- Mínimo: 40mm x 15mm (para QR legible)
- Máximo: 200mm x 100mm
- Proporción ideal: 3:1 (ancho:alto)

---

## 🔧 Solución de Problemas

### QR Code No Escanea

**Causas:**
- Impresión de baja calidad
- QR muy pequeño
- Superficie reflectante

**Soluciones:**
- Usar papel mate (no brillante)
- Tamaño mínimo de etiqueta: 5cm x 2cm
- Imprimir a máxima calidad
- Evitar arrugas o dobleces

### Logo Pixelado

**Causa:**
- Escala incorrecta al imprimir

**Solución:**
- Configurar impresora a 100% sin ajustar
- Usar papel de alta calidad
- Modo de impresión: Foto/Máxima

### Etiquetas No Se Pegan

**Causa:**
- Papel adhesivo de baja calidad
- Superficie sucia o rugosa

**Solución:**
- Usar papel adhesivo permanente profesional
- Limpiar superficie con alcohol isopropílico
- Aplicar presión firme durante 10 segundos

### PDF con Etiquetas Desalineadas

**Causa:**
- Márgenes automáticos de la impresora

**Solución:**
- Desactivar "Ajustar al área imprimible"
- Configurar márgenes mínimos o cero
- Vista previa antes de imprimir

---

## 📁 Organización Recomendada

### Sistema de Numeración

```
0001-0099   → Cámaras y lentes
0100-0199   → Audio (micrófonos, grabadoras)
0200-0299   → Iluminación
0300-0399   → Trípodes y soportes
0400-0499   → Cables y conectores
0500-0599   → Almacenamiento (tarjetas, discos)
0600-0699   → Accesorios
0700-0799   → Equipos de streaming
0800-0899   → Postproducción (monitores, etc.)
0900-0999   → Reserva/Otros
1000+       → Expansión futura
```

### Hojas de Etiquetas

**Preparar por adelantado:**
```
Hoja 1: Cámaras (1-50)
Hoja 2: Audio (100-150)
Hoja 3: Iluminación (200-250)
...
```

**Ventajas:**
- Etiquetas siempre disponibles
- Asignación inmediata a equipos nuevos
- No esperar a imprimir cada vez

---

## 🎯 Tips Profesionales

### 1. **Pre-Asignación de Códigos**
```
Imprime etiquetas antes de comprar equipos
→ Al llegar el equipo: pegar y escanear
→ Sistema ya muestra "kf-0XXX" listo para crear
```

### 2. **Doble Etiquetado**
```
Pegar 2 etiquetas en equipos grandes:
→ Una en el cuerpo principal (visible)
→ Una en el estuche/maleta (por si se separan)
```

### 3. **Etiquetas de Reemplazo**
```
Imprimir 10-20% extra de cada rango
→ Guardar para reemplazar dañadas
→ Evita reimprimir hojas completas
```

### 4. **Protección de Etiquetas**
```
En equipos de uso intenso:
→ Aplicar cinta transparente sobre etiqueta
→ O usar laminado adhesivo transparente
→ Protege contra roces y humedad
```

### 5. **Testing de QR**
```
Antes de aplicar masivamente:
→ Imprimir 1 etiqueta de prueba
→ Escanear con varios dispositivos móviles
→ Verificar URL correcta
→ Comprobar legibilidad
```

---

## 📱 Escaneo de Etiquetas

Después de pegar las etiquetas:

1. **Abrir el scanner** en el móvil
2. **Apuntar a la etiqueta** (QR derecha)
3. **Escaneo automático** detecta el código
4. **Redirige** a `/kf-XXXX`
5. **Si existe:** Muestra información del equipo
6. **Si no existe:** Muestra formulario para crearlo

---

## 🔄 Actualización de Etiquetas

### ¿Cuándo Reemplazar?

- ✅ Etiqueta dañada o ilegible
- ✅ QR no escanea correctamente
- ✅ Logo despegado o arrugado
- ✅ Cambio de código (reorganización)

### Proceso:

1. **Generar** nueva etiqueta con mismo código
2. **Quitar** etiqueta antigua (con cuidado)
3. **Limpiar** superficie con alcohol
4. **Aplicar** nueva etiqueta
5. **Verificar** escaneo del QR

---

## 💾 Guardar PDFs Generados

**Recomendación:**
```
Crear carpeta: /Etiquetas-Kairoframe/
├── 2025-12-01-kf-0001-0050.pdf
├── 2025-12-01-kf-0100-0150.pdf
├── 2025-12-15-kf-0051-0075.pdf
└── REEMPLAZOS/
    ├── kf-0023.pdf
    └── kf-0047.pdf
```

**Ventajas:**
- Historial de etiquetas generadas
- Fácil reimprimir si es necesario
- Registro de fechas

---

## 📈 Estadísticas

**Tiempo Estimado:**
```
Configurar: ~2 minutos
Generar PDF: ~5 segundos
Imprimir (50 etiquetas): ~5 minutos
Aplicar por etiqueta: ~1 minuto
Total (50 equipos): ~1 hora
```

**Costos Aproximados:**
```
Papel adhesivo A4 (100 hojas): 20-40€
Tinta/Tóner: 10-20€
Costo por etiqueta: 0.10-0.20€
```

---

## 🎉 ¡Listo!

El generador de etiquetas está completamente integrado en el sistema.

**Accede ahora:** https://kairoframe.lobo99.info/labels

**Requerimientos:**
- ✅ Estar autenticado
- ✅ Navegador moderno (Chrome, Safari, Firefox)
- ✅ Impresora con papel adhesivo

---

**Actualizado:** 1 de diciembre de 2025
**Versión:** 1.0.0
**Estado:** ✅ Funcionando

**Logo:** Descargado oficialmente de kairoframe.com
**Formato QR:** `https://kairoframe.lobo99.info/kf-XXXX`
