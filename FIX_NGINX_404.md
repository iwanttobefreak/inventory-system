# 🔧 Solución: Error 404 - Falta Configuración de Backend en Nginx

## ✅ Problema Identificado

**Error**: `Error del servidor: 404`

**Causa**: Nginx está redirigiendo correctamente al frontend (192.168.1.84:3000), pero cuando el frontend hace peticiones a `/api/auth/login`, nginx no sabe dónde encontrar el backend porque **falta la configuración del proxy para `/api/`**.

## 🎯 Configuración Actual vs Necesaria

### ❌ Lo que tienes ahora:
```nginx
server {
    # ...
    location / {
        proxy_pass http://192.168.1.84:3000;  # ✅ Frontend funciona
    }
    # ❌ FALTA la configuración del backend
}
```

### ✅ Lo que necesitas:
```nginx
server {
    # ...
    
    # Backend API (ESTO FALTA)
    location /api/ {
        proxy_pass http://192.168.1.84:4000/api/;
    }
    
    # Health check (ESTO FALTA)
    location /health {
        proxy_pass http://192.168.1.84:4000/health;
    }
    
    # Frontend (ya lo tienes)
    location / {
        proxy_pass http://192.168.1.84:3000;
    }
}
```

## 📝 Pasos para Arreglar

### 1. Conectarse al servidor donde está nginx

```bash
ssh usuario@kairoframe.lobo99.info
```

### 2. Editar la configuración de nginx

```bash
# Buscar el archivo de configuración actual
ls -la /etc/nginx/sites-enabled/

# Editar el archivo (ajusta el nombre según tu configuración)
sudo nano /etc/nginx/sites-enabled/kairoframe-inventory
# O si tiene otro nombre:
sudo nano /etc/nginx/sites-enabled/default
```

### 3. Agregar las líneas del backend

**Dentro del bloque `server { }` que tiene `server_name kairoframe.lobo99.info;`**, ANTES de la configuración de `location / { }`, agrega:

```nginx
    # ============================================
    # Backend API - AGREGA ESTO
    # ============================================
    location /api/ {
        proxy_pass http://192.168.1.84:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check - AGREGA ESTO TAMBIÉN
    location /health {
        proxy_pass http://192.168.1.84:4000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
```

### 4. Verificar que la configuración sea correcta

```bash
# Verificar sintaxis
sudo nginx -t

# Debería mostrar:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Recargar nginx

```bash
sudo systemctl reload nginx

# O si no funciona:
sudo systemctl restart nginx
```

### 6. Verificar que funcione

```bash
# Desde el servidor, prueba el health check
curl http://localhost/health

# Debería responder (puede tardar un poco):
# {"status":"ok","message":"Inventory API is running"}

# Prueba el login
curl -X POST https://kairoframe.lobo99.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'

# Debería devolver un token
```

## 📄 Configuración Completa de Referencia

He creado el archivo `nginx-config-for-server.conf` con la configuración completa incluyendo:
- ✅ SSL/HTTPS
- ✅ Proxy al backend (192.168.1.84:4000)
- ✅ Proxy al frontend (192.168.1.84:3000)
- ✅ Health check
- ✅ Headers correctos
- ✅ Timeouts adecuados

Puedes usarlo como referencia o copiarlo completo (ajustando las rutas de los certificados SSL).

## 🧪 Pruebas después de Aplicar

### Desde el servidor:

```bash
# 1. Health check
curl http://localhost/health

# 2. Login API
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'
```

### Desde tu móvil:

1. Abre https://kairoframe.lobo99.info
2. Haz click en "🔧 Info de Debug" - debería seguir mostrando:
   - API URL: `/api` ✅
   - Window Location: `https://kairoframe.lobo99.info/login` ✅
3. Intenta hacer login con:
   - Email: `admin@productora.com`
   - Password: `admin123`
4. **¡Debería funcionar!** 🎉

## 🐛 Si Sigue Sin Funcionar

### Verificar que tu Mac sea accesible desde el servidor

```bash
# Desde el servidor, verifica conexión a tu Mac
ping 192.168.1.84

# Verifica que puedas acceder al backend
curl http://192.168.1.84:4000/health

# Verifica que puedas acceder al frontend
curl http://192.168.1.84:3000
```

**Si no puede conectar:**
- Verifica que tu Mac y el servidor estén en la misma red
- Verifica el firewall de tu Mac (System Preferences → Security & Privacy → Firewall)
- Asegúrate de que docker esté corriendo en tu Mac: `docker-compose ps`

### Ver logs de nginx en tiempo real

```bash
# Terminal 1: Access log
sudo tail -f /var/log/nginx/kairoframe-inventory-access.log

# Terminal 2: Error log
sudo tail -f /var/log/nginx/kairoframe-inventory-error.log

# Luego intenta hacer login desde el móvil y observa los logs
```

## 📊 Resumen del Flujo

### Antes (❌ Error 404):
```
Móvil → nginx → 192.168.1.84:3000 (frontend) ✅
Móvil → nginx → /api/auth/login → ❌ 404 (no configurado)
```

### Después (✅ Funciona):
```
Móvil → nginx → 192.168.1.84:3000 (frontend) ✅
Móvil → nginx → /api/auth/login → 192.168.1.84:4000/api/auth/login ✅
```

## 🎯 Comandos Resumidos

```bash
# 1. SSH al servidor
ssh usuario@kairoframe.lobo99.info

# 2. Editar nginx
sudo nano /etc/nginx/sites-enabled/kairoframe-inventory

# 3. Agregar configuración del backend (ver arriba)

# 4. Verificar
sudo nginx -t

# 5. Recargar
sudo systemctl reload nginx

# 6. Probar
curl http://localhost/health
```

## ✅ Checklist

- [ ] SSH al servidor nginx
- [ ] Abrir archivo de configuración de nginx
- [ ] Agregar bloque `location /api/` con proxy a 192.168.1.84:4000
- [ ] Agregar bloque `location /health` con proxy a 192.168.1.84:4000
- [ ] Verificar sintaxis: `sudo nginx -t`
- [ ] Recargar nginx: `sudo systemctl reload nginx`
- [ ] Probar health check: `curl http://localhost/health`
- [ ] Probar desde móvil: login en https://kairoframe.lobo99.info

---

💡 **Nota**: Esta configuración funciona mientras tu Mac (192.168.1.84) esté en la misma red que el servidor y docker esté corriendo. Para producción permanente, considera mover los contenedores al propio servidor.

¿Necesitas ayuda con algún paso? 🚀
