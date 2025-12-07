# 📹 Sistema de Inventario Audiovisual

Sistema completo de gestión de inventario para productoras audiovisuales con códigos QR, desarrollado con Docker, Next.js, Node.js, Express y PostgreSQL.

## 🚀 Características

- ✅ **Gestión completa de inventario** - Cámaras, audio, iluminación, cables, etc.
- ✅ **Códigos QR únicos** - Cada item tiene su propio código QR
- ✅ **Vista dual** - Información completa para autenticados, mensaje de devolución para externos
- ✅ **Autenticación JWT** - Sistema seguro de login
- ✅ **Gestión de usuarios** - Crear, editar, eliminar usuarios y cambiar contraseñas
- ✅ **Dashboard interactivo** - Estadísticas y filtros en tiempo real
- ✅ **Base de datos PostgreSQL** - Datos persistentes y seguros
- ✅ **Docker** - Fácil despliegue en cualquier servidor
- ✅ **Responsive** - Funciona en móvil, tablet y desktop

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + **Express** - API REST
- **Prisma ORM** - Gestión de base de datos
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación
- **QRCode** - Generación de códigos QR

### Frontend
- **Next.js 14** - Framework React con SSR
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos modernos
- **Zustand** - Gestión de estado
- **Axios** - Cliente HTTP
- **qrcode.react** - Visualización de QR

### DevOps
- **Docker / Podman** - Containerización (compatible con ambos)
- **Docker Compose** - Orquestación de contenedores
- **PostgreSQL** - Base de datos en contenedor
- **Detección automática** - Los scripts detectan tu motor de contenedores

## 📋 Requisitos Previos

- **Docker Desktop** O **Podman** instalado (✅ compatible con ambos)
- Docker Compose instalado (viene con Docker Desktop)
- Puerto 3000, 4000 y 5432 disponibles

> 💡 **Nota**: El sistema detecta automáticamente si tienes Docker o Podman y usa el comando correcto.  
> Ver [DOCKER_PODMAN_COMPATIBILITY.md](DOCKER_PODMAN_COMPATIBILITY.md) para más detalles.

### Instalación de Docker o Podman

**Opción 1: Docker Desktop** (Recomendado para desarrollo local)
- macOS/Windows: https://www.docker.com/products/docker-desktop
- Linux: https://docs.docker.com/engine/install/

**Opción 2: Podman** (Alternativa ligera, ideal para servidores)
- macOS: `brew install podman` y luego `podman machine init && podman machine start`
- Linux: https://podman.io/getting-started/installation

## 🚀 Instalación y Ejecución

### Método 1: Usando el script automático (Recomendado)

El script `start.sh` detecta automáticamente si tienes Docker o Podman:

```bash
# 1. Navega al directorio del proyecto
cd /ruta/a/inventory-system

# 2. Hacer el script ejecutable (solo la primera vez)
chmod +x start.sh

# 3. Levantar todos los servicios
./start.sh up

# O en segundo plano
./start.sh start
```

### Método 2: Manual con Docker

```bash
# 1. Navega al directorio del proyecto
cd /ruta/a/inventory-system

# 2. Levantar servicios
docker-compose up --build

# O en segundo plano
docker-compose up -d --build
```

### Método 3: Manual con Podman

```bash
# 1. Navega al directorio del proyecto
cd /ruta/a/inventory-system

# 2. Si tienes podman-compose instalado
podman-compose up --build

# O usando docker-compose con Podman
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
docker-compose up --build
```

### 2. Configurar variables de entorno (opcional)

Puedes editar las variables en `docker-compose.yml`:

```yaml
# Backend
DATABASE_URL: postgresql://inventory_user:inventory_pass@db:5432/inventory_db
JWT_SECRET: tu_secreto_super_seguro_cambiar_en_produccion
COMPANY_NAME: "Tu Productora"
COMPANY_PHONE: "+34 XXX XXX XXX"
COMPANY_EMAIL: "info@tuproductora.com"
COMPANY_ADDRESS: "Tu dirección"

# Frontend
NEXT_PUBLIC_API_URL: http://localhost:4000/api
```

