# 🔧 Guía de Configuración de Puertos

## 📋 Archivos de Configuración

Este proyecto ahora utiliza un archivo `.env` centralizado para configurar todos los puertos y variables de entorno.

### Archivos importantes:

- **`.env`** - Tu configuración actual (este archivo NO se sube a Git)
- **`.env.example`** - Plantilla de configuración
- **`docker-compose.yml`** - Usa las variables del `.env`

---

## 🚀 Cambiar Puertos (Instalación en Otro Servidor)

### Opción 1: Modificar el archivo `.env`

1. **Edita el archivo `.env`**:
   ```bash
   nano .env
   ```

2. **Cambia los puertos**:
   ```env
   # Ejemplo: Cambiar a puertos 8080 y 9000
   FRONTEND_PORT=8080
   BACKEND_PORT=9000
   DB_PORT=5432
   ```

3. **Actualiza las URLs**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:8080
   ```

4. **Reinicia los contenedores**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Opción 2: Usar variables de entorno directamente

```bash
FRONTEND_PORT=8080 BACKEND_PORT=9000 docker-compose up -d
```

---

## 📝 Ejemplos de Configuración

### Desarrollo Local (por defecto)
```env
FRONTEND_PORT=3000
BACKEND_PORT=4000
DB_PORT=5432
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Servidor con Puertos Alternativos
```env
FRONTEND_PORT=8080
BACKEND_PORT=9090
DB_PORT=5433
NEXT_PUBLIC_API_URL=http://localhost:9090/api
NEXT_PUBLIC_SITE_URL=http://localhost:8080
```

### Producción con Nginx
```env
FRONTEND_PORT=3000
BACKEND_PORT=4000
DB_PORT=5432
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://tudominio.com
NODE_ENV=production
JWT_SECRET=tu_secret_aleatorio_muy_seguro_y_largo
```

---

## 🔐 Variables Importantes

### Puertos
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `FRONTEND_PORT` | Puerto del frontend (Next.js) | `3000` |
| `BACKEND_PORT` | Puerto del backend (API) | `4000` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |

### Base de Datos
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `POSTGRES_USER` | Usuario de la BD | `inventory_user` |
| `POSTGRES_PASSWORD` | Contraseña de la BD | `inventory_pass_2024` |
| `POSTGRES_DB` | Nombre de la BD | `inventory_db` |
| `DATABASE_URL` | URL completa de conexión | (auto-generada) |

### Seguridad
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `JWT_SECRET` | Secret para tokens JWT | ⚠️ **CAMBIAR EN PRODUCCIÓN** |
| `NODE_ENV` | Entorno de ejecución | `development` |

### URLs Públicas
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_API_URL` | URL de la API | `http://localhost:4000/api` |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio | `http://localhost:3000` |

---

## ⚠️ Notas Importantes

1. **`.env` no se sube a Git** - Está en `.gitignore` por seguridad
2. **Copia `.env.example`** antes de empezar:
   ```bash
   cp .env.example .env
   ```
3. **Cambia `JWT_SECRET`** en producción:
   ```bash
   # Generar un secret aleatorio
   openssl rand -base64 32
   ```
4. **Después de cambiar puertos**, reconstruye:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## 🐛 Solución de Problemas

### Error: "Puerto ya en uso"

```bash
# Ver qué está usando el puerto
lsof -i :3000
lsof -i :4000

# Cambiar el puerto en .env
FRONTEND_PORT=8080
BACKEND_PORT=9090
```

### Frontend no conecta con Backend

1. Verifica que `NEXT_PUBLIC_API_URL` use el puerto correcto de `BACKEND_PORT`
2. Reconstruye el frontend:
   ```bash
   docker-compose up -d --build frontend
   ```

### Base de datos no conecta

1. Verifica que `DATABASE_URL` use el usuario y contraseña correctos
2. El host debe ser `db` (nombre del servicio en docker-compose)
3. El puerto interno es siempre `5432`, solo cambia el puerto externo

---

## 📚 Más Información

- Ver configuración actual: `cat .env`
- Ver servicios corriendo: `docker-compose ps`
- Ver logs: `docker-compose logs -f`
- Reiniciar todo: `./start.sh`
