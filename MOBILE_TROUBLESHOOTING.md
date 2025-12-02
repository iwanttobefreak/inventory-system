# 🔧 Troubleshooting: Login desde Móvil

## 🆘 Problema: "Error al iniciar sesión" desde móvil

### Diagnóstico Mejorado

He añadido herramientas de debug al frontend para identificar exactamente qué está fallando:

#### 1️⃣ **Ver información de debug en la página de login**

En la página de login, ahora verás un enlace "🔧 Info de Debug" debajo de las credenciales.

Haz click y verás:
- **API URL**: La URL que está usando el frontend para conectarse
- **Window Location**: La URL actual de la página

**Lo que deberías ver:**
```
API URL: /api
Window Location: https://kairoframe.lobo99.info/login
```

**❌ Si ves esto, hay un problema:**
```
API URL: http://localhost:4000/api
Window Location: https://kairoframe.lobo99.info/login
```

#### 2️⃣ **Mensajes de error mejorados**

Ahora los errores son más descriptivos:

- **"No se pudo conectar al servidor. Verifica tu conexión."**
  - El frontend no puede alcanzar el backend
  - Probable causa: nginx no está proxying correctamente

- **"Error del servidor: 401"** o **"Invalid credentials"**
  - El backend responde pero las credenciales son incorrectas
  - Esto es normal, solo revisa email/contraseña

- **"Error del servidor: 500"**
  - El backend tiene un error interno
  - Revisa logs: `docker-compose logs backend`

- **"CORS policy"** o **"blocked by CORS"**
  - Problema de CORS
  - Poco probable ya que el backend tiene CORS habilitado

### 🔍 Pasos de Diagnóstico

#### Paso 1: Verificar desde el móvil

1. Abre https://kairoframe.lobo99.info en el móvil
2. Abre las herramientas de desarrollo del navegador:
   - **Safari iOS**: Conecta el iPhone al Mac → Safari en Mac → Develop → [tu iPhone] → [la página]
   - **Chrome Android**: chrome://inspect
3. Ve a la consola y busca el mensaje: `"API URL configurada: ..."`

#### Paso 2: Verificar desde tu Mac

```bash
# 1. Probar el health check a través de nginx
curl https://kairoframe.lobo99.info/health

# Debería responder:
# {"status":"ok","message":"Inventory API is running"}

# 2. Probar el login a través de nginx
curl -X POST https://kairoframe.lobo99.info/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}'

# Debería responder con un token
```

#### Paso 3: Verificar en el servidor

```bash
# SSH al servidor
ssh usuario@kairoframe.lobo99.info

# Verificar contenedores
docker-compose ps
# Todos deberían estar "Up"

# Verificar logs del backend
docker-compose logs --tail=50 backend

# Verificar logs de nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Probar localmente en el servidor
curl http://localhost:4000/health
curl http://localhost:3000
```

## 🛠️ Soluciones Comunes

### Problema 1: API URL incorrecta

**Síntoma**: En debug info muestra `API URL: http://localhost:4000/api`

**Solución**:
```bash
# En el servidor
cd /ruta/al/proyecto/inventory-system

# Verificar .env.local
cat frontend/.env.local
# Debería mostrar: NEXT_PUBLIC_API_URL=/api

# Si no es así, actualizarlo:
echo "NEXT_PUBLIC_API_URL=/api" > frontend/.env.local

# Rebuild frontend
docker-compose up -d --build frontend
```

### Problema 2: Nginx no está proxying la API

**Síntoma**: Error "No se pudo conectar al servidor"

**Solución**:
```bash
# Verificar configuración de nginx
sudo nginx -t

# Ver configuración actual
cat /etc/nginx/sites-enabled/kairoframe-inventory

# Debería incluir algo como:
# location /api/ {
#     proxy_pass http://localhost:4000/api/;
#     ...
# }

# Si falta, crear/actualizar el archivo usando nginx.conf como referencia
sudo nano /etc/nginx/sites-enabled/kairoframe-inventory

# Recargar nginx
sudo systemctl reload nginx
```

### Problema 3: Contenedores no están corriendo

**Síntoma**: Error 502 Bad Gateway

**Solución**:
```bash
# Verificar estado
docker-compose ps

# Si no están corriendo, iniciarlos
docker-compose up -d

# Ver logs si hay errores
docker-compose logs backend
docker-compose logs frontend
```

### Problema 4: Puerto bloqueado por firewall

**Síntoma**: Timeout o connection refused desde fuera del servidor

**Solución**:
```bash
# Verificar firewall
sudo ufw status

# Permitir HTTP y HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Recargar firewall
sudo ufw reload
```

### Problema 5: Certificado SSL expirado

**Síntoma**: Error de certificado SSL en el navegador