### 3. Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### 5. Login inicial

Usa estas credenciales por defecto:

```
Email: admin@productora.com
Contraseña: admin123
```

⚠️ **IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login.

## 👥 Gestión de Usuarios

El sistema incluye gestión completa de usuarios. Ver la guía completa en [`USER_MANAGEMENT.md`](./USER_MANAGEMENT.md).

### Acciones rápidas:

**Cambiar tu contraseña:**
```bash
curl -X PUT http://localhost:4000/api/users/me/password \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"nueva_pass"}'
```

**Crear nuevo usuario (Solo ADMIN):**
```bash
# Opción 1: Usando la API
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@productora.com","password":"pass123","name":"Juan Pérez","role":"USER"}'

# Opción 2: Usando el script (desde el directorio del proyecto)
cd /ruta/a/inventory-system
docker-compose exec backend npx tsx scripts/create-user.ts juan@productora.com pass123 "Juan Pérez" USER
```

**Listar todos los usuarios:**
```bash
# Desde el directorio del proyecto
cd /ruta/a/inventory-system
docker-compose exec backend npx tsx scripts/list-users.ts
```

**Probar todos los endpoints de usuarios:**
```bash
./test-user-api.sh
```

📖 **Documentación completa**: Ver [`USER_MANAGEMENT.md`](./USER_MANAGEMENT.md) para más opciones y detalles.

## 📱 Cómo Usar el Sistema

### Flujo de trabajo

1. **Login** → Inicia sesión con tus credenciales
2. **Dashboard** → Ve todos tus items, estadísticas y filtros
3. **Nuevo Item** → Crea un nuevo equipo con código único
4. **Ver Detalle** → Click en un item para ver toda su información
5. **Descargar QR** → Genera y descarga el código QR del item
6. **Imprimir Pegatinas** → Imprime los QR y pégalos en tus equipos

### ¿Qué pasa cuando alguien escanea un QR?

#### Si está autenticado (tu equipo):
- ✅ Ve toda la información del item
- ✅ Puede editar el estado
- ✅ Ve el historial de cambios
- ✅ Puede descargar el QR

#### Si NO está autenticado (alguien lo encontró):
- ✅ Ve el nombre del equipo
- ✅ Ve un mensaje de devolución
- ✅ Ve tu información de contacto (teléfono, email, dirección)
- ✅ Link para iniciar sesión si es parte del equipo

## 🐳 Comandos Útiles

⚠️ **IMPORTANTE**: Todos los comandos `docker-compose` deben ejecutarse desde el directorio raíz del proyecto (`inventory-system/`). Si estás en otro directorio, primero navega al proyecto:

```bash
cd /ruta/a/inventory-system
```

### Con el script start.sh

```bash
# NOTA: Estos scripts también deben ejecutarse desde el directorio del proyecto

./start.sh up        # Levantar servicios (con logs)
./start.sh start     # Levantar en segundo plano
./start.sh down      # Parar servicios
./start.sh logs      # Ver logs
./start.sh restart   # Reiniciar servicios
./start.sh rebuild   # Reconstruir contenedores
./start.sh clean     # Limpiar todo (⚠️ borra datos)
./start.sh status    # Ver estado de servicios
```

### Comandos Docker Compose

```bash
# NOTA: Ejecuta estos comandos desde el directorio del proyecto

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend

# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes (⚠️ borra la base de datos)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart backend

# Ver estado de los contenedores
docker-compose ps

# Ejecutar comandos dentro del backend
docker-compose exec backend sh

# Ejecutar migraciones manualmente
docker-compose exec backend npx prisma migrate deploy

# Re-seed de la base de datos
docker-compose exec backend npx prisma db seed
```

### Comandos equivalentes con Podman

Reemplaza `docker-compose` por `podman-compose` o usa el script `start.sh` que lo hace automáticamente.

