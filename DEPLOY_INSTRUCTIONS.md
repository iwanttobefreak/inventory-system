# 🚀 Instrucciones para Desplegar en kairoframe.lobo99.info

## Problema Actual
El error **404 en `/api/auth/login`** es porque **nginx no está configurado** para hacer proxy al backend.

## ✅ Solución (Ejecutar en el servidor)

### 1️⃣ Subir los nuevos archivos al servidor

Desde tu máquina local, sube estos archivos nuevos al servidor:

```bash
# Opción A: Con git (si tienes el repo configurado)
cd /ruta/en/servidor/inventory-system
git pull origin develop

# Opción B: Con rsync
rsync -avz nginx-kairoframe.conf setup-nginx.sh TROUBLESHOOTING_404.md usuario@kairoframe.lobo99.info:/ruta/al/proyecto/inventory-system/
```

Los archivos que necesitas:
- `nginx-kairoframe.conf` - Configuración de nginx
- `setup-nginx.sh` - Script automático de instalación
- `TROUBLESHOOTING_404.md` - Guía de troubleshooting
- `.env.example` - Actualizado con mejores comentarios

### 2️⃣ Verificar el archivo .env

**En el servidor**, verifica que tu `.env` tenga estos valores:

```bash
cd /ruta/al/proyecto/inventory-system
nano .env
```

Debe tener:
```env
# Backend
BACKEND_PORT=4000
DATABASE_URL=postgresql://inventory_user:tu_password@db:5432/inventory_db
JWT_SECRET=un_secret_muy_seguro_y_aleatorio
FRONTEND_URL=https://kairoframe.lobo99.info
NODE_ENV=production

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://kairoframe.lobo99.info
```

**CRÍTICO**: 
- `NEXT_PUBLIC_API_URL=/api` (NO `http://localhost:4000/api`)
- `FRONTEND_URL=https://kairoframe.lobo99.info` (para CORS)

### 3️⃣ Reconstruir y reiniciar los contenedores

Si cambiaste el `.env`:

```bash
docker compose down
docker compose up -d --build
```

Verifica que estén corriendo:
```bash
docker ps

# Deberías ver:
# inventory_frontend (puerto 3000)
# inventory_backend (puerto 4000)
# inventory_db (puerto 5432)
```

### 4️⃣ Configurar Nginx (OPCIÓN A: Automático)

```bash
# Dar permisos al script
chmod +x setup-nginx.sh

# Ejecutar el script (como root)
sudo bash setup-nginx.sh
```

El script hará todo automáticamente:
- ✅ Copia la configuración
- ✅ Detecta los puertos de Docker
- ✅ Verifica la configuración
- ✅ Reinicia nginx

### 4️⃣ Configurar Nginx (OPCIÓN B: Manual)

Si prefieres hacerlo manualmente:

```bash
# Copiar configuración
sudo cp nginx-kairoframe.conf /etc/nginx/sites-available/kairoframe

# Crear symlink
sudo ln -s /etc/nginx/sites-available/kairoframe /etc/nginx/sites-enabled/

# Eliminar default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar nginx
sudo systemctl restart nginx
```

### 5️⃣ Verificar que funciona

```bash
# Test local del backend
curl http://localhost:4000/api/health
# Debe responder: {"status":"ok","message":"Inventory API is running"}

# Test a través de nginx
curl https://kairoframe.lobo99.info/api/health
# Debe responder lo mismo

# Test del login
curl -X POST https://kairoframe.lobo99.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'
# Debe responder con un token JWT
```

### 6️⃣ Acceder desde el navegador

Abre: **https://kairoframe.lobo99.info**

Credenciales:
- Email: `admin@productora.com`
- Password: `admin123`

## 🔍 Si Sigue Sin Funcionar

### Ver logs de nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Ver logs del backend:
```bash
docker logs inventory_backend -f
```

### Ver guía completa:
```bash
cat TROUBLESHOOTING_404.md
```

## 📸 Nueva Funcionalidad - Upload de Imágenes

Una vez que esté funcionando, la nueva funcionalidad de **upload de imágenes** estará lista:

1. Al crear/editar un artículo, verás un campo para subir foto
2. Drag & drop o click para seleccionar imagen
3. Preview antes de guardar
4. Límite: 5MB, formatos: JPG, PNG, GIF, WEBP
5. Las imágenes se guardan en `uploads/items/` del backend
6. Se sirven vía nginx en `/uploads`

## 🎯 Resumen de Cambios Realizados

### Backend
- ✅ Endpoints de upload: POST/DELETE `/api/items/:code/image`
- ✅ Multer configurado para manejar imágenes
- ✅ Validación de tamaño (5MB) y tipo
- ✅ Limpieza automática de imágenes antiguas

### Frontend
- ✅ Campo de upload en formulario de items
- ✅ Preview de imagen antes de guardar
- ✅ Visualización de imagen en vista de detalle
- ✅ Validación client-side

### Infraestructura
- ✅ Configuración de nginx para proxy (`nginx-kairoframe.conf`)
- ✅ Script de instalación automática (`setup-nginx.sh`)
- ✅ Guía de troubleshooting (`TROUBLESHOOTING_404.md`)
- ✅ `.env.example` mejorado con instrucciones claras

## 📞 Soporte

Si necesitas ayuda adicional, proporciona:
1. `docker ps` - Estado de contenedores
2. `sudo nginx -t` - Validación de nginx
3. Logs de nginx y docker
4. Contenido del archivo `.env` (sin passwords)
