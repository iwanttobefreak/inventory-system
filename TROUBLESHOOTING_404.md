# 🔧 Guía de Solución de Problemas - Error 404 en /api

## Problema
Al acceder a `https://kairoframe.lobo99.info/api/auth/login` obtienes un **404 Not Found**.

## Causa
El proxy inverso de nginx no está configurado correctamente para redirigir las peticiones `/api/*` al backend.

## ✅ Solución Rápida

### 1. Verifica que los contenedores están corriendo

```bash
docker ps
```

Deberías ver 3 contenedores:
- `inventory_frontend` (puerto 3000)
- `inventory_backend` (puerto 4000)  
- `inventory_db` (puerto 5432)

Si no están corriendo:
```bash
cd /ruta/al/proyecto/inventory-system
docker compose up -d
```

### 2. Configura Nginx

**En el servidor**, ejecuta:

```bash
# Navega al directorio del proyecto
cd /ruta/al/proyecto/inventory-system

# Ejecuta el script de configuración
sudo bash setup-nginx.sh
```

Este script:
- Copia la configuración de nginx
- Detecta automáticamente los puertos de Docker
- Verifica la configuración
- Reinicia nginx

### 3. Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

```bash
# Copia la configuración
sudo cp nginx-kairoframe.conf /etc/nginx/sites-available/kairoframe

# Crea el symlink
sudo ln -s /etc/nginx/sites-available/kairoframe /etc/nginx/sites-enabled/

# Elimina la configuración default
sudo rm /etc/nginx/sites-enabled/default

# Verifica la configuración
sudo nginx -t

# Reinicia nginx
sudo systemctl restart nginx
```

### 4. Verifica Variables de Entorno

El archivo `.env` debe tener:

```env
# Backend
BACKEND_PORT=4000
DATABASE_URL=postgresql://inventory_user:inventory_password@db:5432/inventory_db
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_esto_en_produccion
FRONTEND_URL=https://kairoframe.lobo99.info

# Frontend  
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://kairoframe.lobo99.info
```

**IMPORTANTE**: `NEXT_PUBLIC_API_URL=/api` (ruta relativa para usar con nginx)

Si cambias el `.env`, reinicia los contenedores:
```bash
docker compose down
docker compose up -d --build
```

### 5. Verifica la Configuración de Nginx

La configuración de nginx debe tener esta estructura:

```nginx
server {
    listen 443 ssl http2;
    server_name kairoframe.lobo99.info;

    # IMPORTANTE: /api debe ir ANTES de location /
    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Prueba las Conexiones

```bash
# Prueba que el backend responde localmente
curl http://localhost:4000/api/health

# Debería responder: {"status":"ok"}

# Prueba que nginx redirige correctamente
curl https://kairoframe.lobo99.info/api/health
```

### 7. Revisa los Logs

**Logs de Nginx:**
```bash
# Errores
sudo tail -f /var/log/nginx/error.log

# Accesos
sudo tail -f /var/log/nginx/kairoframe-access.log
```

**Logs de Docker:**
```bash
# Backend
docker logs inventory_backend -f

# Frontend
docker logs inventory_frontend -f
```

## 🐛 Problemas Comunes

### Error: Connection refused
**Causa**: Los contenedores no están corriendo o los puertos son incorrectos.

**Solución**:
```bash
docker ps  # Verifica puertos
docker compose restart  # Reinicia contenedores
```

### Error: 502 Bad Gateway
**Causa**: Nginx intenta conectar pero el backend no responde.

**Solución**:
```bash
# Verifica que el backend esté corriendo
docker logs inventory_backend

# Verifica que responda localmente
curl http://localhost:4000/api/health
```

### Error: SSL Certificate not found
**Causa**: No tienes certificado SSL configurado.

**Solución temporal** (sin SSL):
```nginx
# Edita /etc/nginx/sites-available/kairoframe
# Comenta las líneas SSL:
# ssl_certificate ...
# ssl_certificate_key ...

# Y cambia el puerto a 80:
listen 80;
```

**Solución permanente** (con Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d kairoframe.lobo99.info
```

### Error: CORS
**Causa**: El backend no permite peticiones desde tu dominio.

**Solución**: Verifica que `FRONTEND_URL` en `.env` del backend coincida con tu dominio:
```env
FRONTEND_URL=https://kairoframe.lobo99.info
```

## 📋 Checklist Completo

- [ ] Contenedores corriendo (`docker ps`)
- [ ] Backend responde localmente (`curl localhost:4000/api/health`)
- [ ] Frontend responde localmente (`curl localhost:3000`)
- [ ] Nginx instalado (`nginx -v`)
- [ ] Configuración de nginx copiada a `/etc/nginx/sites-available/kairoframe`
- [ ] Symlink creado en `/etc/nginx/sites-enabled/`
- [ ] Configuración de nginx válida (`sudo nginx -t`)
- [ ] Nginx reiniciado (`sudo systemctl restart nginx`)
- [ ] Variables `.env` correctas (especialmente `NEXT_PUBLIC_API_URL=/api`)
- [ ] Certificado SSL configurado (o puerto 80 sin SSL)
- [ ] Puerto 443 (o 80) abierto en firewall

## 🆘 Obtener Ayuda

Si sigues teniendo problemas, proporciona:

1. Salida de `docker ps`
2. Contenido del archivo `.env` (sin passwords)
3. Logs de nginx: `sudo tail -50 /var/log/nginx/error.log`
4. Logs del backend: `docker logs inventory_backend --tail 50`
5. Resultado de: `curl -v http://localhost:4000/api/health`