## 🗄️ Estructura del Proyecto

```
inventory-system/
├── backend/                    # API Node.js + Express
│   ├── prisma/
│   │   ├── schema.prisma      # Schema de la base de datos
│   │   └── seed.ts            # Datos iniciales
│   ├── src/
│   │   ├── routes/            # Rutas de la API
│   │   │   ├── auth.ts        # Login/Register
│   │   │   ├── items.ts       # CRUD de items
│   │   │   └── categories.ts  # Categorías
│   │   ├── middleware/
│   │   │   └── auth.ts        # Middleware JWT
│   │   └── server.ts          # Servidor principal
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # App Next.js
│   ├── app/
│   │   ├── dashboard/         # Panel principal
│   │   ├── items/[code]/      # Detalle de item
│   │   ├── login/             # Login
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── api.ts             # Cliente API
│   │   ├── store.ts           # Estado global
│   │   └── types.ts           # Tipos TypeScript
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml          # Orquestación Docker
└── README.md
```

## 🔧 Configuración Avanzada

### Cambiar puertos

Edita `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:3000"  # Ahora en puerto 8080
  
  backend:
    ports:
      - "8000:4000"  # Ahora en puerto 8000
```

## 💾 Volúmenes y Backup

### 📁 Configuración de volúmenes persistentes

El sistema usa **directorios locales mapeados** en lugar de volúmenes Docker para facilitar backups y migración.

**Configuración en `.env`:**
```bash
DIR_VOLUMENES=/Users/T054810/kairoframe
```

**Estructura de datos:**
```
/Users/T054810/kairoframe/
├── postgres/         ← Base de datos PostgreSQL
└── uploads/          ← Imágenes de artículos
    └── items/
```

**Ventajas:**
- ✅ Backup directo: `cp -r /Users/T054810/kairoframe backup/`
- ✅ Migración fácil: Solo copiar la carpeta al nuevo servidor
- ✅ Visibilidad: Ver archivos desde Finder/Explorer
- ✅ Compatible con herramientas estándar de backup

📖 **Documentación completa**: Ver [`VOLUMES_GUIDE.md`](./VOLUMES_GUIDE.md)

### 🔄 Scripts de backup automatizados

**Hacer backup completo:**
```bash
./backup.sh
```

**Restaurar desde backup:**
```bash
./restore.sh ~/backups/kairoframe/kairoframe-backup-YYYYMMDD-HHMMSS.tar.gz
```

**Características:**
- ✅ Backup automático de base de datos (dump SQL)
- ✅ Backup de todas las imágenes
- ✅ Compresión automática (.tar.gz)
- ✅ Limpieza de backups antiguos (> 7 días)
- ✅ Restauración completa con un comando

📖 **Guía completa de backups**: Ver [`BACKUP_GUIDE.md`](./BACKUP_GUIDE.md)

### 🌐 Migrar a otro servidor

```bash
# 1. En el servidor origen
./backup.sh
scp ~/backups/kairoframe/kairoframe-backup-*.tar.gz user@nuevo-servidor:/tmp/

# 2. En el servidor destino
cd inventory-system
vim .env  # Configurar DIR_VOLUMENES
./restore.sh /tmp/kairoframe-backup-*.tar.gz
```

### Backup manual de la base de datos (método anterior)

```bash
# Crear backup (desde el directorio del proyecto)
cd /ruta/a/inventory-system
docker-compose exec db pg_dump -U inventory_user inventory_db > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U inventory_user inventory_db < backup.sql
```

### Agregar más categorías

Edita `backend/prisma/seed.ts` y ejecuta:

```bash
# Desde el directorio del proyecto
cd /ruta/a/inventory-system
docker-compose exec backend npx prisma db seed
```
```

### Cambiar datos de la productora

Edita las variables de entorno en `docker-compose.yml`:

```yaml
environment:
  COMPANY_NAME: "Mi Nueva Productora"
  COMPANY_PHONE: "+34 666 777 888"
  COMPANY_EMAIL: "contacto@nueva.com"
  COMPANY_ADDRESS: "Nueva dirección"
