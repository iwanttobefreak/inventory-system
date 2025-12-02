#!/bin/bash

# 🧪 Script de prueba para la API de gestión de usuarios
# Este script demuestra cómo usar todos los endpoints de usuario

set -e  # Exit on error

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🧪 Prueba de API de Gestión de Usuarios${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 1️⃣ Login como admin
echo -e "${YELLOW}1️⃣  Iniciando sesión como admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@productora.com",
    "password": "admin123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener el token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Login exitoso${NC}"
echo -e "   Token: ${TOKEN:0:20}...\n"

# 2️⃣ Listar usuarios existentes
echo -e "${YELLOW}2️⃣  Listando usuarios existentes...${NC}"
USERS_LIST=$(curl -s -X GET "$API_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Usuarios actuales:${NC}"
echo "$USERS_LIST" | jq '.' 2>/dev/null || echo "$USERS_LIST"
echo ""

# 3️⃣ Crear nuevo usuario
echo -e "${YELLOW}3️⃣  Creando nuevo usuario (técnico de campo)...${NC}"
NEW_USER=$(curl -s -X POST "$API_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tecnico@productora.com",
    "password": "tecnico123",
    "name": "Juan Técnico",
    "role": "USER"
  }')

USER_ID=$(echo "$NEW_USER" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo -e "${YELLOW}⚠️  Usuario ya existe o error al crear${NC}"
  echo "$NEW_USER" | jq '.' 2>/dev/null || echo "$NEW_USER"
else
  echo -e "${GREEN}✅ Usuario creado:${NC}"
  echo "$NEW_USER" | jq '.' 2>/dev/null || echo "$NEW_USER"
fi
echo ""

# 4️⃣ Login como el nuevo usuario
echo -e "${YELLOW}4️⃣  Probando login del nuevo usuario...${NC}"
TECH_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tecnico@productora.com",
    "password": "tecnico123"
  }')

TECH_TOKEN=$(echo "$TECH_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TECH_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  No se pudo hacer login (puede ser que el usuario ya existiera)${NC}"
else
  echo -e "${GREEN}✅ Login exitoso como técnico${NC}"
  echo -e "   Token: ${TECH_TOKEN:0:20}...\n"
  
  # 5️⃣ Cambiar propia contraseña (como técnico)
  echo -e "${YELLOW}5️⃣  Técnico cambiando su propia contraseña...${NC}"
  CHANGE_PASS=$(curl -s -X PUT "$API_URL/api/users/me/password" \
    -H "Authorization: Bearer $TECH_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "currentPassword": "tecnico123",
      "newPassword": "nueva_pass_tecnico_456"
    }')
  
  echo -e "${GREEN}✅ Contraseña cambiada:${NC}"
  echo "$CHANGE_PASS" | jq '.' 2>/dev/null || echo "$CHANGE_PASS"
  echo ""
  
  # 6️⃣ Verificar nuevo login con nueva contraseña
  echo -e "${YELLOW}6️⃣  Verificando login con nueva contraseña...${NC}"
  NEW_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "tecnico@productora.com",
      "password": "nueva_pass_tecnico_456"
    }')
  
  NEW_TOKEN=$(echo "$NEW_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  
  if [ -z "$NEW_TOKEN" ]; then
    echo -e "${RED}❌ Error: No se pudo hacer login con la nueva contraseña${NC}"
  else
    echo -e "${GREEN}✅ Login exitoso con nueva contraseña${NC}\n"
  fi
fi

# 7️⃣ Admin resetea contraseña de técnico
if [ ! -z "$USER_ID" ]; then
  echo -e "${YELLOW}7️⃣  Admin reseteando contraseña del técnico...${NC}"
  RESET_PASS=$(curl -s -X PUT "$API_URL/api/users/$USER_ID/password" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "newPassword": "reset_password_123"
    }')
  
  echo -e "${GREEN}✅ Contraseña reseteada por admin:${NC}"
  echo "$RESET_PASS" | jq '.' 2>/dev/null || echo "$RESET_PASS"
  echo ""
fi

# 8️⃣ Admin actualiza información del usuario
if [ ! -z "$USER_ID" ]; then
  echo -e "${YELLOW}8️⃣  Admin actualizando información del usuario...${NC}"
  UPDATE_USER=$(curl -s -X PUT "$API_URL/api/users/$USER_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Juan Técnico Actualizado",
      "email": "tecnico@productora.com",
      "role": "USER"
    }')
  
  echo -e "${GREEN}✅ Usuario actualizado:${NC}"
  echo "$UPDATE_USER" | jq '.' 2>/dev/null || echo "$UPDATE_USER"
  echo ""
fi

# 9️⃣ Listar todos los usuarios de nuevo
echo -e "${YELLOW}9️⃣  Listando todos los usuarios actualizados...${NC}"
FINAL_USERS=$(curl -s -X GET "$API_URL/api/users" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Lista final de usuarios:${NC}"
echo "$FINAL_USERS" | jq '.' 2>/dev/null || echo "$FINAL_USERS"
echo ""

# 🔟 Limpieza (opcional) - Descomentar si quieres eliminar el usuario de prueba
# echo -e "${YELLOW}🔟 Limpieza: Eliminando usuario de prueba...${NC}"
# if [ ! -z "$USER_ID" ]; then
#   DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/users/$USER_ID" \
#     -H "Authorization: Bearer $TOKEN")
#   
#   echo -e "${GREEN}✅ Usuario eliminado:${NC}"
#   echo "$DELETE_RESPONSE" | jq '.' 2>/dev/null || echo "$DELETE_RESPONSE"
# fi

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Todas las pruebas completadas!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}💡 Tip:${NC} Para ver los usuarios en la base de datos:"
echo -e "   docker-compose exec backend tsx scripts/list-users.ts\n"
