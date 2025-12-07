#!/bin/bash

# ====================================================
# Script de restauración de backup
# ====================================================

set -e

# Verificar argumentos
if [ -z "$1" ]; then
    echo "❌ Error: Debe especificar el archivo de backup"
    echo ""
    echo "Uso: ./restore.sh <archivo-backup.tar.gz>"
    echo ""
    echo "📚 Backups disponibles:"
    ls -lht ~/backups/kairoframe/kairoframe-backup-*.tar.gz 2>/dev/null | head -5 | awk '{print "   ", $9}'
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: El archivo $BACKUP_FILE no existe"
    exit 1
fi

# Cargar configuración
if [ -f .env ]; then
    export $(cat .env | grep DIR_VOLUMENES | xargs)
else
    echo "❌ Error: No se encontró el archivo .env"
    exit 1
fi

echo "🔄 Restaurando backup..."
echo ""
echo "📦 Archivo: $BACKUP_FILE"
echo "📁 Destino: $DIR_VOLUMENES"
echo ""

# Advertencia
read -p "⚠️  ¿Estás seguro? Esto sobrescribirá los datos actuales (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restauración cancelada"
    exit 1
fi

# Detener contenedores
echo "🛑 Deteniendo contenedores..."
docker compose down

# Crear directorio temporal
TEMP_DIR=$(mktemp -d)
echo "📂 Extrayendo backup en $TEMP_DIR..."
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Encontrar el directorio extraído
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d ! -path "$TEMP_DIR" | head -1)

# Restaurar imágenes
if [ -d "$EXTRACTED_DIR/uploads" ]; then
    echo "📸 Restaurando imágenes..."
    rm -rf "$DIR_VOLUMENES/uploads"
    cp -r "$EXTRACTED_DIR/uploads" "$DIR_VOLUMENES/"
    echo "   ✅ Imágenes restauradas"
else
    echo "   ⚠️  No hay imágenes en el backup"
fi

# Restaurar base de datos
if [ -f "$EXTRACTED_DIR/database.sql" ]; then
    echo "💾 Restaurando base de datos..."
    
    # Limpiar directorio de postgres
    rm -rf "$DIR_VOLUMENES/postgres"/*
    
    # Levantar solo la base de datos
    docker compose up -d db
    sleep 5
    
    # Restaurar dump
    docker exec -i inventory_db psql -U inventory_user inventory_db < "$EXTRACTED_DIR/database.sql"
    echo "   ✅ Base de datos restaurada"
else
    echo "   ⚠️  No hay backup de base de datos"
fi

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

# Levantar todos los contenedores
echo "🚀 Levantando contenedores..."
docker compose up -d

echo ""
echo "════════════════════════════════════════════════"
echo "✅ RESTAURACIÓN COMPLETADA"
echo "════════════════════════════════════════════════"
echo ""
echo "🔍 Verificar estado:"
echo "   docker compose ps"
echo "   docker compose logs"
echo ""
