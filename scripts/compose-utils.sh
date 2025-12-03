#!/bin/bash

# ===========================================
# UTILIDADES DE DETECCIÓN DE COMPOSE
# Sistema de Inventario Audiovisual
# ===========================================
#
# Este archivo contiene funciones comunes para detectar
# y usar el comando de compose correcto según el sistema
#
# Uso en otros scripts:
#   source scripts/compose-utils.sh
#   COMPOSE_CMD=$(get_compose_command)
#   $COMPOSE_CMD up -d
# ===========================================

# Función para detectar el comando de compose correcto
# Retorna: "docker compose" | "docker-compose" | "podman-compose"
detect_compose_command() {
    # Probar docker compose (nuevo, sin guion) - Docker Desktop moderno
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
        return 0
    fi
    
    # Probar docker-compose (antiguo, con guion) - Docker Compose v1
    if command -v docker-compose &> /dev/null; then
        if docker-compose version &> /dev/null 2>&1; then
            echo "docker-compose"
            return 0
        fi
    fi
    
    # Probar podman-compose
    if command -v podman-compose &> /dev/null; then
        if podman-compose version &> /dev/null 2>&1; then
            echo "podman-compose"
            return 0
        fi
    fi
    
    return 1
}

# Función para verificar e iniciar el motor de contenedores
# Retorna: 0 si todo OK, 1 si hay error
check_container_engine() {
    # Verificar Docker
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null 2>&1; then
            return 0
        else
            echo "⚠️  Docker está instalado pero no está corriendo" >&2
            echo "   Inicia Docker Desktop o el daemon de Docker" >&2
            return 1
        fi
    fi
    
    # Verificar Podman
    if command -v podman &> /dev/null; then
        if podman info &> /dev/null 2>&1; then
            return 0
        else
            echo "🔄 Podman detectado pero no está corriendo, intentando arrancar..." >&2
            if podman machine start &> /dev/null 2>&1; then
                echo "✅ Podman arrancado correctamente" >&2
                return 0
            else
                echo "⚠️  No se pudo arrancar Podman" >&2
                echo "   Ejecuta manualmente: podman machine start" >&2
                return 1
            fi
        fi
    fi
    
    echo "❌ Error: No se encontró Docker ni Podman instalado" >&2
    echo "" >&2
    echo "Por favor instala uno de los siguientes:" >&2
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop" >&2
    echo "  - Podman: https://podman.io/getting-started/installation" >&2
    return 1
}

# Función principal que obtiene el comando de compose
# Verifica el motor y retorna el comando correcto
get_compose_command() {
    # Verificar que el motor de contenedores esté corriendo
    if ! check_container_engine; then
        return 1
    fi
    
    # Detectar el comando de compose
    local compose_cmd=$(detect_compose_command)
    if [ $? -ne 0 ] || [ -z "$compose_cmd" ]; then
        echo "❌ Error: No se encontró docker compose, docker-compose ni podman-compose" >&2
        echo "" >&2
        echo "Instala Docker Compose desde: https://docs.docker.com/compose/install/" >&2
        return 1
    fi
    
    echo "$compose_cmd"
    return 0
}

# Si se ejecuta directamente (no con source), mostrar información
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    echo "🔍 Detectando configuración de contenedores..."
    echo ""
    
    if COMPOSE_CMD=$(get_compose_command); then
        echo "✅ Comando detectado: $COMPOSE_CMD"
        echo ""
        echo "Para usar en tus scripts:"
        echo "  source scripts/compose-utils.sh"
        echo "  COMPOSE_CMD=\$(get_compose_command)"
        echo "  \$COMPOSE_CMD up -d"
    else
        exit 1
    fi
fi
