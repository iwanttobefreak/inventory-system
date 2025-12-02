# 🌐 Configuración de Nginx para Acceso Externo

Esta guía te explica cómo configurar nginx como proxy inverso para acceder al sistema desde cualquier dispositivo.

## 📋 Escenario

- **Dominio**: kairoframe.lobo99.info
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:3000
- **Nginx**: Hace proxy de ambos servicios

## 🔧 Configuración de Nginx

### 1. Crear archivo de configuración

```bash
# En tu servidor, crea el archivo de configuración
sudo nano /etc/nginx/sites-available/kairoframe-inventory
```

### 2. Copiar la configuración

Copia el contenido de `nginx.conf` en el nuevo archivo:

```nginx
server {
    listen 80;
    server_name kairoframe.lobo99.info;

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
    }
}
```

### 3. Habilitar el sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/kairoframe-inventory /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

## ✅ Verificar que funciona

### Desde tu Mac (local)

```bash
# Verificar backend
curl http://kairoframe.lobo99.info/health

# Debería responder:
# {"status":"ok","message":"Inventory API is running"}

# Verificar frontend
curl -I http://kairoframe.lobo99.info/

# Debería responder con HTTP/1.1 200 OK
```

### Desde el móvil

1. Abre Safari/Chrome en tu móvil
2. Ve a: **http://kairoframe.lobo99.info**
3. Debería cargar el login correctamente
4. Intenta hacer login con: `admin@productora.com` / `admin123`

## 🔐 Agregar HTTPS (Recomendado)

### Usar Let's Encrypt (Gratis)

```bash
# Instalar certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d kairoframe.lobo99.info

# Certbot configurará automáticamente nginx para HTTPS
```

Después de esto:
- HTTP (puerto 80) → Redirige a HTTPS
- HTTPS (puerto 443) → Sirve la aplicación de forma segura

## 🐛 Solución de Problemas

### Error: "502 Bad Gateway"

El backend o frontend no está corriendo:

```bash
# Verificar que los contenedores estén corriendo
docker-compose ps

# Debería mostrar:
# inventory_backend   Up
# inventory_frontend  Up
# inventory_db        Up
```

Si no están corriendo:

```bash
docker-compose up -d
```

### Error: "Connection refused" en móvil

1. **Verificar que nginx está corriendo:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Verificar firewall:**
   ```bash
   # En el servidor, asegúrate que el puerto 80 esté abierto
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Verificar DNS:**
   ```bash
   # Desde tu móvil o Mac
   ping kairoframe.lobo99.info
   
   # Debería responder con la IP de tu servidor
   ```

### Error: "CORS" o "blocked by CORS policy"

El backend ya tiene CORS habilitado (`Access-Control-Allow-Origin: *`), pero si tienes problemas:

```typescript
// En backend/src/server.ts, verificar que exista:
app.use(cors({
  origin: '*',
  credentials: true,
}));
```

### Login funciona en escritorio pero no en móvil

Ya está arreglado con la configuración actual:
- ✅ Frontend usa `/api` (ruta relativa)
- ✅ Nginx hace proxy de `/api/` → `http://localhost:4000/api/`
- ✅ Funciona en cualquier dispositivo

## 📱 Configuración para Desarrollo Local

Si quieres probar en local sin nginx (solo en tu red WiFi):

### Opción A: Usar IP local

1. **Obtén tu IP local:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Actualiza `.env.local`:**
   ```bash
   NEXT_PUBLIC_API_URL=http://TU_IP_LOCAL:4000/api
   ```

3. **Rebuild frontend:**
   ```bash
   docker-compose up -d --build frontend
   ```

4. **Accede desde móvil:**
   - http://TU_IP_LOCAL:3000

### Opción B: Usar nombre de red local

```bash
# En Mac, tu máquina debería ser accesible como:
http://NOMBRE-MAC.local:3000

# Ejemplo:
http://macbook-pro.local:3000
```

## 🎯 Configuración Actual

Con la configuración actual:

### En Producción (kairoframe.lobo99.info):
- ✅ Frontend: `NEXT_PUBLIC_API_URL=/api`
- ✅ Nginx hace proxy de todo
- ✅ Funciona en cualquier dispositivo

### En Desarrollo Local:
- ✅ Puedes usar `http://localhost:3000`
- ✅ Backend en `http://localhost:4000`
- ✅ Solo funciona en tu Mac

## 📊 Resumen de URLs

| Servicio | Local | Producción (Nginx) |
|----------|-------|-------------------|
| Frontend | http://localhost:3000 | http://kairoframe.lobo99.info |
| Backend API | http://localhost:4000/api | http://kairoframe.lobo99.info/api |
| Health Check | http://localhost:4000/health | http://kairoframe.lobo99.info/health |
| Base de Datos | localhost:5432 | localhost:5432 (solo interno) |

## 🚀 Comandos Rápidos

```bash
# Verificar nginx
sudo nginx -t
sudo systemctl status nginx

# Recargar nginx (después de cambios)
sudo systemctl reload nginx

# Ver logs de nginx
sudo tail -f /var/log/nginx/kairoframe-inventory-access.log
sudo tail -f /var/log/nginx/kairoframe-inventory-error.log

# Verificar desde terminal
curl http://kairoframe.lobo99.info/health
curl http://kairoframe.lobo99.info/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'
```

## ✅ Checklist Final

- [ ] Docker containers corriendo (`docker-compose ps`)
- [ ] Nginx configurado y corriendo
- [ ] DNS apuntando a tu servidor (kairoframe.lobo99.info)
- [ ] Firewall permite puertos 80 y 443
- [ ] Frontend rebuildeado con `NEXT_PUBLIC_API_URL=/api`
- [ ] Probar desde móvil en la misma red WiFi
- [ ] (Opcional) SSL configurado con Let's Encrypt

---

💡 **Nota**: El frontend ya está rebuildeado con la configuración correcta (`/api`). Solo necesitas configurar nginx en tu servidor.