**Solución**:
```bash
# Renovar certificado Let's Encrypt
sudo certbot renew --nginx

# Verificar certificados
sudo certbot certificates

# Recargar nginx
sudo systemctl reload nginx
```

## 📱 Prueba Paso a Paso desde Móvil

### 1. Abre el navegador en el móvil
- Safari (iOS) o Chrome (Android)

### 2. Ve a: `https://kairoframe.lobo99.info`
- ⚠️ Importante: Usa **HTTPS**, no HTTP

### 3. Verifica que la página cargue
- Deberías ver el formulario de login
- El texto debería ser visible (negro sobre blanco)

### 4. Haz click en "🔧 Info de Debug"
- Verifica que `API URL` sea `/api` (no `http://localhost:4000/api`)
- Verifica que `Window Location` sea `https://kairoframe.lobo99.info/...`

### 5. Intenta hacer login
- Email: `admin@productora.com`
- Password: `admin123`

### 6. Si falla, observa el mensaje de error
- Toma captura de pantalla del mensaje
- Abre la consola del navegador (si puedes)
- Busca errores en rojo

## 🔬 Debug Avanzado

### Verificar requests desde el navegador móvil

**En Safari iOS**:
1. Conecta el iPhone al Mac con cable
2. En el iPhone: Ajustes → Safari → Avanzado → Web Inspector (activar)
3. En el Mac: Safari → Develop → [tu iPhone] → [la página]
4. Ve a la pestaña Network
5. Intenta hacer login y observa las peticiones

**En Chrome Android**:
1. En el móvil: Ajustes → Opciones de desarrollo → Depuración USB (activar)
2. En Chrome desktop: chrome://inspect
3. Encuentra tu dispositivo y la página
4. Abre DevTools
5. Ve a Network
6. Intenta hacer login

**Qué buscar**:
- Request a `/api/auth/login`
- Status code (debería ser 200)
- Response body (debería contener un token)
- Errores en rojo en la consola

### Logs en tiempo real

```bash
# En el servidor, ver logs en tiempo real mientras pruebas en el móvil

# Terminal 1: Logs del backend
docker-compose logs -f backend

# Terminal 2: Logs del frontend  
docker-compose logs -f frontend

# Terminal 3: Logs de nginx
sudo tail -f /var/log/nginx/access.log

# Luego intenta hacer login desde el móvil y observa qué aparece
```

## 📋 Checklist de Verificación

Marca cada punto mientras verificas:

- [ ] Contenedores corriendo: `docker-compose ps`
- [ ] Backend responde: `curl http://localhost:4000/health`
- [ ] Frontend responde: `curl http://localhost:3000`
- [ ] Nginx configurado: `sudo nginx -t`
- [ ] Health check a través de nginx: `curl https://kairoframe.lobo99.info/health`
- [ ] Login API funciona: `curl -X POST https://kairoframe.lobo99.info/api/auth/login ...`
- [ ] Frontend `.env.local` tiene: `NEXT_PUBLIC_API_URL=/api`
- [ ] Frontend rebuildeado después de cambiar .env.local
- [ ] Firewall permite puertos 80 y 443
- [ ] Certificado SSL válido
- [ ] Página carga en móvil
- [ ] Debug info muestra API URL correcta
- [ ] Login funciona desde desktop
- [ ] Login funciona desde móvil

## 🆘 Si Nada Funciona

### Opción 1: Usar IP directa (temporal)

```bash
# Obtener IP del servidor
hostname -I

# Usar en lugar del dominio
# http://TU_IP:3000 (solo en red local)
```

### Opción 2: Revisar toda la configuración

```bash
# Ejecutar script de verificación
./verify-setup.sh

# Te dirá exactamente qué está fallando
```

### Opción 3: Reiniciar servicios

```bash
# Reiniciar todo
docker-compose down
docker-compose up -d

# Esperar 30 segundos
sleep 30

# Verificar
docker-compose ps
curl https://kairoframe.lobo99.info/health
```

### Opción 4: Logs completos

```bash
# Guardar logs completos para análisis
docker-compose logs > logs.txt

# Enviar logs.txt para análisis
```

## 📞 Información para Reportar el Problema

Si el problema persiste, necesito esta información:

1. **Mensaje de error exacto** desde el móvil (captura de pantalla)
2. **Info de Debug** (API URL y Window Location)
3. **Logs del backend**: `docker-compose logs backend | tail -100`
4. **Resultado de**: `curl https://kairoframe.lobo99.info/health`
5. **Resultado de**: `curl -X POST https://kairoframe.lobo99.info/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@productora.com","password":"admin123"}'`
6. **Navegador y versión** (ej: Safari iOS 17, Chrome Android 120)

---

💡 **Recuerda**: El frontend ahora tiene mejor manejo de errores. El mensaje específico que veas te dirá exactamente qué está fallando.
