# 📱 Guía: Probar Mensaje de Contacto para Artículos Perdidos

## 🎯 Propósito del Mensaje

El mensaje de contacto **solo aparece cuando NO estás logado**. Esto es porque:

- **Logado** = Eres de la empresa → Puedes ver/gestionar el inventario
- **NO Logado** = Has encontrado un artículo perdido → Necesitas contactar para devolverlo

## 🧪 Cómo Probar el Mensaje (Sin Estar Logado)

### Opción 1: Modo Incógnito / Privado

1. Abre tu navegador en **Modo Incógnito** (Chrome/Edge) o **Ventana Privada** (Firefox/Safari)
   - Chrome/Edge: `Cmd + Shift + N` (Mac) o `Ctrl + Shift + N` (Windows)
   - Firefox: `Cmd + Shift + P` (Mac) o `Ctrl + Shift + P` (Windows)
   - Safari: `Cmd + Shift + N`

2. Ve a: `http://localhost:3000/kf-0001` (o cualquier código de item existente)

3. **Verás el mensaje al final de la página:**
   ```
   📦
   ¿Has encontrado este artículo?
   
   Si has encontrado este artículo es porque lo he perdido.
   Por favor, ponte en contacto conmigo para recuperarlo.
   
   📱 Móvil: +34 630 824 788
   📧 Email: hola@kairoframe.com
   
   ¡Muchas gracias!
   ```

### Opción 2: Cerrar Sesión

1. Si estás logado en `http://localhost:3000`, cierra sesión
2. Ve a cualquier URL de item directamente: `http://localhost:3000/kf-0001`
3. Verás el mensaje de contacto

### Opción 3: Borrar el Local Storage

1. Abre las **DevTools** del navegador (F12)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. Busca **Local Storage** → `http://localhost:3000`
4. Borra la clave `auth-storage`
5. Recarga la página
6. Verás el mensaje de contacto

## 📋 Verificación Visual

### Cuando ESTÁS LOGADO (trabajas en la empresa):
```
✅ Botones: "← Volver al Dashboard", "✏️ Editar", "🗑️ Eliminar"
✅ Puedes ver toda la información del item
❌ NO ves el mensaje de contacto
```

### Cuando NO ESTÁS LOGADO (encontraste el artículo):
```
❌ No hay botones de edición/eliminación
✅ Ves la información básica del item
✅ VES el mensaje de contacto al final de la página
```

## 🔍 Caso de Uso Real

**Escenario:**
1. Pierdes un cable XLR en una producción
2. Alguien lo encuentra y escanea el código QR
3. Se abre la página: `https://kairoframe.lobo99.info/kf-0004`
4. La persona **NO está logada** (es un tercero)
5. Ve toda la información del cable Y el mensaje de contacto
6. Puede llamar al +34 630 824 788 o escribir a hola@kairoframe.com
7. ¡Recuperas tu equipo! 🎉

## 🛠️ Troubleshooting

### "No veo el mensaje de contacto"
- **Causa:** Estás logado en la aplicación
- **Solución:** Usa modo incógnito o cierra sesión

### "Veo el mensaje pero estoy logado"
- **Causa:** El navegador tiene caché antiguo
- **Solución:** Fuerza un refresh con `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows)

### "El QR no abre la página"
- **Causa:** El servidor no está accesible públicamente
- **Solución:** Para producción, necesitas configurar el dominio público (ej: kairoframe.lobo99.info)

## 🌐 Para Producción

Cuando despligues en producción:

1. **Actualiza las URLs** en el código QR para que apunten a tu dominio:
   ```
   https://tudominio.com/kf-0001
   ```

2. **Verifica que el mensaje tiene tus datos de contacto:**
   - Móvil: +34 630 824 788 ✅
   - Email: hola@kairoframe.com ✅

3. **Prueba el flujo completo:**
   - Genera QR de un item
   - Escanea con tu móvil (sin estar logado)
   - Verifica que aparece el mensaje
   - Prueba que los enlaces de teléfono y email funcionan

## 📊 Resumen de Estados

| Estado Usuario | Botones Admin | Mensaje Contacto | Uso |
|---------------|---------------|------------------|-----|
| **Logado** | ✅ Sí | ❌ No | Gestión de inventario |
| **NO Logado** | ❌ No | ✅ Sí | Devolución de artículos perdidos |

---

**¡Listo!** Ahora el mensaje de contacto funciona correctamente solo para usuarios no autenticados. 🎉
