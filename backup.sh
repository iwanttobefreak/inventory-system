#!/bin/bash

# ====================================================
# Script de backup automático del sistema de inventario
# ====================================================

set -e  # Detener si hay errores

# Cargar configuración del .env
if [ -f .env ]; then
    export $(cat .env | grep DIR_VOLUMENES | xargs)
else
    echo "❌ Error: No se encontró el archivo .env"
    exit 1
fi

# Verificar que DIR_VOLUMENES esté definido
if [ -z "$DIR_VOLUMENES" ]; then
    echo "❌ Error: DIR_VOLUMENES no está definido en .env"
    exit 1
fi

# Configuración
BACKUP_BASE_DIR="${BACKUP_DIR:-$HOME/backups/kairoframe}"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$DATE"

echo "🔄 Iniciando backup del sistema de inventario..."
echo ""
echo "📁 Origen: $DIR_VOLUMENES"
echo "📦 Destino: $BACKUP_DIR"
echo ""

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

# Opción 1: Backup de archivos (imágenes)
echo "📸 Copiando imágenes..."
cp -r "$DIR_VOLUMENES/uploads" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  No hay imágenes para copiar"
IMAGES_SIZE=$(du -sh "$BACKUP_DIR/uploads" 2>/dev/null | cut -f1)
echo "   ✅ Imágenes: $IMAGES_SIZE"
echo ""

# Opción 2: Dump de base de datos (más eficiente que copiar archivos de PostgreSQL)
echo "💾 Exportando base de datos..."
if docker ps | grep -q inventory_db; then
    docker exec inventory_db pg_dump -U inventory_user inventory_db > "$BACKUP_DIR/database.sql" 2>/dev/null
    DB_SIZE=$(du -sh "$BACKUP_DIR/database.sql" | cut -f1)
    echo "   ✅ Base de datos: $DB_SIZE"
else
    echo "   ⚠️  Contenedor de base de datos no disponible"
fi
echo ""

# Comprimir todo
echo "🗜️  Comprimiendo backup..."
cd "$BACKUP_BASE_DIR"
tar -czf "kairoframe-backup-$DATE.tar.gz" "$DATE/"
COMPRESSED_SIZE=$(du -sh "kairoframe-backup-$DATE.tar.gz" | cut -f1)
echo "   ✅ Archivo comprimido: $COMPRESSED_SIZE"
echo ""

# Eliminar directorio sin comprimir
rm -rf "$DATE"

# Limpiar backups antiguos (mantener últimos 7 días)
echo "🧹 Limpiando backups antiguos (manteniendo últimos 7 días)..."
find "$BACKUP_BASE_DIR" -name "kairoframe-backup-*.tar.gz" -type f -mtime +7 -delete 2>/dev/null || true
REMAINING=$(find "$BACKUP_BASE_DIR" -name "kairoframe-backup-*.tar.gz" -type f | wc -l | tr -d ' ')
echo "   ✅ Backups restantes: $REMAINING"
echo ""

# Resumen
echo "════════════════════════════════════════════════"
echo "✅ BACKUP COMPLETADO"
echo "════════════════════════════════════════════════"
echo ""
echo "📦 Archivo: kairoframe-backup-$DATE.tar.gz"
echo "📍 Ubicación: $BACKUP_BASE_DIR/"
echo "📊 Tamaño: $COMPRESSED_SIZE"
echo ""
echo "🔄 Para restaurar:"
echo "   tar -xzf kairoframe-backup-$DATE.tar.gz"
echo "   # Copiar uploads/ y restaurar database.sql"
echo ""

# Listar últimos backups
echo "📚 Últimos backups disponibles:"
ls -lht "$BACKUP_BASE_DIR"/kairoframe-backup-*.tar.gz 2>/dev/null | head -5 | awk '{print "   ", $9, "("$5")"}'
echo ""
