# 📦 Guía de Migración de Datos

Esta guía explica cómo migrar tu sistema de inventario a otro servidor, incluyendo todos los datos y configuraciones.

## 🗄️ Volúmenes de Docker

El sistema utiliza **2 volúmenes persistentes** en Docker:

### 1. `postgres_data` - Base de Datos
- **Contenido**: Todos los datos de PostgreSQL
  - Usuarios y contraseñas
  - Ítems del inventario
  - Categorías y atributos
  - Ubicaciones (locations)
  - Historial de cambios
- **Ubicación en contenedor**: `/var/lib/postgresql/data`
- **Nombre del volumen**: `inventory-system_postgres_data`

### 2. `upload_data` - Archivos Subidos (NUEVO)
- **Contenido**: Imágenes de ubicaciones subidas por los usuarios
- **Ubicación en contenedor**: `/app/uploads`
- **Ubicación en backend**: `/uploads/locations/`
- **Nombre del volumen**: `inventory-system_upload_data`

## 🚀 Migración Completa a Otro Servidor

### Opción 1: Exportar/Importar Volúmenes (Recomendado)

#### En el servidor ORIGEN:

```bash
# 1. Detener los contenedores (opcional pero recomendado)
docker-compose down

# 2. Exportar el volumen de la base de datos
docker run --rm \
  -v inventory-system_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# 3. Exportar el volumen de uploads
docker run --rm \
  -v inventory-system_upload_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/uploads_backup.tar.gz -C /data .

# 4. Copiar los archivos .tar.gz al nuevo servidor
# Usa scp, rsync, o el método que prefieras
scp postgres_backup.tar.gz uploads_backup.tar.gz usuario@servidor-nuevo:/ruta/destino/
```

#### En el servidor DESTINO:

```bash
# 1. Clonar el repositorio (si no lo has hecho)
git clone <tu-repo>
cd inventory-system

# 2. Copiar tu archivo .env del servidor antiguo
# O crear uno nuevo con las mismas configuraciones

# 3. Crear los volúmenes vacíos
docker volume create inventory-system_postgres_data
docker volume create inventory-system_upload_data

# 4. Restaurar el volumen de base de datos
docker run --rm \
  -v inventory-system_postgres_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"

# 5. Restaurar el volumen de uploads
docker run --rm \
  -v inventory-system_upload_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/uploads_backup.tar.gz"

# 6. Levantar el sistema
docker-compose up -d

# 7. Verificar que todo funciona
docker-compose ps
docker-compose logs backend | grep "Server running"
```

### Opción 2: Backup de PostgreSQL (Solo Base de Datos)

Si solo necesitas migrar los datos de la base de datos:

#### En el servidor ORIGEN:

```bash
# Hacer backup con pg_dump
docker-compose exec db pg_dump -U inventory_user inventory_db > backup.sql

# O con archivo comprimido
docker-compose exec db pg_dump -U inventory_user inventory_db | gzip > backup.sql.gz
```

#### En el servidor DESTINO:

```bash
# 1. Levantar solo la base de datos
docker-compose up -d db

# 2. Esperar a que esté lista
docker-compose exec db pg_isready -U inventory_user

# 3. Restaurar el backup
docker-compose exec -T db psql -U inventory_user inventory_db < backup.sql

# O desde archivo comprimido
gunzip -c backup.sql.gz | docker-compose exec -T db psql -U inventory_user inventory_db

# 4. Levantar el resto del sistema
docker-compose up -d
```

## 📍 Ubicación de los Volúmenes en Disco

Para ver dónde están físicamente los volúmenes:

```bash
# Listar volúmenes del proyecto
docker volume ls | grep inventory-system

# Ver información detallada de un volumen
docker volume inspect inventory-system_postgres_data
docker volume inspect inventory-system_upload_data
```

La ubicación exacta depende del sistema operativo:
- **Linux**: `/var/lib/docker/volumes/<nombre-volumen>/_data`
- **macOS/Windows**: Dentro de la VM de Docker Desktop
- **Podman**: `/var/home/core/.local/share/containers/storage/volumes/<nombre-volumen>/_data`

## ⚠️ IMPORTANTE ANTES DE MIGRAR

### 1. Verificar que tienes todos los datos
```bash
# Verificar tamaño de los volúmenes
docker system df -v | grep inventory-system

# Ver contenido del volumen de uploads (si hay datos)
docker run --rm -v inventory-system_upload_data:/data alpine ls -lah /data
```

### 2. Hacer backup del archivo .env
```bash
# Copiar tu .env
cp .env .env.backup
```

### 3. Probar en el nuevo servidor
Después de la migración, verifica:
- ✅ Login funciona con tus usuarios
- ✅ Los ítems aparecen correctamente
- ✅ Las categorías y ubicaciones están presentes
- ✅ Las imágenes de ubicaciones se muestran (cuando subas algunas)
- ✅ Puedes crear nuevos ítems

## 🔄 Actualización del Sistema

Si ya has actualizado el `docker-compose.yml` con el volumen de uploads:

```bash
# 1. Bajar el sistema
docker-compose down

# 2. Hacer pull de los cambios
git pull

# 3. Subir de nuevo (creará el nuevo volumen automáticamente)
docker-compose up -d
```

**Nota**: Si tenías imágenes subidas ANTES de agregar el volumen, se perderán. El volumen solo persiste datos subidos DESPUÉS de su configuración.

## 🆘 Recuperación de Desastres

Si algo sale mal:

```bash
# 1. Bajar todo
docker-compose down

# 2. Eliminar solo los contenedores (MANTIENE los volúmenes)
docker-compose rm -f

# 3. Volver a construir
docker-compose build --no-cache

# 4. Subir de nuevo
docker-compose up -d
```

**Los volúmenes NO se eliminan con `docker-compose down`**, solo se eliminan con:
```bash
docker-compose down -v  # ⚠️ CUIDADO: Elimina TODOS los datos
```

## 📊 Resumen de Comandos Rápidos

```bash
# Ver volúmenes del proyecto
docker volume ls | grep inventory-system

# Backup rápido de la base de datos
docker-compose exec db pg_dump -U inventory_user inventory_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db psql -U inventory_user inventory_db < backup_YYYYMMDD.sql

# Ver logs de la base de datos
docker-compose logs db

# Conectar a la base de datos manualmente
docker-compose exec db psql -U inventory_user inventory_db
```

## 💡 Mejores Prácticas

1. **Backups automáticos**: Configura un cron job para hacer backups diarios
   ```bash
   # Agregar a crontab -e
   0 2 * * * cd /ruta/inventory-system && docker-compose exec db pg_dump -U inventory_user inventory_db | gzip > /backups/inventory_$(date +\%Y\%m\%d).sql.gz
   ```

2. **Antes de actualizaciones importantes**: Siempre haz un backup

3. **Prueba las restauraciones**: Verifica periódicamente que puedes restaurar desde tus backups

4. **Monitorea el espacio**: Los volúmenes crecen con el tiempo
   ```bash
   docker system df -v
   ```
