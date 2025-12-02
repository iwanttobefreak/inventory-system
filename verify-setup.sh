#!/bin/bash

# Script para verificar la configuración de nginx y la aplicación

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

DOMAIN="kairoframe.lobo99.info"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🧪 Verificación de Configuración - ${DOMAIN}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 1. Verificar contenedores Docker
echo -e "${YELLOW}1️⃣  Verificando contenedores Docker...${NC}"
if command -v docker-compose &> /dev/null; then
    CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)
    if [ "$CONTAINERS" -ge 3 ]; then
        echo -e "${GREEN}✅ Contenedores corriendo: $CONTAINERS${NC}"
        docker-compose ps --format "table {{.Name}}\t{{.Status}}" | grep -v "^NAME"
    else
        echo -e "${RED}❌ Faltan contenedores. Ejecuta: docker-compose up -d${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  docker-compose no encontrado, saltando verificación${NC}"
fi
echo ""

# 2. Verificar backend local
echo -e "${YELLOW}2️⃣  Verificando backend local (http://localhost:4000/health)...${NC}"
HEALTH_LOCAL=$(curl -s http://localhost:4000/health 2>/dev/null || echo "error")
if [[ "$HEALTH_LOCAL" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend local funcionando${NC}"
    echo "   $HEALTH_LOCAL"
else
    echo -e "${RED}❌ Backend local no responde${NC}"
    exit 1
fi
echo ""

# 3. Verificar frontend local
echo -e "${YELLOW}3️⃣  Verificando frontend local (http://localhost:3000)...${NC}"
FRONTEND_LOCAL=$(curl -s -I http://localhost:3000 2>/dev/null | head -1)
if [[ "$FRONTEND_LOCAL" == *"200"* ]]; then
    echo -e "${GREEN}✅ Frontend local funcionando${NC}"
    echo "   $FRONTEND_LOCAL"
else
    echo -e "${RED}❌ Frontend local no responde${NC}"
    exit 1
fi
echo ""

# 4. Verificar DNS
echo -e "${YELLOW}4️⃣  Verificando DNS para ${DOMAIN}...${NC}"
DNS_IP=$(dig +short $DOMAIN 2>/dev/null | head -1)
if [ -z "$DNS_IP" ]; then
    DNS_IP=$(host $DOMAIN 2>/dev/null | grep "has address" | awk '{print $4}' | head -1)
fi

if [ -n "$DNS_IP" ]; then
    echo -e "${GREEN}✅ DNS resuelve a: $DNS_IP${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo resolver DNS (puede ser normal si solo usas en red local)${NC}"
fi
echo ""

# 5. Verificar health check a través de nginx
echo -e "${YELLOW}5️⃣  Verificando health check a través de nginx...${NC}"
HEALTH_NGINX=$(curl -s http://${DOMAIN}/health 2>/dev/null || echo "error")
if [[ "$HEALTH_NGINX" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Health check a través de nginx funcionando${NC}"
    echo "   $HEALTH_NGINX"
else
    echo -e "${RED}❌ No se pudo conectar a través de nginx${NC}"
    echo -e "${YELLOW}   Verifica que nginx esté configurado y corriendo${NC}"
    echo -e "${YELLOW}   Comando: sudo systemctl status nginx${NC}"
fi
echo ""

# 6. Verificar login API a través de nginx
echo -e "${YELLOW}6️⃣  Verificando login API a través de nginx...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://${DOMAIN}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@productora.com","password":"admin123"}' 2>/dev/null || echo "error")

if [[ "$LOGIN_RESPONSE" == *"token"* ]]; then
    echo -e "${GREEN}✅ Login API funcionando correctamente${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-30)
    echo "   Token recibido: ${TOKEN}..."
else
    echo -e "${RED}❌ Login API no funciona a través de nginx${NC}"
    echo "   Respuesta: $LOGIN_RESPONSE"
fi
echo ""

# 7. Verificar frontend a través de nginx
echo -e "${YELLOW}7️⃣  Verificando frontend a través de nginx...${NC}"
FRONTEND_NGINX=$(curl -s -I http://${DOMAIN} 2>/dev/null | head -1)
if [[ "$FRONTEND_NGINX" == *"200"* ]]; then
    echo -e "${GREEN}✅ Frontend accesible a través de nginx${NC}"
    echo "   $FRONTEND_NGINX"
else
    echo -e "${RED}❌ Frontend no accesible a través de nginx${NC}"
    echo "   Respuesta: $FRONTEND_NGINX"
fi
echo ""

# 8. Verificar configuración del frontend
echo -e "${YELLOW}8️⃣  Verificando configuración del frontend...${NC}"
if [ -f "frontend/.env.local" ]; then
    API_URL=$(grep "NEXT_PUBLIC_API_URL" frontend/.env.local | cut -d'=' -f2 | tr -d ' ')
    if [[ "$API_URL" == "/api" ]]; then
        echo -e "${GREEN}✅ Frontend configurado correctamente para nginx${NC}"
        echo "   NEXT_PUBLIC_API_URL=/api (usa rutas relativas)"
    elif [[ "$API_URL" == "http://localhost:4000/api" ]]; then
        echo -e "${YELLOW}⚠️  Frontend configurado para desarrollo local${NC}"
        echo "   NEXT_PUBLIC_API_URL=http://localhost:4000/api"
        echo -e "${YELLOW}   Para producción, cambia a: NEXT_PUBLIC_API_URL=/api${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuración API: $API_URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Archivo .env.local no encontrado${NC}"
fi
echo ""

# Resumen
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 Resumen${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [[ "$HEALTH_NGINX" == *"ok"* ]] && [[ "$LOGIN_RESPONSE" == *"token"* ]]; then
    echo -e "${GREEN}✅ Todo funcionando correctamente!${NC}\n"
    echo -e "Accede desde cualquier dispositivo:"
    echo -e "  📱 Móvil: ${BLUE}http://${DOMAIN}${NC}"
    echo -e "  💻 Desktop: ${BLUE}http://${DOMAIN}${NC}"
    echo -e ""
    echo -e "Credenciales de prueba:"
    echo -e "  📧 Email: admin@productora.com"
    echo -e "  🔑 Password: admin123"
else
    echo -e "${YELLOW}⚠️  Algunos servicios no están funcionando correctamente${NC}\n"
    echo -e "Soluciones:"
    echo -e "  1. Verifica que docker esté corriendo: ${BLUE}docker-compose ps${NC}"
    echo -e "  2. Verifica nginx: ${BLUE}sudo systemctl status nginx${NC}"
    echo -e "  3. Revisa logs: ${BLUE}docker-compose logs backend${NC}"
    echo -e "  4. Consulta: ${BLUE}NGINX_SETUP.md${NC}"
fi

echo ""
