#!/bin/bash
# Script de configuración de Nginx para Kairoframe
# Ejecutar como root: sudo bash setup-nginx.sh

set -e

echo "🔧 Configurando Nginx para Kairoframe..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx no está instalado${NC}"
    echo "Instalando nginx..."
    apt update
    apt install -y nginx
fi

# Verificar que los contenedores están corriendo
echo "Verificando contenedores..."
if ! docker ps | grep -q backend; then
    echo -e "${YELLOW}⚠️  Contenedor backend no está corriendo${NC}"
    echo "Por favor, inicia los contenedores primero: cd /ruta/al/proyecto && docker compose up -d"
    exit 1
fi

# Copiar configuración
NGINX_CONF="/etc/nginx/sites-available/kairoframe"
echo "Copiando configuración de nginx..."
cp nginx-kairoframe.conf "$NGINX_CONF"

# Crear symlink si no existe
if [ ! -L "/etc/nginx/sites-enabled/kairoframe" ]; then
    echo "Creando symlink..."
    ln -s "$NGINX_CONF" /etc/nginx/sites-enabled/kairoframe
fi

# Eliminar configuración default si existe
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    echo "Eliminando configuración default..."
    rm /etc/nginx/sites-enabled/default
fi

# Verificar puertos que usa docker
BACKEND_PORT=$(docker ps --filter "name=backend" --format "{{.Ports}}" | grep -oP '0\.0\.0\.0:\K\d+' | head -1)
FRONTEND_PORT=$(docker ps --filter "name=frontend" --format "{{.Ports}}" | grep -oP '0\.0\.0\.0:\K\d+' | head -1)

echo -e "${YELLOW}Puertos detectados:${NC}"
echo "  Backend: $BACKEND_PORT"
echo "  Frontend: $FRONTEND_PORT"

# Si los puertos NO son 4000 y 3000, actualizar la configuración
if [ "$BACKEND_PORT" != "4000" ] || [ "$FRONTEND_PORT" != "3000" ]; then
    echo -e "${YELLOW}⚠️  Los puertos son diferentes a los esperados (3000/4000)${NC}"
    echo "Actualizando configuración de nginx..."
    sed -i "s|localhost:4000|localhost:$BACKEND_PORT|g" "$NGINX_CONF"
    sed -i "s|localhost:3000|localhost:$FRONTEND_PORT|g" "$NGINX_CONF"
fi

# Verificar configuración de nginx
echo "Verificando configuración de nginx..."
if nginx -t; then
    echo -e "${GREEN}✅ Configuración de nginx válida${NC}"
else
    echo -e "${RED}❌ Error en la configuración de nginx${NC}"
    exit 1
fi

# Reiniciar nginx
echo "Reiniciando nginx..."
systemctl restart nginx

echo ""
echo -e "${GREEN}✅ ¡Nginx configurado correctamente!${NC}"
echo ""
echo "Verifica que funciona:"
echo "  - Frontend: https://kairoframe.lobo99.info"
echo "  - API: https://kairoframe.lobo99.info/api/health"
echo ""
echo "Logs de nginx:"
echo "  - Acceso: tail -f /var/log/nginx/kairoframe-access.log"
echo "  - Errores: tail -f /var/log/nginx/kairoframe-error.log"
echo ""

# Verificar certificado SSL
if [ ! -f "/etc/letsencrypt/live/kairoframe.lobo99.info/fullchain.pem" ]; then
    echo -e "${YELLOW}⚠️  No se detectó certificado SSL${NC}"
    echo "Para obtener certificado SSL con Let's Encrypt:"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d kairoframe.lobo99.info"
fi
