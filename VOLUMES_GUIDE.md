# 📁 Guía de Volúmenes Persistentes

## 🎯 Descripción

Los volúmenes persistentes ahora se guardan en **directorios locales del disco duro** en lugar de volúmenes Docker. Esto facilita:

✅ **Backups más sencillos** (solo copiar una carpeta)  
✅ **Portabilidad completa** (llevar todo a otro servidor)  
✅ **Visibilidad directa** de los archivos desde el sistema operativo  
✅ **Migraciones rápidas** entre entornos  

---

## 📂 Estructura de directorios

```
/Users/T054810/kairoframe/          ← DIR_VOLUMENES del .env
├── postgres/                        ← Base de datos PostgreSQL
│   ├── base/
│   ├── global/
│   ├── pg_wal/
│   └── ... (archivos de PostgreSQL)
│
└── uploads/                         ← Imágenes subidas
    └── items/
        ├── kf-0001-1234567890.jpg
        ├── kf-0002-1234567891.png
        └── ...
```

---

## ⚙️ Configuración

### 1. Editar `.env`

```bash
# VOLÚMENES PERSISTENTES
DIR_VOLUMENES=/Users/T054810/kairoframe
```

**Importante**: Cambia la ruta según tu sistema operativo:
- **macOS/Linux**: `/Users/usuario/kairoframe` o `/home/usuario/kairoframe`
- **Windows**: `C:/kairoframe` o `/c/kairoframe` (formato WSL si usas Docker Desktop)

### 2. El `docker-compose.yml` usa esta variable

```yaml
services:
  db:
    volumes:
      - ${DIR_VOLUMENES:-./data}/postgres:/var/lib/postgresql/data
  
  backend:
    volumes:
      - ${DIR_VOLUMENES:-./data}/uploads:/app/uploads
```

**Fallback**: Si `DIR_VOLUMENES` no está definido, usa `./data` (carpeta local del proyecto)

---

## 🚀 Migración desde volúmenes Docker

### Opción A: Script automático (recomendado)

```bash
chmod +x migrate-to-local-volumes.sh
./migrate-to-local-volumes.sh
```

### Opción B: Manual

```bash
# 1. Crear directorios
mkdir -p /Users/T054810/kairoframe/postgres
mkdir -p /Users/T054810/kairoframe/uploads/items

# 2. Copiar base de datos
docker cp inventory_db:/var/lib/postgresql/data/. /Users/T054810/kairoframe/postgres/

# 3. Copiar imágenes
docker cp inventory_backend:/app/uploads/. /Users/T054810/kairoframe/uploads/

# 4. Detener contenedores
docker compose down

# 5. Eliminar volúmenes antiguos (opcional)
docker volume rm inventory-system_postgres_data
docker volume rm inventory-system_upload_data

# 6. Levantar con nuevos volúmenes
docker compose up -d
```

---

## 💾 Backups

### Backup completo

```bash
# Copiar todo el directorio
cp -r /Users/T054810/kairoframe /Users/T054810/backups/kairoframe-$(date +%Y%m%d)

# O comprimir
tar -czf backup-kairoframe-$(date +%Y%m%d).tar.gz /Users/T054810/kairoframe
```

### Backup solo de imágenes

```bash
cp -r /Users/T054810/kairoframe/uploads /Users/T054810/backups/uploads-$(date +%Y%m%d)
```

### Backup de base de datos (dump SQL)

```bash
docker exec inventory_db pg_dump -U inventory_user inventory_db > backup-db-$(date +%Y%m%d).sql
```

---

## 🔄 Migrar a otro servidor

### En el servidor origen:

```bash
# 1. Detener contenedores
docker compose down

# 2. Comprimir todo
cd /Users/T054810
tar -czf kairoframe-backup.tar.gz kairoframe/

# 3. Transferir (ejemplos)
# Por SCP:
scp kairoframe-backup.tar.gz user@servidor-destino:/home/user/

# Por USB/disco externo:
cp kairoframe-backup.tar.gz /Volumes/USB/
```

### En el servidor destino:

```bash
# 1. Descomprimir
tar -xzf kairoframe-backup.tar.gz -C /ruta/destino/

# 2. Editar .env con la nueva ruta
vim /ruta/proyecto/inventory-system/.env
# DIR_VOLUMENES=/ruta/destino/kairoframe

# 3. Levantar contenedores
cd /ruta/proyecto/inventory-system
docker compose up -d
```

---

## 🔍 Verificar ubicación actual

```bash
# Ver configuración de volúmenes
docker compose config | grep volumes -A 5

# Ver qué directorios está usando
docker inspect inventory_db | grep Source
docker inspect inventory_backend | grep Source
```

---

## 📊 Espacio en disco

```bash
# Ver tamaño de cada directorio
du -sh /Users/T054810/kairoframe/*

# Ejemplo de salida:
# 150M    /Users/T054810/kairoframe/postgres
# 2.5M    /Users/T054810/kairoframe/uploads
```

---

## ⚠️ Troubleshooting

### Error: "Permission denied"

```bash
# Ajustar permisos
chmod -R 755 /Users/T054810/kairoframe
```

### Error: "Directory not found"

```bash
# Crear manualmente
mkdir -p /Users/T054810/kairoframe/{postgres,uploads/items}
```

### Base de datos no inicia

```bash
# Verificar permisos del directorio postgres
ls -la /Users/T054810/kairoframe/postgres

# PostgreSQL necesita que el directorio esté vacío en el primer inicio
# Si hay problemas, eliminar contenido:
rm -rf /Users/T054810/kairoframe/postgres/*
docker compose up -d db
```

---

## 🎁 Ventajas de esta configuración

| Antes (volúmenes Docker) | Ahora (directorios locales) |
|--------------------------|----------------------------|
| `docker volume ls` | `ls /Users/T054810/kairoframe` |
| `docker cp ...` para copiar | `cp -r ...` directamente |
| Oculto en `/var/lib/docker` | Visible en tu disco |
| Difícil de migrar | Copiar carpeta = migración |
| Backup complejo | `tar -czf backup.tar.gz ...` |

---

## 📝 Notas importantes

1. **Primer inicio**: Si el directorio `postgres/` está vacío, PostgreSQL lo inicializará automáticamente
2. **No editar archivos de PostgreSQL**: Solo la carpeta `uploads/` es segura para manipular manualmente
3. **Gitignore**: El directorio `DIR_VOLUMENES` NO debe estar en Git (ya está en `.gitignore` si usas `./data`)
4. **Windows**: Usa rutas como `C:/kairoframe` o `/c/kairoframe` (no `C:\kairoframe`)

---

## 🆘 Soporte

Si tienes problemas con la migración:

```bash
# Ver logs de los contenedores
docker compose logs db
docker compose logs backend

# Verificar estado
docker compose ps
```
