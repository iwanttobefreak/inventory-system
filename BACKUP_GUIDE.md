# 📦 Sistema de Backup y Restauración

## 🎯 Descripción

Sistema automatizado de backup para el inventario Kairoframe que incluye:
- 📸 **Imágenes de artículos** (uploads)
- 💾 **Base de datos PostgreSQL** (dump SQL)
- 🗜️ **Compresión automática** (tar.gz)
- 🧹 **Limpieza de backups antiguos** (> 7 días)

---

## 🚀 Uso rápido

### Hacer backup
```bash
./backup.sh
```

### Restaurar backup
```bash
./restore.sh /Users/T054810/backups/kairoframe/kairoframe-backup-YYYYMMDD-HHMMSS.tar.gz
```

---

## 📂 Estructura de backups

```
~/backups/kairoframe/
├── kairoframe-backup-20251207-021620.tar.gz
├── kairoframe-backup-20251206-140000.tar.gz
└── kairoframe-backup-20251205-093000.tar.gz
```

Cada backup contiene:
```
20251207-021620/
├── uploads/              ← Imágenes de artículos
│   └── items/
│       └── *.jpg
└── database.sql          ← Dump completo de PostgreSQL
```

---

## 🔧 Configuración

### Variables de entorno (`.env`)

```bash
# Directorio donde están los datos originales
DIR_VOLUMENES=/Users/T054810/kairoframe

# Directorio donde se guardan los backups (opcional)
BACKUP_DIR=/Users/T054810/backups/kairoframe
```

Si no defines `BACKUP_DIR`, se usa `~/backups/kairoframe` por defecto.

---

## 📋 Script: `backup.sh`

### ¿Qué hace?

1. ✅ Lee `DIR_VOLUMENES` del archivo `.env`
2. ✅ Copia todas las imágenes de `uploads/`
3. ✅ Exporta la base de datos con `pg_dump`
4. ✅ Comprime todo en un `.tar.gz`
5. ✅ Elimina backups anteriores a 7 días
6. ✅ Muestra resumen y últimos backups

### Ejemplo de salida

```
🔄 Iniciando backup del sistema de inventario...

📁 Origen: /Users/T054810/kairoframe
📦 Destino: /Users/T054810/backups/kairoframe/20251207-021620

📸 Copiando imágenes...
   ✅ Imágenes:  32K

💾 Exportando base de datos...
   ✅ Base de datos:  24K

🗜️  Comprimiendo backup...
   ✅ Archivo comprimido:  40K

✅ BACKUP COMPLETADO
📦 Archivo: kairoframe-backup-20251207-021620.tar.gz
📊 Tamaño:  40K
```

### Personalización

```bash
# Cambiar directorio de destino
BACKUP_DIR=/mnt/backup/kairoframe ./backup.sh

# Cambiar retención (días)
# Editar línea en backup.sh:
find "$BACKUP_BASE_DIR" -name "kairoframe-backup-*.tar.gz" -type f -mtime +30 -delete
# +7 = 7 días, +30 = 30 días
```

---

## 🔄 Script: `restore.sh`

### ¿Qué hace?

1. ✅ Verifica que el archivo de backup exista
2. ✅ Detiene todos los contenedores Docker
3. ✅ Extrae el backup en directorio temporal
4. ✅ Restaura las imágenes en `DIR_VOLUMENES/uploads/`
5. ✅ Limpia la base de datos PostgreSQL
6. ✅ Restaura el dump SQL
7. ✅ Levanta todos los contenedores

### Uso

```bash
# Ver backups disponibles
ls -lh ~/backups/kairoframe/

# Restaurar un backup específico
./restore.sh ~/backups/kairoframe/kairoframe-backup-20251207-021620.tar.gz

# El script pedirá confirmación
⚠️  ¿Estás seguro? Esto sobrescribirá los datos actuales (y/N): y
```

### ⚠️ Advertencias

- **Destruye datos actuales**: Sobrescribe todo en `DIR_VOLUMENES`
- **Detiene servicios**: El sistema no estará disponible durante la restauración
- **Requiere confirmación**: No se ejecuta sin confirmar

---

## ⏰ Backup automático programado

### macOS (launchd)

