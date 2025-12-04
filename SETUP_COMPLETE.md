# 📋 Resumen Final - Sistema de Upload de Imágenes + Configuración Nginx

## ✅ Lo que se ha completado

### 1. Sistema de Upload de Imágenes
**Backend** (`backend/src/routes/items.ts`):
- ✅ Configuración de Multer para subir imágenes
- ✅ Endpoint `POST /api/items/:code/image` - Subir imagen
- ✅ Endpoint `DELETE /api/items/:code/image` - Eliminar imagen
- ✅ Validaciones: máximo 5MB, tipos permitidos (JPEG, PNG, GIF, WEBP)
- ✅ Almacenamiento en `uploads/items/` con nombre `{code}-{timestamp}.ext`
- ✅ Limpieza automática de imagen anterior al subir nueva
- ✅ Middleware para servir archivos estáticos en `/uploads`

**Frontend** (`frontend/app/[code]/page.tsx` + `frontend/lib/api.ts`):
- ✅ Estados: `selectedImage`, `imagePreview`, `uploadingImage`
- ✅ Funciones: `handleImageSelect()` con validación y preview, `handleRemoveImage()`
- ✅ API client: `uploadImage(code, File)` y `deleteImage(code)`
- ✅ `handleSubmit()` actualizado para subir imagen después de crear/actualizar item
- ✅ UI drag & drop en formulario con preview
- ✅ Visualización de imagen en vista de detalle del item

### 2. Configuración de Nginx para Producción
- ✅ `nginx-kairoframe.conf` - Configuración completa de proxy reverso
- ✅ `setup-nginx.sh` - Script automático de instalación
- ✅ `TROUBLESHOOTING_404.md` - Guía de solución del error 404 en /api
- ✅ `DEPLOY_INSTRUCTIONS.md` - Instrucciones paso a paso para despliegue
- ✅ `.env.example` - Mejorado con comentarios claros sobre producción

### 3. Migración de Base de Datos
- ✅ Creada migración inicial: `20251204161920_init`
- ✅ Schema completo con todas las tablas: User, Category, Location, Item, etc.
- ✅ Seed funcionando correctamente con datos de ejemplo

## 🚀 Para desplegar en kairoframe.lobo99.info

### Paso 1: Actualizar el código en el servidor

```bash
# SSH al servidor
ssh usuario@kairoframe.lobo99.info

# Navegar al proyecto
cd /ruta/al/proyecto/inventory-system

# Hacer pull de los cambios
git pull origin develop

# O si no tienes git, subir los archivos manualmente con:
# rsync -avz ./ usuario@kairoframe.lobo99.info:/ruta/al/proyecto/inventory-system/
```

### Paso 2: Configurar las variables de entorno

```bash
# Editar .env
nano .env
```

**IMPORTANTE** - Tu `.env` debe tener:
```env
# Backend
BACKEND_PORT=4000
DATABASE_URL=postgresql://inventory_user:tu_password_segura@db:5432/inventory_db
JWT_SECRET=un_jwt_secret_muy_seguro_y_aleatorio_cambiar_esto
FRONTEND_URL=https://kairoframe.lobo99.info
NODE_ENV=production

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://kairoframe.lobo99.info

# Database
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=tu_password_segura
POSTGRES_DB=inventory_db
DB_PORT=5432
```

**CRÍTICO**:
- `NEXT_PUBLIC_API_URL=/api` ← Ruta relativa para usar con nginx
- `FRONTEND_URL=https://kairoframe.lobo99.info` ← Para CORS
- `NEXT_PUBLIC_SITE_URL=https://kairoframe.lobo99.info` ← Para QR codes

### Paso 3: Limpiar y reconstruir los contenedores

```bash
# Detener y eliminar contenedores y volúmenes
docker compose down -v

# Reconstruir y levantar todo
docker compose up -d --build

# Esperar 30 segundos para que se ejecute el seed

# Verificar que están corriendo
docker ps
```

Deberías ver 3 contenedores:
- `inventory_db` (puerto 5432)
- `inventory_backend` (puerto 4000)
- `inventory_frontend` (puerto 3000)

### Paso 4: Configurar Nginx

```bash
# Dar permisos al script
chmod +x setup-nginx.sh

# Ejecutar el script de configuración (como root)
sudo bash setup-nginx.sh
```

El script:
- Copia `nginx-kairoframe.conf` a `/etc/nginx/sites-available/kairoframe`
- Crea el symlink en `/etc/nginx/sites-enabled/`
- Detecta automáticamente los puertos de Docker
- Verifica la configuración de nginx
- Reinicia nginx

### Paso 5: Verificar que funciona

```bash
# Test local del backend
curl http://localhost:4000/health
# Debe responder: {"status":"ok","message":"Inventory API is running"}

# Test de la API a través de nginx
curl https://kairoframe.lobo99.info/api/auth/login
# Debe responder con error de método o pedir credenciales (no 404)

# Test completo del login
curl -X POST https://kairoframe.lobo99.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'
# Debe responder con un token JWT
```