```

Reinicia el backend:

```bash
docker-compose restart backend
```

## 🌐 Despliegue en Servidor

### Opción 1: Docker en tu servidor

```bash
# 1. Clona el repositorio en tu servidor
git clone https://github.com/iwanttobefreak/inventory-system.git
cd inventory-system

# 2. Editar .env con tu configuración
cp .env.example .env
# Editar los valores necesarios (puertos, URL del frontend, etc.)

# 3. Levantar servicios
docker-compose up -d --build

# 4. Verificar que todo esté corriendo
docker-compose ps
```

## 📊 API Endpoints

### Autenticación

```
POST /api/auth/login
POST /api/auth/register
```

### Items

```
GET    /api/items              # Listar todos (requiere auth)
GET    /api/items/:code        # Ver uno (auth opcional)
POST   /api/items              # Crear (requiere auth)
PUT    /api/items/:code        # Actualizar (requiere auth)
DELETE /api/items/:code        # Eliminar (requiere auth)
GET    /api/items/:code/qr     # Obtener QR (requiere auth)
```

### Categorías

```
GET    /api/categories         # Listar (requiere auth)
POST   /api/categories         # Crear (requiere auth)
```

## 🐛 Troubleshooting

### ❌ Error: "no configuration file provided: not found"

**Causa**: Estás ejecutando comandos `docker-compose` desde un directorio incorrecto.

**Solución**:
```bash
# Navega al directorio del proyecto
cd /ruta/a/inventory-system

# Verifica que estás en el lugar correcto
ls docker-compose.yml  # Debería mostrar el archivo

# Ahora ejecuta tus comandos
docker-compose ps
```

### ❌ Script list-users.ts no funciona

**Causa**: El comando se ejecuta desde un directorio incorrecto o el backend no está corriendo.

**Solución**:
```bash
# 1. Navega al directorio del proyecto
cd /ruta/a/inventory-system

# 2. Verifica que el backend esté corriendo
docker-compose ps

# 3. Si el backend no está corriendo, levántalo
docker-compose up -d backend

# 4. Ahora ejecuta el script
docker-compose exec backend npx tsx scripts/list-users.ts
```

### Puerto ya en uso

```bash
# Ver qué está usando el puerto
lsof -i :3000
lsof -i :4000

# Cambiar puertos en docker-compose.yml
```

### Base de datos no se conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs
docker-compose logs db

# Reiniciar todo
docker-compose down -v
docker-compose up --build
```

### Error de permisos en macOS

```bash
# Dar permisos a Docker
sudo chmod -R 777 .
```

### Frontend no conecta con backend

Verifica en `docker-compose.yml`:

```yaml
frontend:
  environment:
    NEXT_PUBLIC_API_URL: http://localhost:4000/api  # Debe coincidir con el puerto del backend
```

## 📝 Datos de Ejemplo

Al hacer seed, se crean:

- **1 usuario admin**: admin@productora.com / admin123
- **7 categorías**: Cámaras, Audio, Iluminación, Cables, Trípodes, Almacenamiento, Accesorios
- **5 items de ejemplo**: Sony A7S III, Rode NTG3, Aputure 300d II, Cable XLR, Manfrotto 546B

## 🔐 Seguridad

⚠️ **IMPORTANTE** antes de producción:

1. Cambiar `JWT_SECRET` en `docker-compose.yml`
2. Cambiar contraseña de PostgreSQL
3. Usar HTTPS en producción
4. Cambiar password del admin por defecto
5. Configurar CORS adecuadamente

## 📄 Licencia

Este proyecto es de código abierto para uso personal o comercial.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📧 Soporte

¿Problemas o preguntas? Abre un issue en GitHub.

---

**¡Hecho con ❤️ para productoras audiovisuales!** 📹🎬🎤
