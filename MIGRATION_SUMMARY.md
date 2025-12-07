# ✅ Migración a Volúmenes Locales Completada

**Fecha**: 7 de diciembre de 2025

## 🎉 Resumen de cambios

Se ha migrado exitosamente de **volúmenes Docker** a **directorios locales** para una mejor gestión de datos persistentes.

---

## 📊 Estado actual

### ✅ Volúmenes configurados

```
/Users/T054810/kairoframe/
├── postgres/        (62 MB) - Base de datos PostgreSQL
└── uploads/         (32 KB) - Imágenes de artículos
    └── items/
        └── kf-0003-1765069320570.jpg
```

### ✅ Contenedores activos

```
✓ inventory_db         (postgres:16-alpine)
✓ inventory_backend    (inventory-system-backend)
✓ inventory_frontend   (inventory-system-frontend)
```

### ✅ Verificación de montajes

- **Backend**: `/Users/T054810/kairoframe/uploads` → `/app/uploads`
- **Database**: `/Users/T054810/kairoframe/postgres` → `/var/lib/postgresql/data`

---

## 📝 Archivos modificados

### 1. `.env`
```bash
# Nueva variable añadida:
DIR_VOLUMENES=/Users/T054810/kairoframe
```

### 2. `docker-compose.yml`
```yaml
# Cambio de volúmenes Docker a bind mounts:
volumes:
  - ${DIR_VOLUMENES:-./data}/postgres:/var/lib/postgresql/data
  - ${DIR_VOLUMENES:-./data}/uploads:/app/uploads
```

### 3. Nuevos archivos
- ✅ `migrate-to-local-volumes.sh` - Script de migración automática
- ✅ `VOLUMES_GUIDE.md` - Documentación completa de volúmenes

---

## 🚀 Ventajas de la nueva configuración

| Característica | Antes | Ahora |
|----------------|-------|-------|
| **Ubicación** | Oculto en volúmenes Docker | `/Users/T054810/kairoframe` |
| **Backup** | `docker cp ...` | `cp -r /Users/T054810/kairoframe backup/` |
| **Migración** | Complejo | Copiar carpeta y listo |
| **Visibilidad** | Solo con comandos Docker | Finder / terminal normal |
| **Portabilidad** | Difícil | Muy fácil |

---

## 💾 Cómo hacer backups ahora

### Backup completo
```bash
# Copiar todo
cp -r /Users/T054810/kairoframe /Users/T054810/backups/kairoframe-$(date +%Y%m%d)

# O comprimir
tar -czf backup-$(date +%Y%m%d).tar.gz /Users/T054810/kairoframe
```

### Backup solo de imágenes
```bash
cp -r /Users/T054810/kairoframe/uploads /Users/T054810/backups/
```

### Backup de base de datos (SQL dump)
```bash
docker exec inventory_db pg_dump -U inventory_user inventory_db > backup-db.sql
```

---

## 🔄 Migrar a otro servidor

### Paso 1: En el servidor origen
```bash
cd /Users/T054810
tar -czf kairoframe-full-backup.tar.gz kairoframe/
# Copiar kairoframe-full-backup.tar.gz al nuevo servidor
```

### Paso 2: En el servidor destino
```bash
# Descomprimir
tar -xzf kairoframe-full-backup.tar.gz -C /ruta/destino/

# Editar .env del proyecto
vim inventory-system/.env
# Cambiar: DIR_VOLUMENES=/ruta/destino/kairoframe

# Levantar
cd inventory-system
docker compose up -d
```

✅ **¡Listo!** Todos los datos (base de datos + imágenes) están migrados.

---

## 🧹 Limpieza opcional de volúmenes Docker antiguos

Los volúmenes Docker antiguos aún existen como respaldo. Si quieres eliminarlos:

```bash
# Ver volúmenes existentes
docker volume ls

# Eliminar volúmenes antiguos (CUIDADO: son los backups)
docker volume rm inventory-system_postgres_data
docker volume rm inventory-system_upload_data
```

⚠️ **Solo eliminar si estás seguro de que todo funciona correctamente con los nuevos volúmenes.**

---

## ✅ Tests realizados

- [x] Contenedores iniciados correctamente
- [x] Base de datos accesible
- [x] Backend puede leer/escribir en `/app/uploads`
- [x] Imágenes existentes accesibles
- [x] Frontend conectado al backend
- [x] Volúmenes montados desde rutas locales
- [x] Permisos correctos en directorios

---

## 📚 Documentación adicional

- **Guía completa**: `VOLUMES_GUIDE.md`
- **Script de migración**: `migrate-to-local-volumes.sh`

---

## 🆘 Soporte

Si hay problemas:

```bash
# Ver logs
docker compose logs

# Verificar montajes
docker inspect inventory_backend | grep -A 5 Mounts
docker inspect inventory_db | grep -A 5 Mounts

# Ver estado
docker compose ps
```

---

**🎯 Conclusión**: La migración fue exitosa. Ahora es mucho más fácil hacer backups y migrar el sistema completo a otro servidor.
