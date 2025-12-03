#!/bin/bash

# ===========================================
# SCRIPT DE INSTALACIÓN LIMPIA
# Sistema de Inventario Audiovisual
# ===========================================

set -e  # Detener si hay errores

echo "🚀 INSTALACIÓN LIMPIA DEL SISTEMA DE INVENTARIO"
echo "=============================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

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

# 1. Verificar que Docker/Podman está instalado
echo "📦 Verificando dependencias..."
if ! command -v docker &> /dev/null && ! command -v podman &> /dev/null; then
    print_error "Ni Docker ni Podman están instalados."
    echo ""
    echo "Instala uno de los siguientes:"
    echo "  - Docker: https://docs.docker.com/get-docker/"
    echo "  - Podman: https://podman.io/getting-started/installation"
    exit 1
fi

# Detectar el comando de compose
COMPOSE_CMD=$(detect_compose_command)
if [ $? -ne 0 ]; then
    print_error "No se encontró docker compose, docker-compose ni podman-compose"
    echo ""
    echo "Instala Docker Compose desde: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Contenedor engine detectado"
print_success "Usando comando: $COMPOSE_CMD"
echo ""

# 2. Detener contenedores si existen
echo "⏹️  Deteniendo contenedores existentes (si los hay)..."
$COMPOSE_CMD down 2>/dev/null || true
print_success "Contenedores detenidos"
echo ""

# 3. Eliminar volúmenes antiguos
echo "🗑️  Eliminando volúmenes antiguos..."
read -p "¿Eliminar base de datos anterior? Esto borrará TODOS los datos. (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    docker volume rm inventory-system_postgres_data 2>/dev/null || true
    docker volume rm $(docker volume ls -q | grep postgres_data) 2>/dev/null || true
    print_success "Volúmenes eliminados"
else
    print_warning "Volúmenes mantenidos (puede causar problemas de credenciales)"
fi
echo ""

# 4. Crear archivo .env si no existe
echo "⚙️  Configurando variables de entorno..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Archivo .env creado desde .env.example"
    else
        print_error ".env.example no encontrado. Creando .env básico..."
        cat > .env << 'EOF'
FRONTEND_PORT=3000
BACKEND_PORT=4000
DB_PORT=5432
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=inventory_pass_2024
POSTGRES_DB=inventory_db
DATABASE_URL=postgresql://inventory_user:inventory_pass_2024@db:5432/inventory_db
JWT_SECRET=tu_secret_super_seguro_cambialo_en_produccion_2024
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
        print_success "Archivo .env creado"
    fi
else
    print_warning "El archivo .env ya existe, se usará el existente"
fi
echo ""

# 5. Preguntar si quiere cambiar puertos
read -p "¿Quieres cambiar los puertos por defecto? (3000/4000) (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    read -p "Puerto para el FRONTEND (default: 3000): " frontend_port
    frontend_port=${frontend_port:-3000}
    
    read -p "Puerto para el BACKEND (default: 4000): " backend_port
    backend_port=${backend_port:-4000}
    
    # Actualizar .env
    sed -i.bak "s/FRONTEND_PORT=.*/FRONTEND_PORT=$frontend_port/" .env
    sed -i.bak "s/BACKEND_PORT=.*/BACKEND_PORT=$backend_port/" .env
    sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://localhost:$backend_port/api|" .env
    sed -i.bak "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=http://localhost:$frontend_port|" .env
    rm .env.bak 2>/dev/null || true
    
    print_success "Puertos actualizados: Frontend=$frontend_port, Backend=$backend_port"
fi
echo ""

# 6. Construir e iniciar contenedores
echo "🏗️  Construyendo e iniciando contenedores..."
echo "Esto puede tardar varios minutos la primera vez..."
$COMPOSE_CMD up -d --build

if [ $? -eq 0 ]; then
    print_success "Contenedores iniciados correctamente"
else
    print_error "Error al iniciar contenedores"
    exit 1
fi
echo ""

# 7. Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# 8. Verificar que los contenedores están corriendo
echo "🔍 Verificando estado de los contenedores..."
$COMPOSE_CMD ps

echo ""
echo "=============================================="
print_success "¡INSTALACIÓN COMPLETADA!"
echo "=============================================="
echo ""
echo "📋 INFORMACIÓN:"
echo "  Frontend: http://localhost:${frontend_port:-3000}"
echo "  Backend:  http://localhost:${backend_port:-4000}"
echo ""
echo "🔑 PRIMER USO:"
echo "  1. Abre: http://localhost:${frontend_port:-3000}"
echo "  2. Haz clic en 'Registrarse'"
echo "  3. Crea tu primer usuario"
echo ""
echo "📚 COMANDOS ÚTILES:"
echo "  Ver logs:      $COMPOSE_CMD logs -f"
echo "  Detener:       $COMPOSE_CMD down"
echo "  Reiniciar:     $COMPOSE_CMD restart"
echo "  Ver estado:    $COMPOSE_CMD ps"
echo ""
echo "📖 MÁS AYUDA:"
echo "  README.md - Documentación general"
echo "  QUICK_START.md - Guía de inicio rápido"
echo "  PORT_CONFIGURATION.md - Cambiar puertos"
echo ""
