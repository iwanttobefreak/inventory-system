# 📱 Scanner de Códigos QR

## ✅ Scanner Implementado y Funcionando

El scanner de códigos QR está ahora disponible en el sistema de inventario.

---

## 🎯 Cómo Usar el Scanner

### 1. Acceder al Scanner

Desde el dashboard, haz click en el botón **"📱 Escanear QR"**

O navega directamente a: `https://kairoframe.lobo99.info/scanner`

### 2. Permitir Acceso a la Cámara

La primera vez que uses el scanner, el navegador te pedirá permiso para acceder a la cámara:

**En móvil:**
- Safari (iOS): "Allow" cuando aparezca el mensaje
- Chrome (Android): "Allow" para permitir el acceso

**En desktop:**
- Chrome/Edge/Firefox: Click en "Permitir" en la barra de dirección

### 3. Escanear un QR

1. Apunta la cámara hacia el código QR del equipo
2. Mantén el QR dentro del marco cuadrado azul
3. Asegúrate de que haya buena iluminación
4. El scanner detectará automáticamente el código
5. Serás redirigido a la página del item

---

## 🔍 Características del Scanner

### ✨ Visual
- ✅ Marco de escaneo animado
- ✅ Línea de escaneo en movimiento
- ✅ Esquinas destacadas para guiar el enfoque
- ✅ Feedback visual inmediato

### 🚀 Funcionalidad
- ✅ Detección automática de QR codes
- ✅ Redirección automática al item escaneado
- ✅ Manejo de errores con mensajes claros
- ✅ Reintentar automáticamente si el QR no es válido
- ✅ Botón para cancelar y volver al dashboard

### 📱 Compatibilidad
- ✅ iOS (Safari, Chrome)
- ✅ Android (Chrome, Firefox, Samsung Browser)
- ✅ Desktop (Chrome, Edge, Firefox, Safari)

---

## 🎨 Pantallas del Scanner

### Pantalla Inicial
```
┌─────────────────────────────────┐
│ ← Escanear QR                  │
├─────────────────────────────────┤
│ 📸 Apunta la cámara hacia el    │
│    código QR del equipo          │
├─────────────────────────────────┤
│                                 │
│         [Video Cámara]          │
│                                 │
│          ┌─────────┐            │
│          │         │            │
│          │   QR    │  ← Marco   │
│          │         │            │
│          └─────────┘            │
│                                 │
├─────────────────────────────────┤
│ 💡 Consejos:                    │
│  • Mantén el QR dentro del marco│
│  • Buena iluminación            │
│  • Cámara estable               │
├─────────────────────────────────┤
│      [Cancelar]                 │
└─────────────────────────────────┘
```

### Pantalla de Éxito
```
┌─────────────────────────────────┐
│ ✅ QR escaneado correctamente   │
│                                 │
│ https://...lobo99.../items/CAM001│
│                                 │
│ Redirigiendo...                 │
└─────────────────────────────────┘
```

### Pantalla de Error
```
┌─────────────────────────────────┐
│ ⚠️ Error                         │
│                                 │
│ QR no válido. Debe ser un código│
│ de item del inventario.         │
│                                 │
│ Reintentando en 3 segundos...   │
└─────────────────────────────────┘
```

---

## 🔧 Solución de Problemas

### ❌ "Error al acceder a la cámara. Verifica los permisos"

**Causas posibles:**
1. No diste permiso al navegador
2. Los permisos fueron denegados previamente
3. La cámara está siendo usada por otra app

**Solución iOS (Safari):**
```
1. Ve a Ajustes → Safari → Cámara
2. Selecciona "Preguntar" o "Permitir"
3. Recarga la página
```

**Solución Android (Chrome):**
```
1. Ve a Configuración de Chrome
2. Configuración del sitio → Cámara
3. Encuentra kairoframe.lobo99.info
4. Permite el acceso
5. Recarga la página
```

**Solución Desktop:**
```
1. Click en el ícono de la cámara en la barra de dirección
2. Cambiar a "Permitir"
3. Recarga la página
```

### ❌ "QR no válido"

**Causas:**
- El QR no es del sistema de inventario
- El QR está dañado o mal impreso
- La URL del QR no tiene el formato correcto

**Solución:**
1. Asegúrate de escanear un QR generado por el sistema
2. Verifica que el QR esté bien impreso
3. Genera un nuevo QR desde la página del item

