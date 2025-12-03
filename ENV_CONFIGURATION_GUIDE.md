# 🔧 Guía de Configuración de Variables de Entorno

## ⚠️ IMPORTANTE: Sin Hardcoding

Este sistema **NO** tiene valores hardcoded. Toda la configuración se hace a través del archivo `.env`.

## 📋 Variables Obligatorias

### Para desarrollo local:

```bash
# Copiar el ejemplo y editarlo
cp .env.example .env
```

Contenido mínimo del `.env`:

```bash
# PUERTOS
FRONTEND_PORT=3000
BACKEND_PORT=4000
DB_PORT=5432

# BASE DE DATOS
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=inventory_pass_2024
POSTGRES_DB=inventory_db
DATABASE_URL=postgresql://inventory_user:inventory_pass_2024@db:5432/inventory_db

# SEGURIDAD
JWT_SECRET=tu_secret_super_seguro_cambialo_en_produccion_2024
NODE_ENV=development

# FRONTEND (Desarrollo Local)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Para producción con nginx (proxy reverso):

```bash
# PUERTOS (diferentes a los de desarrollo)
FRONTEND_PORT=3010
BACKEND_PORT=4010
DB_PORT=5432

# BASE DE DATOS
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=TU_PASSWORD_SEGURA_AQUI
POSTGRES_DB=inventory_db
DATABASE_URL=postgresql://inventory_user:TU_PASSWORD_SEGURA_AQUI@db:5432/inventory_db

# SEGURIDAD
JWT_SECRET=SECRET_MUY_SEGURO_Y_ALEATORIO_DE_PRODUCCION
NODE_ENV=production

# FRONTEND (Producción con nginx)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

### Para producción sin nginx (acceso directo):

```bash
# FRONTEND (Producción sin proxy)
NEXT_PUBLIC_API_URL=https://tudominio.com:4010/api
NEXT_PUBLIC_SITE_URL=https://tudominio.com:3010
```

## 🔍 Cómo Funciona la Detección de API URL

El sistema detecta automáticamente la URL de la API siguiendo esta prioridad:

### 1. NEXT_PUBLIC_API_URL definida (Prioridad Alta)
Si está definida en el `.env`, se usa directamente:
```bash
NEXT_PUBLIC_API_URL=/api
# O
NEXT_PUBLIC_API_URL=https://kairoframe.lobo99.info/api
```

### 2. Cliente (navegador) sin NEXT_PUBLIC_API_URL
Si no está definida, construye la URL dinámicamente:
```javascript
// Usa el protocolo y hostname actuales del navegador
${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/api
```

### 3. Servidor (SSR) sin NEXT_PUBLIC_API_URL
Usa el nombre del servicio Docker:
```javascript
http://backend:${BACKEND_PORT}/api
```

## 🚀 Escenarios Comunes

### Escenario 1: Desarrollo Local (Docker)
```bash
FRONTEND_PORT=3000
BACKEND_PORT=4000
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Resultado**: 
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API llamada desde navegador: http://localhost:4000/api

### Escenario 2: Producción con Nginx (Recomendado)
```bash
FRONTEND_PORT=3010
BACKEND_PORT=4010
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://kairoframe.lobo99.info
```

**Configuración nginx**:
```nginx
# Frontend
location / {
    proxy_pass http://192.168.1.200:3010;
}

# Backend API
location /api {
    proxy_pass http://192.168.1.200:4010/api;
}
```

**Resultado**:
- Acceso: https://kairoframe.lobo99.info
- API: https://kairoframe.lobo99.info/api → proxy a localhost:4010/api
- Frontend: https://kairoframe.lobo99.info → proxy a localhost:3010

### Escenario 3: Producción sin Proxy (Acceso Directo a Puertos)
```bash
FRONTEND_PORT=3010
BACKEND_PORT=4010
NEXT_PUBLIC_API_URL=https://tudominio.com:4010/api
NEXT_PUBLIC_SITE_URL=https://tudominio.com:3010
```

**Resultado**:
- Frontend: https://tudominio.com:3010
- Backend: https://tudominio.com:4010
- API: https://tudominio.com:4010/api

## 🔄 Aplicar Cambios

### Cambios en variables NEXT_PUBLIC_*
Requieren **rebuild completo** del frontend:

```bash
# Editar .env con los nuevos valores
nano .env

# Rebuild del frontend (importante!)
docker-compose up -d --build frontend

# O rebuild completo
docker-compose down
docker-compose up -d --build
```

### Cambios en otras variables
Solo requieren restart:

```bash
docker-compose restart backend
```

## 🐛 Verificación

### Verificar que las variables se aplicaron:

```bash
# Ver variables en el contenedor
docker-compose exec frontend env | grep NEXT_PUBLIC

# Deberías ver:
# NEXT_PUBLIC_API_URL=/api
# NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

### Ver logs del build:

```bash
docker-compose logs frontend | grep "API URL"
```

Deberías ver algo como:
```
🔧 API URL (from NEXT_PUBLIC_API_URL): /api
```

## ❌ Errores Comunes

### Error 1: API URL sigue siendo localhost:4000 después de cambiar .env
**Causa**: No hiciste rebuild del frontend  
**Solución**:
```bash
docker-compose up -d --build frontend
```

### Error 2: Variables NEXT_PUBLIC_* están undefined
**Causa**: No están en el .env o el .env no se cargó  
**Solución**:
```bash
# Verificar que el .env existe y tiene las variables
cat .env | grep NEXT_PUBLIC

# Rebuild con --no-cache
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Error 3: Login funciona en localhost pero no en producción
**Causa**: NEXT_PUBLIC_API_URL o NEXT_PUBLIC_SITE_URL incorrectos  
**Solución**:
```bash
# Para nginx, usar rutas relativas:
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Rebuild
docker-compose up -d --build frontend
```

## 📚 Referencias

- Variables hardcoded eliminadas en:
  - ✅ `frontend/lib/api.ts` - Lógica de detección de URL
  - ✅ `frontend/app/login/page.tsx` - Debug line eliminada
  - ✅ `docker-compose.yml` - Solo usa variables del .env
  - ✅ `frontend/Dockerfile` - Acepta argumentos opcionales

- Archivos de configuración:
  - `.env` - Configuración principal (crear desde .env.example)
  - `.env.example` - Template con documentación
  - `frontend/.env.local.example` - Variables del frontend

## 🎯 Resumen

1. **Copia** `.env.example` a `.env`
2. **Edita** las variables según tu escenario (desarrollo/producción)
3. **Rebuild** si cambias variables NEXT_PUBLIC_*: `docker-compose up -d --build frontend`
4. **Restart** si cambias otras variables: `docker-compose restart`
5. **Verifica** con `docker-compose exec frontend env | grep NEXT_PUBLIC`
