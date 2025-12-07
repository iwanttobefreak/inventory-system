#!/bin/bash

# ====================================================
# Script de migración de volúmenes Docker a directorios locales
# ====================================================

set -e  # Detener si hay errores

echo "🔄 Migrando volúmenes Docker a directorios locales..."
echo ""

# Cargar DIR_VOLUMENES del .env
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

echo "📁 Directorio de destino: $DIR_VOLUMENES"
echo ""

# Crear directorios si no existen
echo "📂 Creando estructura de directorios..."
mkdir -p "$DIR_VOLUMENES/postgres"
mkdir -p "$DIR_VOLUMENES/uploads/items"
echo "✅ Directorios creados"
echo ""

# Copiar datos de PostgreSQL
echo "💾 Copiando base de datos PostgreSQL..."
if docker ps | grep -q inventory_db; then
    docker cp inventory_db:/var/lib/postgresql/data/. "$DIR_VOLUMENES/postgres/" 2>/dev/null || echo "⚠️  Base de datos vacía o no accesible"
else
    echo "⚠️  Contenedor de base de datos no está corriendo"
fi
echo ""

# Copiar imágenes
echo "🖼️  Copiando imágenes subidas..."
if docker ps | grep -q inventory_backend; then
    docker cp inventory_backend:/app/uploads/. "$DIR_VOLUMENES/uploads/" 2>/dev/null || echo "⚠️  No hay imágenes para copiar"
else
    echo "⚠️  Contenedor backend no está corriendo"
fi
echo ""

# Permisos
echo "🔐 Ajustando permisos..."
chmod -R 755 "$DIR_VOLUMENES"
echo "✅ Permisos ajustados"
echo ""

# Resumen
echo "════════════════════════════════════════════════"
echo "✅ MIGRACIÓN COMPLETADA"
echo "════════════════════════════════════════════════"
echo ""
echo "📍 Estructura creada:"
echo "   $DIR_VOLUMENES/"
echo "   ├── postgres/          (Base de datos PostgreSQL)"
echo "   └── uploads/           (Imágenes subidas)"
echo "       └── items/"
echo ""
echo "🔄 Próximos pasos:"
echo "   1. Detener contenedores: docker compose down"
echo "   2. Eliminar volúmenes antiguos (opcional):"
echo "      docker volume rm inventory-system_postgres_data"
echo "      docker volume rm inventory-system_upload_data"
echo "   3. Levantar con nuevos volúmenes: docker compose up -d"
echo ""
echo "💡 Nota: Los datos antiguos están respaldados en los volúmenes Docker originales"
echo ""
