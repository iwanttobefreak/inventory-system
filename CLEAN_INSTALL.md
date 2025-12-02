# 🚀 Instalación Limpia desde Cero

Esta guía te ayudará a instalar el sistema en un **servidor completamente nuevo** sin configuraciones previas.

---

## ⚡ Método 1: Instalación Automática (Recomendado)

### Paso a Paso

```bash
# 1. Clonar el repositorio
git clone https://github.com/iwanttobefreak/inventory-system.git
cd inventory-system

# 2. Ejecutar script de instalación
./install.sh
```

El script automáticamente:
- ✅ Verifica que Docker esté instalado
- ✅ Detiene contenedores existentes
- ✅ Pregunta si eliminar base de datos anterior
- ✅ Crea archivo `.env` desde `.env.example`
- ✅ Pregunta si quieres cambiar puertos
- ✅ Construye e inicia todos los contenedores
- ✅ Muestra información de acceso

### Resultado

Una vez terminado, verás:

```
✅ ¡INSTALACIÓN COMPLETADA!

📋 INFORMACIÓN:
  Frontend: http://localhost:3000
  Backend:  http://localhost:4000

🔑 PRIMER USO:
  1. Abre: http://localhost:3000
  2. Haz clic en 'Registrarse'
  3. Crea tu primer usuario
```

---

## 🔧 Método 2: Instalación Manual

### 1. Requisitos Previos

Asegúrate de tener instalado:

- **Docker**: https://docs.docker.com/get-docker/
- **Docker Compose**: https://docs.docker.com/compose/install/

Verificar instalación:
```bash
docker --version
docker-compose --version
```

### 2. Clonar Repositorio

```bash
git clone https://github.com/iwanttobefreak/inventory-system.git
cd inventory-system
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar si necesitas cambiar puertos o configuraciones
nano .env
```

**Variables importantes:**
```env
FRONTEND_PORT=3000          # Puerto del frontend
BACKEND_PORT=4000           # Puerto del backend
DB_PORT=5432               # Puerto de PostgreSQL
POSTGRES_PASSWORD=inventory_pass_2024  # Cambiar en producción
JWT_SECRET=cambiar_en_produccion       # Cambiar en producción
```

### 4. Limpiar Instalaciones Previas (Si Existen)

⚠️ **Solo si ya habías instalado antes:**

```bash
# Detener contenedores
docker-compose down

# Eliminar volumen de base de datos (esto borra datos)
docker volume rm inventory-system_postgres_data

# Listar y eliminar todos los volúmenes relacionados
docker volume ls | grep postgres
docker volume rm $(docker volume ls -q | grep postgres_data)
```

### 5. Construir e Iniciar

```bash
docker-compose up -d --build
```

### 6. Verificar Estado

```bash
# Ver contenedores corriendo
docker-compose ps

# Deberías ver 3 contenedores:
# - inventory_frontend (puerto 3000)
# - inventory_backend (puerto 4000)
# - inventory_db (puerto 5432)
```

### 7. Ver Logs (Opcional)

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

---

## ✅ Verificación de Instalación

### 1. Probar Frontend

Abre en tu navegador:
```
http://localhost:3000
```

Deberías ver la página de login.

### 2. Probar Backend

```bash
curl http://localhost:4000/api/health
```

Debería responder algo como: `{"status":"ok"}`

### 3. Verificar Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it inventory_db psql -U inventory_user -d inventory_db

# Listar tablas (dentro de psql)
\dt

# Salir
\q
```

---

## 🔑 Primer Uso del Sistema

1. **Abre el navegador:** http://localhost:3000

2. **Haz clic en "Registrarse"**

3. **Crea tu primer usuario:**
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Contraseña: (mínimo 6 caracteres)

4. **Inicia sesión** con las credenciales creadas

5. **¡Empieza a usar el sistema!**

---

## 🐛 Solución de Problemas Comunes

### Error: "Puerto ya en uso"

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :4000

# Opción 1: Detener el proceso
kill -9 PID

# Opción 2: Cambiar puertos en .env
nano .env
# Cambiar FRONTEND_PORT y BACKEND_PORT
docker-compose down
docker-compose up -d --build
```

### Error: "Authentication failed database"

Esto significa que el volumen tiene credenciales antiguas:

```bash
# Detener todo
docker-compose down

# Eliminar volumen
docker volume rm inventory-system_postgres_data

# Verificar .env
cat .env | grep POSTGRES

# Reiniciar
docker-compose up -d --build
```

### Error: "Cannot connect to Docker daemon"

Docker no está corriendo:

```bash
# En macOS/Windows: Abrir Docker Desktop

# En Linux:
sudo systemctl start docker
sudo systemctl enable docker
```

### Frontend no conecta con Backend

```bash
# Verificar que NEXT_PUBLIC_API_URL esté correcto
cat .env | grep NEXT_PUBLIC_API_URL

# Debe ser: http://localhost:BACKEND_PORT/api
# Ejemplo: http://localhost:4000/api

# Si cambias algo, reconstruir frontend
docker-compose up -d --build frontend
```

---

## 🔄 Comandos Útiles

```bash
# Ver estado
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart frontend
docker-compose restart backend

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (borra datos)
docker-compose down -v

# Reconstruir todo desde cero
docker-compose down
docker-compose up -d --build

# Ver consumo de recursos
docker stats
```

---

## 🌐 Acceso desde Otros Equipos

Para acceder desde otros dispositivos en tu red local:

1. **Encuentra tu IP local:**
   ```bash
   # Linux/Mac
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```

2. **Accede desde otro dispositivo:**
   ```
   http://TU_IP:3000
   ```

3. **Configurar firewall (si es necesario):**
   ```bash
   # Linux (UFW)
   sudo ufw allow 3000
   sudo ufw allow 4000
   ```

---

## 📦 Desinstalación Completa

Si quieres eliminar todo:

```bash
# Ir al directorio
cd inventory-system

# Detener y eliminar contenedores
docker-compose down

# Eliminar volúmenes (datos)
docker volume rm inventory-system_postgres_data

# Eliminar imágenes
docker rmi inventory-system_frontend
docker rmi inventory-system_backend
docker rmi postgres:16-alpine

# Eliminar directorio
cd ..
rm -rf inventory-system
```

---

## 📚 Siguiente Paso

Una vez instalado, consulta:

- **[QUICK_START.md](QUICK_START.md)** - Guía de uso básico
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Gestión de usuarios
- **[PORT_CONFIGURATION.md](PORT_CONFIGURATION.md)** - Cambiar puertos
- **[ATTRIBUTES_UPDATE.md](ATTRIBUTES_UPDATE.md)** - Sistema de atributos

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisa los logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Verifica el estado:**
   ```bash
   docker-compose ps
   ```

3. **Consulta la documentación** en los archivos `.md`

4. **Issues en GitHub:** https://github.com/iwanttobefreak/inventory-system/issues