Crear archivo: `~/Library/LaunchAgents/com.kairoframe.backup.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kairoframe.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/T054810/copilot/pruebas/kairo/inventory-system/backup.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/T054810/copilot/pruebas/kairo/inventory-system</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/T054810/backups/kairoframe/backup.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/T054810/backups/kairoframe/backup-error.log</string>
</dict>
</plist>
```

Activar:
```bash
launchctl load ~/Library/LaunchAgents/com.kairoframe.backup.plist
```

### Linux (crontab)

```bash
# Editar crontab
crontab -e

# Añadir línea (backup diario a las 2:00 AM)
0 2 * * * cd /home/user/inventory-system && ./backup.sh >> /home/user/backups/kairoframe/backup.log 2>&1
```

---

## 🌐 Backup remoto

### Enviar a servidor remoto (SSH)

```bash
#!/bin/bash
# backup-remote.sh

# Hacer backup local
./backup.sh

# Obtener último backup
LATEST_BACKUP=$(ls -t ~/backups/kairoframe/kairoframe-backup-*.tar.gz | head -1)

# Enviar por SCP
scp "$LATEST_BACKUP" user@servidor-remoto:/backups/kairoframe/

echo "✅ Backup enviado a servidor remoto"
```

### Sincronizar con rsync

```bash
#!/bin/bash
# sync-backups.sh

rsync -avz --progress \
  ~/backups/kairoframe/ \
  user@servidor-remoto:/backups/kairoframe/
```

---

## 📊 Monitoreo de backups

### Verificar último backup

```bash
ls -lht ~/backups/kairoframe/ | head -3
```

### Verificar tamaño total

```bash
du -sh ~/backups/kairoframe/
```

### Verificar antigüedad del último backup

```bash
# Último backup hace cuántos días
find ~/backups/kairoframe/ -name "*.tar.gz" -type f -mtime -1 | wc -l
# Si es 0, no hay backup de hoy
```

---

## 🧪 Testing

### Test de backup

```bash
# Hacer backup
./backup.sh

# Verificar que se creó
ls -lh ~/backups/kairoframe/kairoframe-backup-*.tar.gz | tail -1

# Extraer en directorio temporal para verificar
mkdir -p /tmp/test-backup
tar -xzf ~/backups/kairoframe/kairoframe-backup-*.tar.gz -C /tmp/test-backup
ls -R /tmp/test-backup/
```

### Test de restauración (sin riesgo)

```bash
# Hacer backup actual primero
./backup.sh

# Crear backup de prueba
echo "Test" > /tmp/test-backup.tar.gz

# NO ejecutar restore con datos reales sin backup reciente
```

---

## 🆘 Troubleshooting

### Error: "DIR_VOLUMENES no está definido"

```bash
# Verificar .env
cat .env | grep DIR_VOLUMENES

# Si no existe, añadirlo
echo "DIR_VOLUMENES=/Users/T054810/kairoframe" >> .env
```

### Error: "Container inventory_db is not running"

```bash
# Levantar contenedores
docker compose up -d

# Esperar 5 segundos e intentar de nuevo
sleep 5
./backup.sh
```

### Backup muy grande

```bash
# Ver qué ocupa más
du -sh ~/backups/kairoframe/*

# Comprimir con más compresión
# Editar backup.sh, cambiar:
tar -czf archivo.tar.gz ...
# Por:
tar -czf archivo.tar.gz --use-compress-program="gzip -9" ...
```

---

## 📚 Archivos relacionados

- `backup.sh` - Script de backup automático
- `restore.sh` - Script de restauración
- `migrate-to-local-volumes.sh` - Script de migración inicial
- `VOLUMES_GUIDE.md` - Guía completa de volúmenes
- `MIGRATION_SUMMARY.md` - Resumen de la migración

---

## ✅ Checklist de seguridad

- [x] Los backups se guardan fuera del proyecto
- [x] Los backups están en `.gitignore`
- [x] Hay limpieza automática de backups antiguos
- [x] El restore pide confirmación antes de ejecutar
- [ ] Configurar backup automático diario
- [ ] Configurar backup remoto (opcional)
- [ ] Probar restauración en entorno de test

---

**💡 Recomendación**: Prueba la restauración al menos una vez al mes para verificar que los backups son válidos.
