# 🚀 Solución: Login desde Móvil

## ❌ Problema Identificado

El error "error al iniciar sesión" desde el móvil ocurre porque:
- El frontend intentaba conectarse a `http://localhost:4000/api`
- En el móvil, `localhost` apunta al propio dispositivo móvil, no a tu servidor
- Por eso fallaba la conexión

## ✅ Solución Implementada

He configurado el frontend para usar **rutas relativas** (`/api`) que funcionan con tu nginx:

```
Móvil/Browser → http://kairoframe.lobo99.info/api/auth/login
                     ↓
                Nginx (proxy inverso)
                     ↓
                Backend: http://localhost:4000/api/auth/login
```

## 📝 Estado Actual

### ✅ Completado en tu Mac:
1. Frontend reconstruido con `NEXT_PUBLIC_API_URL=/api`
2. Backend funcionando correctamente
3. Base de datos operativa
4. Todos los contenedores corriendo

### 📋 Pendiente en tu servidor:

Ya tienes nginx configurado porque el script detectó:
- ✅ DNS resuelve: kairoframe.lobo99.info → 87.217.220.109
- ✅ Nginx corriendo (responde con 301 redirect HTTP → HTTPS)

**Esto significa que tu nginx YA está redirigiendo HTTP a HTTPS**, lo cual es perfecto para seguridad.

## 🔧 Configuración de Nginx (Si necesitas actualizarla)

Tu nginx debe tener algo similar a esto (probablemente ya lo tienes):

```nginx
server {
    listen 443 ssl http2;
    server_name kairoframe.lobo99.info;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/kairoframe.lobo99.info/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kairoframe.lobo99.info/privkey.pem;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000/health;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}

# Redirección HTTP → HTTPS
server {
    listen 80;
    server_name kairoframe.lobo99.info;
    return 301 https://$server_name$request_uri;
}
```

## 🎯 Pasos para Activar en el Servidor

### 1. Subir el código al servidor

```bash
# Desde tu Mac, sube los archivos actualizados
# (Usa git, rsync, scp, o el método que prefieras)

# Ejemplo con rsync:
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /Users/T054810/copilot/pruebas/kairo/inventory-system/ \
  usuario@kairoframe.lobo99.info:/ruta/al/proyecto/
```

### 2. En el servidor, rebuild el frontend

```bash
# SSH al servidor
ssh usuario@kairoframe.lobo99.info

# Ir al directorio del proyecto
cd /ruta/al/proyecto/inventory-system

# Reconstruir solo el frontend (el backend no necesita cambios)
docker-compose up -d --build frontend

# Esperar unos segundos
sleep 10

# Verificar que esté corriendo
docker-compose ps
```

### 3. Verificar que nginx esté configurado

```bash
# Ver configuración actual de nginx
sudo nginx -t

# Si hay errores, consulta NGINX_SETUP.md y nginx.conf

# Recargar nginx (si hiciste cambios)
sudo systemctl reload nginx
```

### 4. Probar desde el móvil

1. Abre Safari/Chrome en tu móvil
2. Ve a: **https://kairoframe.lobo99.info** (usa HTTPS, no HTTP)
3. Intenta hacer login:
   - Email: `admin@productora.com`
   - Password: `admin123`

## 🧪 Verificación Rápida

### Desde tu servidor (SSH):

```bash
# Verificar que el frontend esté usando la configuración correcta
docker-compose exec frontend env | grep API_URL
# Debería mostrar: NEXT_PUBLIC_API_URL=/api

# Probar login localmente
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'
# Debería devolver un token

# Verificar que nginx está proxying correctamente
curl https://kairoframe.lobo99.info/health
# Debería devolver: {"status":"ok","message":"Inventory API is running"}
```

### Desde tu móvil:

Abre el navegador y ve a: https://kairoframe.lobo99.info

Deberías poder:
- ✅ Ver la página de login claramente
- ✅ Escribir en los campos (texto visible en negro)
- ✅ Hacer login exitosamente
- ✅ Ver el dashboard con el inventario

## 🐛 Si Aún No Funciona

### Error: "Network Error" o "Failed to fetch"

**Causa**: Nginx no está proxying correctamente

**Solución**:
```bash
# En el servidor, verificar logs de nginx
sudo tail -f /var/log/nginx/error.log

# Verificar que los contenedores estén corriendo
docker-compose ps

# Verificar que nginx puede conectar a localhost:4000 y localhost:3000
curl http://localhost:4000/health
curl http://localhost:3000
```

### Error: "CORS policy"

**Causa**: El backend no está permitiendo requests desde tu dominio

**Solución**: Ya está configurado con CORS `*`, pero si hay problemas:
```bash
# Verificar logs del backend
docker-compose logs backend | grep -i cors

# El backend ya tiene CORS habilitado en server.ts
```

### Error: Certificado SSL inválido

**Causa**: El certificado SSL expiró o no está configurado

**Solución**:
```bash
# Renovar certificado Let's Encrypt
sudo certbot renew --nginx
sudo systemctl reload nginx
```

## 📊 Resumen de Cambios

### Archivos Modificados:
1. ✅ `frontend/.env.local` → Cambiado a `/api`
2. ✅ `frontend/lib/api.ts` → Añadido Content-Type header
3. ✅ `frontend/app/login/page.tsx` → Mejorados estilos para móvil

### Archivos Creados:
1. 📄 `nginx.conf` → Configuración de referencia para nginx
2. 📄 `NGINX_SETUP.md` → Guía completa de configuración
3. 📄 `verify-setup.sh` → Script de verificación automática
4. 📄 `MOBILE_FIX.md` → Este archivo con la solución

### Comandos Importantes:
```bash
# Rebuild frontend (en el servidor)
docker-compose up -d --build frontend

# Verificar estado
docker-compose ps
curl https://kairoframe.lobo99.info/health

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## ✅ Checklist Final

- [x] Frontend configurado con `/api`
- [x] Frontend rebuildeado
- [x] Estilos de login arreglados para móvil
- [ ] Código subido al servidor
- [ ] Frontend rebuildeado en el servidor
- [ ] Nginx configurado correctamente
- [ ] Probado desde móvil con HTTPS

---

💡 **Nota Importante**: Usa **HTTPS** (https://kairoframe.lobo99.info), no HTTP, ya que tu nginx está redirigiendo automáticamente.

🎉 Una vez hayas rebuildeado el frontend en el servidor, deberías poder hacer login desde cualquier dispositivo!
