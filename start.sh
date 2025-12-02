#!/bin/bash

# Script de inicio compatible con Docker y Podman
# Detecta qué motor de contenedores está disponible y lo usa

set -e

echo "🚀 Sistema de Inventario Audiovisual"
echo "===================================="
echo ""

# Función para detectar el motor de contenedores
detect_container_engine() {
    if command -v docker &> /dev/null && docker info &> /dev/null; then
        echo "docker"
    elif command -v podman &> /dev/null && podman info &> /dev/null; then
        echo "podman"
    else
        echo "none"
    fi
}

# Detectar motor
ENGINE=$(detect_container_engine)

case $ENGINE in
    docker)
        echo "✅ Usando Docker"
        COMPOSE_CMD="docker-compose"
        ;;
    podman)
        echo "✅ Usando Podman"
        # Verificar si podman-compose está instalado
        if command -v podman-compose &> /dev/null; then
            COMPOSE_CMD="podman-compose"
        else
            echo "📦 podman-compose no encontrado, usando docker-compose con Podman socket"
            # Obtener la ruta del socket de Podman
            PODMAN_SOCK=$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}' 2>/dev/null || echo "")
            if [ -n "$PODMAN_SOCK" ]; then
                export DOCKER_HOST="unix://${PODMAN_SOCK}"
                echo "   Configurado DOCKER_HOST=${DOCKER_HOST}"
            fi
            COMPOSE_CMD="docker-compose"
        fi
        ;;
    none)
        echo "❌ Error: No se encontró Docker ni Podman instalado"
        echo ""
        echo "Por favor instala uno de los siguientes:"
        echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
        echo "  - Podman: https://podman.io/getting-started/installation"
        exit 1
        ;;
esac

echo ""
echo "📋 Comandos disponibles:"
echo "  ./start.sh up      - Levantar servicios"
echo "  ./start.sh down    - Parar servicios"
echo "  ./start.sh logs    - Ver logs"
echo "  ./start.sh restart - Reiniciar servicios"
echo "  ./start.sh clean   - Limpiar todo (⚠️  borra datos)"
echo ""

# Ejecutar comando
COMMAND=${1:-up}

case $COMMAND in
    up)
        echo "🚀 Levantando servicios..."
        $COMPOSE_CMD up --build
        ;;
    up-d|start)
        echo "🚀 Levantando servicios en segundo plano..."
        $COMPOSE_CMD up -d --build
        echo ""
        echo "✅ Servicios levantados!"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend:  http://localhost:4000"
        echo "   Login:    admin@productora.com / admin123"
        echo ""
        echo "📊 Para ver los logs: ./start.sh logs"
        ;;
    down|stop)
        echo "🛑 Parando servicios..."
        $COMPOSE_CMD down
        ;;
    logs)
        echo "📊 Mostrando logs..."
        $COMPOSE_CMD logs -f
        ;;
    restart)
        echo "🔄 Reiniciando servicios..."
        $COMPOSE_CMD restart
        ;;
    clean)
        echo "⚠️  ¿Estás seguro? Esto borrará todos los datos (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "🧹 Limpiando contenedores y volúmenes..."
            $COMPOSE_CMD down -v
            echo "✅ Limpieza completada"
        else
            echo "❌ Operación cancelada"
        fi
        ;;
    rebuild)
        echo "🔨 Reconstruyendo contenedores..."
        $COMPOSE_CMD down
        $COMPOSE_CMD up --build -d
        echo "✅ Reconstrucción completada"
        ;;
    ps|status)
        echo "📊 Estado de los servicios:"
        $COMPOSE_CMD ps
        ;;
    *)
        echo "❌ Comando desconocido: $COMMAND"
        echo ""
        echo "Comandos disponibles:"
        echo "  up, start    - Levantar servicios"
        echo "  down, stop   - Parar servicios"
        echo "  logs         - Ver logs"
        echo "  restart      - Reiniciar servicios"
        echo "  rebuild      - Reconstruir contenedores"
        echo "  clean        - Limpiar todo"
        echo "  ps, status   - Ver estado"
        exit 1
        ;;
esac
