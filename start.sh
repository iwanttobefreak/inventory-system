#!/bin/bash

# Script de inicio compatible con Docker y Podman
# Detecta qué motor de contenedores está disponible y lo usa

set -e

echo "🚀 Sistema de Inventario Audiovisual"
echo "===================================="
echo ""

# Función para detectar el comando de compose correcto
detect_compose_command() {
    # Probar docker compose (nuevo, sin guion)
    if docker compose version &> /dev/null; then
        echo "docker compose"
        return 0
    fi
    
    # Probar docker-compose (antiguo, con guion)
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
        return 0
    fi
    
    # Probar podman-compose
    if command -v podman-compose &> /dev/null; then
        echo "podman-compose"
        return 0
    fi
    
    return 1
}

# Detectar el motor de contenedores
if command -v docker &> /dev/null && docker info &> /dev/null; then
    ENGINE="docker"
    echo "✅ Usando Docker"
elif command -v podman &> /dev/null; then
    ENGINE="podman"
    echo "✅ Usando Podman"
    # Intentar arrancar la máquina de Podman si es necesario
    if ! podman info &> /dev/null; then
        echo "🔄 Arrancando máquina de Podman..."
        podman machine start 2>/dev/null || true
    fi
else
    echo "❌ Error: No se encontró Docker ni Podman instalado"
    echo ""
    echo "Por favor instala uno de los siguientes:"
    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
    echo "  - Podman: https://podman.io/getting-started/installation"
    exit 1
fi

# Detectar el comando de compose
COMPOSE_CMD=$(detect_compose_command)
if [ $? -ne 0 ]; then
    echo "❌ Error: No se encontró docker compose, docker-compose ni podman-compose"
    echo ""
    echo "Instala Docker Compose desde: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "📦 Usando comando: $COMPOSE_CMD"
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
