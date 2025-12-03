#!/bin/bash

# Script de prueba para verificar la detección de compose

echo "==================================="
echo "TEST: Detección de Compose Command"
echo "==================================="
echo ""

# Probar el script de utilidades
if [ -f "scripts/compose-utils.sh" ]; then
    source scripts/compose-utils.sh
    
    echo "1️⃣ Test: get_compose_command()"
    if COMPOSE_CMD=$(get_compose_command); then
        echo "   ✅ Comando detectado: '$COMPOSE_CMD'"
    else
        echo "   ❌ Error al detectar comando"
        exit 1
    fi
    echo ""
    
    echo "2️⃣ Test: Verificar que el comando funciona"
    if $COMPOSE_CMD version &> /dev/null; then
        echo "   ✅ El comando '$COMPOSE_CMD' funciona correctamente"
        $COMPOSE_CMD version | head -1
    else
        echo "   ❌ El comando '$COMPOSE_CMD' no funciona"
        exit 1
    fi
    echo ""
    
    echo "3️⃣ Test: Ver estado actual de contenedores"
    if $COMPOSE_CMD ps &> /dev/null; then
        echo "   ✅ Comando ps funciona"
        $COMPOSE_CMD ps
    else
        echo "   ⚠️  Advertencia: No se pudo ejecutar ps (puede ser que no haya contenedores)"
    fi
    echo ""
    
    echo "==================================="
    echo "✅ TODOS LOS TESTS PASARON"
    echo "==================================="
    echo ""
    echo "Tu sistema usa: $COMPOSE_CMD"
    echo ""
else
    echo "❌ Error: No se encontró scripts/compose-utils.sh"
    exit 1
fi