### ❌ El scanner no detecta el QR

**Causas:**
- Poca iluminación
- QR muy pequeño o muy grande
- Cámara desenfocada
- QR en ángulo

**Solución:**
1. Mejora la iluminación
2. Acerca o aleja la cámara hasta que el QR quepa en el marco
3. Mantén la cámara estable
4. Coloca el QR de frente a la cámara

### ❌ La cámara se ve negra

**Causas:**
- Permiso denegado
- Cámara en uso
- Navegador no compatible

**Solución:**
1. Revisa los permisos (ver arriba)
2. Cierra otras apps que usen la cámara
3. Usa un navegador compatible (Chrome, Safari, Firefox)

---

## 📊 Flujo Completo del Scanner

```
1. Usuario en Dashboard
   ↓
2. Click en "📱 Escanear QR"
   ↓
3. Navegador solicita permiso de cámara
   ↓
4. Usuario permite acceso
   ↓
5. Cámara se activa
   ↓
6. Usuario apunta al QR
   ↓
7. Scanner detecta el QR
   ↓
8. Extrae el código del item (ej: CAM001)
   ↓
9. Redirige a /items/CAM001
   ↓
10. Usuario ve la información del equipo
```

---

## 🎯 Formatos de QR Soportados

El scanner reconoce QR codes que contengan URLs en estos formatos:

```
✅ https://kairoframe.lobo99.info/items/CAM001
✅ http://kairoframe.lobo99.info/items/CAM001
✅ https://kairoframe.lobo99.info/items/MIC001
✅ http://localhost:3000/items/CAM001 (desarrollo)
```

El código del item puede ser cualquier combinación de:
- Letras mayúsculas (A-Z)
- Números (0-9)
- Ejemplos: CAM001, MIC001, LUZ001, CABLE001

---

## 💡 Consejos para Mejores Resultados

### Iluminación
- ✅ Luz natural o artificial brillante
- ✅ Evita reflejos en el QR
- ❌ No escanees a contraluz

### Distancia
- ✅ 10-30 cm de distancia
- ✅ El QR debe llenar el marco sin salirse
- ❌ No demasiado cerca (se desenfocan)
- ❌ No demasiado lejos (no se lee bien)

### Ángulo
- ✅ QR de frente a la cámara
- ✅ Paralelo a la pantalla
- ❌ Evita ángulos muy pronunciados

### Estabilidad
- ✅ Manos firmes o apoya el teléfono
- ✅ Espera medio segundo para que enfoque
- ❌ No muevas la cámara mientras escanea

---

## 🔐 Privacidad y Seguridad

### Permisos de Cámara
- ✅ Solo se usa dentro del scanner
- ✅ No se graban ni guardan imágenes
- ✅ Se desactiva al salir del scanner
- ✅ Puedes revocar el permiso cuando quieras

### Datos Escaneados
- ✅ Solo se usa para redireccionar
- ✅ No se envían a servidores externos
- ✅ Todo se procesa localmente en tu dispositivo

---

## 🚀 Características Futuras (Opcional)

- [ ] Historial de items escaneados
- [ ] Escaneo múltiple (varios QR seguidos)
- [ ] Modo linterna para ambientes oscuros
- [ ] Vibración al detectar QR
- [ ] Sonido de confirmación
- [ ] Zoom digital
- [ ] Cambiar entre cámara frontal/trasera
- [ ] Guardar favoritos de items escaneados

---

## 📱 Acceso Directo

### Desde el Dashboard
```
Dashboard → Botón "📱 Escanear QR"
```

### URL Directa
```
https://kairoframe.lobo99.info/scanner
```

### Desde el Menú (futuro)
```
Menú → Escanear → Scanner
```

---

## 🎉 ¡Listo para Usar!

El scanner está completamente funcional y listo para usar en:
- 📱 Tu móvil
- 💻 Tu desktop
- 🖥️ Tu tablet

Solo necesitas:
1. Acceder a https://kairoframe.lobo99.info
2. Hacer login
3. Click en "📱 Escanear QR"
4. Apuntar al QR del equipo

¡Y listo! 🎊

---

**Documentación**: Actualizada el 1 de diciembre de 2025
**Versión del Scanner**: 1.0.0
**Estado**: ✅ Funcionando
