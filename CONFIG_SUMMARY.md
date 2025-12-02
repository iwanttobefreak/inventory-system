# 🎯 RESUMEN: Sistema de Configuración de Puertos

## ✅ Archivos Creados

### 1. `.env` (NO se sube a Git)
Configuración actual del sistema. Aquí defines tus puertos:
```env
FRONTEND_PORT=3000
BACKEND_PORT=4000
DB_PORT=5432
```

### 2. `.env.example`
Plantilla de configuración para copiar y personalizar.

### 3. `PORT_CONFIGURATION.md`
Guía completa con ejemplos e instrucciones paso a paso.

### 4. `docker-compose.yml` (actualizado)
Ahora usa variables del `.env` automáticamente.

---

## 🚀 Cómo Usar

### Para cambiar puertos (ej: 8080 y 9090):

1. **Edita `.env`**:
   ```bash
   nano .env
   ```

2. **Cambia los valores**:
   ```env
   FRONTEND_PORT=8080
   BACKEND_PORT=9090
   NEXT_PUBLIC_API_URL=http://localhost:9090/api
   NEXT_PUBLIC_SITE_URL=http://localhost:8080
   ```

3. **Reinicia**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## 📝 Instalación en Nuevo Servidor

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/iwanttobefreak/inventory-system.git
   cd inventory-system
   ```

2. **Copia la configuración**:
   ```bash
   cp .env.example .env
   ```

3. **Edita los puertos** (si es necesario):
   ```bash
   nano .env
   ```

4. **Inicia**:
   ```bash
   docker-compose up -d --build
   ```

---

## 🔧 Variables Principales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Puerto del frontend | `3000` |
| `BACKEND_PORT` | Puerto del backend | `4000` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `JWT_SECRET` | Secret para JWT | ⚠️ Cambiar |
| `NEXT_PUBLIC_API_URL` | URL de la API | Variable |
| `NEXT_PUBLIC_SITE_URL` | URL pública | Variable |

---

## ✅ Ventajas

- ✅ **Cambiar puertos sin tocar código**
- ✅ **Configuración centralizada**
- ✅ **Fácil despliegue en múltiples servidores**
- ✅ **Variables por defecto si no existe `.env`**
- ✅ **Separación entre desarrollo y producción**

---

## 📚 Más Información

Lee `PORT_CONFIGURATION.md` para:
- Ejemplos detallados de configuración
- Solución de problemas
- Configuración para producción
- Casos de uso específicos

---

**Repositorio:** https://github.com/iwanttobefreak/inventory-system