## 🌐 Acceso al Sistema

URL: **https://kairoframe.lobo99.info**

Credenciales por defecto:
- **Email**: `admin@productora.com`
- **Password**: `admin123`

**⚠️ IMPORTANTE**: Cambia la contraseña del admin después de hacer login.

## 📸 Usar el Upload de Imágenes

1. **Crear un nuevo artículo**:
   - Click en "➕ Nuevo Item"
   - Rellena los datos del artículo
   - En el campo "📷 Imagen del artículo", arrastra una imagen o haz click
   - Verás un preview de la imagen
   - Click en "✅ Crear Item"
   - La imagen se sube automáticamente después de crear el item

2. **Editar un artículo existente**:
   - Busca el artículo en el dashboard
   - Click en el código del artículo
   - Click en "✏️ Editar"
   - Añade o cambia la imagen
   - Click en "💾 Guardar Cambios"

3. **Límites**:
   - Tamaño máximo: 5MB
   - Formatos permitidos: JPG, JPEG, PNG, GIF, WEBP

## 🔍 Troubleshooting

### Error 404 en /api/auth/login
**Causa**: Nginx no configurado o mal configurado.
**Solución**: Ejecuta `sudo bash setup-nginx.sh` y verifica con `sudo nginx -t`

### Error: "The table public.users does not exist"
**Causa**: Migraciones no ejecutadas.
**Solución**:
```bash
docker compose down -v
docker compose up -d
```

### Error: Connection refused
**Causa**: Contenedores no están corriendo.
**Solución**:
```bash
docker ps  # Verificar estado
docker compose restart
```

### Ver logs:
```bash
# Logs de nginx
sudo tail -f /var/log/nginx/error.log

# Logs del backend
docker logs inventory_backend -f

# Logs del frontend
docker logs inventory_frontend -f
```

## 📚 Documentación Adicional

- **TROUBLESHOOTING_404.md**: Guía detallada para solucionar error 404
- **DEPLOY_INSTRUCTIONS.md**: Instrucciones completas de despliegue
- **ENV_CONFIGURATION_GUIDE.md**: Guía de configuración de variables de entorno
- **nginx-kairoframe.conf**: Configuración de nginx comentada

## 🎯 Datos Precargados

El sistema viene con datos de ejemplo:

**Categorías** (7):
- 📹 Cámaras, 🎤 Audio, 💡 Iluminación, 🔌 Cables, 📐 Trípodes, 💾 Almacenamiento, 🔧 Accesorios

**Lugares** (6):
- 📦 Almacén, 🔧 Mantenimiento, 🎬 Plató, 🎛️ Control, 🔊 Sonido, 🥽 Sala VR

**Ubicaciones** (15):
- UB-0001 a UB-0015 distribuidas en los 6 lugares

**Items de ejemplo** (2):
- kf-0001: Sony A7S III (Almacén - UB-0001)
- kf-0002: Rode NTG3 (Sonido - UB-0012)

## ✨ Nuevas Funcionalidades Disponibles

1. **Sistema de Ubicaciones Jerárquico** ✅
   - Lugares principales (6)
   - Ubicaciones con códigos UB-XXXX (15)
   - Selectores en cascada en formularios

2. **Upload de Imágenes** ✅
   - Subir fotos de artículos
   - Preview antes de guardar
   - Validación automática
   - Eliminación de imágenes

3. **Gestión de Usuarios** ✅
   - Panel de administración
   - Crear/editar/eliminar usuarios
   - Control de roles

4. **Escáner QR** ✅
   - Escaneo desde móvil
   - Múltiples cámaras soportadas

## 🔐 Seguridad

- [ ] Cambiar `JWT_SECRET` en `.env` por un valor aleatorio seguro
- [ ] Cambiar contraseña de PostgreSQL
- [ ] Cambiar contraseña del admin después del primer login
- [ ] Configurar firewall para bloquear puertos 3000, 4000, 5432 desde externa
- [ ] Mantener solo puerto 443 (HTTPS) abierto

```bash
# Configurar firewall (opcional)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # Bloquear frontend directo
sudo ufw deny 4000/tcp   # Bloquear backend directo
sudo ufw deny 5432/tcp   # Bloquear PostgreSQL
sudo ufw enable
```

## 📞 Soporte

Si tienes problemas:
1. Lee `TROUBLESHOOTING_404.md`
2. Revisa los logs (nginx, docker)
3. Verifica que las variables de entorno estén correctas
4. Asegúrate de que los 3 contenedores están corriendo

---

**Última actualización**: 4 de diciembre de 2025
**Versión**: 2.0 - Con upload de imágenes y configuración nginx
