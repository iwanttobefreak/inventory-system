# 🚀 Instrucciones para subir a GitHub

## Paso 1: Crear el repositorio en GitHub (Opción Web)

1. Ve a https://github.com/new
2. Nombre del repositorio: `inventory-system`
3. Descripción: `Sistema de inventario audiovisual con QR, categorías, atributos personalizados y mensaje de contacto para artículos perdidos`
4. Público o Privado (según prefieras)
5. **NO** marques "Add a README file" (ya existe)
6. Click en "Create repository"

## Paso 2: Conectar el repositorio local con GitHub

Una vez creado el repositorio en GitHub, ejecuta estos comandos:

```bash
cd /Users/T054810/copilot/pruebas/kairo/inventory-system

# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/inventory-system.git

# Subir el código
git branch -M main
git push -u origin main
```

## Paso 3: Verificar

Ve a `https://github.com/TU_USUARIO/inventory-system` y deberías ver todo el código subido.

---

## 📦 Contenido del repositorio

Este repositorio incluye:

✅ **Backend** (Node.js + Express + Prisma + PostgreSQL)
- API REST completa
- Autenticación JWT
- Sistema de atributos personalizados por categoría
- Gestión de usuarios

✅ **Frontend** (Next.js 14 + React + TypeScript + Tailwind CSS)
- Dashboard de inventario
- Generación de QR codes
- Sistema de categorías con atributos personalizados
- Página pública para artículos perdidos con mensaje de contacto
- Generación automática de nombres basados en categoría y atributos

✅ **Docker**
- `docker-compose.yml` configurado
- Dockerfile para frontend y backend
- Base de datos PostgreSQL

✅ **Documentación**
- Guías de uso (ADMIN_GUIDE.md, QUICK_START.md, etc.)
- Documentación de features (LABELS_FEATURE.md, LABELS_GUIDE.md)
- Guías de deployment (DEPLOY.md, MIGRATION_GUIDE.md)

---

## 🔐 Configuración para push con token

Si prefieres usar un token personal de acceso:

```bash
# Configurar credenciales con el token
git remote set-url origin https://TU_TOKEN@github.com/TU_USUARIO/inventory-system.git

# Push
git push -u origin main
```

**⚠️ IMPORTANTE:** 
- Reemplaza `TU_TOKEN` con tu Personal Access Token de GitHub
- Reemplaza `TU_USUARIO` con tu nombre de usuario
- No compartas tu token públicamente
- Más info: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

