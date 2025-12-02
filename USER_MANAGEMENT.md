# 👥 Gestión de Usuarios y Contraseñas

Esta guía te explica cómo añadir usuarios, cambiar contraseñas y gestionar permisos en el sistema de inventario.

## 📋 Índice

1. [Opciones disponibles](#opciones-disponibles)
2. [Usando la API (Recomendado)](#usando-la-api)
3. [Desde la base de datos](#desde-la-base-de-datos)
4. [Scripts de consola](#scripts-de-consola)
5. [Próximas funciones (UI)](#próximas-funciones)

---

## Opciones Disponibles

### 1️⃣ API REST (Recomendado) ✅
- Cambiar tu propia contraseña
- Los admins pueden crear/editar/eliminar usuarios
- Los admins pueden resetear contraseñas

### 2️⃣ Base de datos directa
- Para emergencias o cuando olvidas la contraseña del admin
- Usando Prisma Studio (GUI)
- Usando SQL directo

### 3️⃣ Scripts de consola
- Para operaciones por lotes
- Automatización

---

## Usando la API

### 🔐 Cambiar tu propia contraseña

**Endpoint**: `PUT /api/users/me/password`

```bash
# Ejemplo con curl
curl -X PUT http://localhost:4000/api/users/me/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "mi_nueva_contraseña_segura"
  }'
```

**Con JavaScript/Fetch:**
```javascript
const response = await fetch('http://localhost:4000/api/users/me/password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    currentPassword: 'admin123',
    newPassword: 'mi_nueva_contraseña_segura'
  })
});

const result = await response.json();
console.log(result); // { message: "Password updated successfully" }
```

---

### 👤 Crear un nuevo usuario (Solo ADMIN)

**Endpoint**: `POST /api/users`

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{
    "email": "nuevo@productora.com",
    "password": "contraseña123",
    "name": "Juan Pérez",
    "role": "USER"
  }'
```

**Roles disponibles:**
- `ADMIN` - Acceso completo, puede gestionar usuarios
- `USER` - Acceso básico, solo gestionar inventario

---

### 🔑 Resetear contraseña de otro usuario (Solo ADMIN)

**Endpoint**: `PUT /api/users/:id/password`

```bash
# Primero obtén el ID del usuario
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Luego resetea la contraseña
curl -X PUT http://localhost:4000/api/users/USER_ID_AQUI/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{
    "newPassword": "nueva_contraseña_temporal"
  }'
```

---

### 📋 Listar todos los usuarios (Solo ADMIN)

**Endpoint**: `GET /api/users`

```bash
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

---

### ✏️ Editar usuario (Solo ADMIN)

**Endpoint**: `PUT /api/users/:id`

```bash
curl -X PUT http://localhost:4000/api/users/USER_ID_AQUI \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -d '{
    "name": "Juan Pérez Actualizado",
    "email": "juan.nuevo@productora.com",
    "role": "ADMIN"
  }'
```

---

### 🗑️ Eliminar usuario (Solo ADMIN)

**Endpoint**: `DELETE /api/users/:id`

```bash
curl -X DELETE http://localhost:4000/api/users/USER_ID_AQUI \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

⚠️ **Nota**: No puedes eliminar tu propia cuenta mientras estás autenticado.

---

## Desde la Base de Datos

### Opción 1: Usando Prisma Studio (GUI) 🖥️

Prisma Studio es una interfaz gráfica para ver y editar datos.

```bash
# Acceder al contenedor backend
docker-compose exec backend sh

# Iniciar Prisma Studio
npx prisma studio
```

Luego abre: http://localhost:5555

**Para cambiar una contraseña:**
1. Ve a la tabla `users`
2. Encuentra el usuario
3. Genera un hash de la nueva contraseña en tu terminal local:

```bash
# En tu Mac (fuera del contenedor)
node -e "console.log(require('bcryptjs').hashSync('nueva_contraseña', 10))"
```

4. Copia el hash y pégalo en el campo `password` en Prisma Studio

---

### Opción 2: SQL Directo

```bash
# Conectarse a la base de datos
docker-compose exec db psql -U inventory_user -d inventory_db
```

**Ver todos los usuarios:**
```sql
SELECT id, email, name, role FROM users;
```

**Crear un nuevo usuario:**
```sql
-- Primero genera el hash de la contraseña
-- En tu Mac: node -e "console.log(require('bcryptjs').hashSync('contraseña123', 10))"

INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'nuevo@productora.com',
  '$2a$10$HASH_GENERADO_AQUI',
  'Nuevo Usuario',
  'USER',
  NOW(),
  NOW()
);
```

**Cambiar contraseña:**
```sql
UPDATE users 
SET password = '$2a$10$NUEVO_HASH_AQUI', "updatedAt" = NOW()
WHERE email = 'admin@productora.com';
```

**Cambiar rol a ADMIN:**
```sql
UPDATE users 
SET role = 'ADMIN', "updatedAt" = NOW()
WHERE email = 'usuario@productora.com';
```

**Eliminar usuario:**
```sql
DELETE FROM users WHERE email = 'usuario@eliminar.com';
```

**Salir de psql:**
```sql
\q
```

---

## Scripts de Consola

### Script para crear usuarios

Crea este archivo: `backend/scripts/create-user.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];
  const role = (process.argv[5] || 'USER') as 'ADMIN' | 'USER';

  if (!email || !password || !name) {
    console.error('❌ Uso: npx tsx scripts/create-user.ts <email> <password> <name> [role]');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    console.log('✅ Usuario creado exitosamente:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('❌ Error: Ya existe un usuario con ese email');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
```

**Uso:**
```bash
# Desde dentro del contenedor backend
docker-compose exec backend npx tsx scripts/create-user.ts \
  "juan@productora.com" \
  "contraseña123" \
  "Juan Pérez" \
  "USER"
```

---

### Script para cambiar contraseña

Este script ya está creado en `backend/scripts/reset-password.ts`

**Uso:**
```bash
docker-compose exec backend npx tsx scripts/reset-password.ts \
  "admin@productora.com" \
  "nueva_contraseña_admin"
```

---

### Script para listar usuarios

Este script ya está creado en `backend/scripts/list-users.ts`

**Uso:**
```bash
docker-compose exec backend npx tsx scripts/list-users.ts
```

---

### Script para eliminar usuarios

Este script ya está creado en `backend/scripts/delete-user.ts`

**Uso:**
```bash
# Primero lista para ver el email exacto
docker-compose exec backend npx tsx scripts/list-users.ts

# Luego elimina
docker-compose exec backend npx tsx scripts/delete-user.ts \
  "usuario@eliminar.com"
```

⚠️ **Advertencia**: Esta acción es irreversible. Asegúrate de tener el email correcto.

---

## Próximas Funciones

### 🎨 Panel de Administración (UI)

Puedes agregar una página en el frontend:

1. **Página de Perfil** (`/profile`)
   - Ver información del usuario
   - Cambiar nombre y email
   - Cambiar contraseña

2. **Panel de Usuarios** (`/admin/users`) - Solo ADMIN
   - Lista de todos los usuarios
   - Crear nuevos usuarios
   - Editar usuarios existentes
   - Resetear contraseñas
   - Eliminar usuarios
   - Cambiar roles

---

## 🔒 Mejores Prácticas de Seguridad

### Contraseñas

✅ **Hacer:**
- Usar contraseñas de al menos 8 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- Cambiar contraseñas periódicamente
- Usar contraseñas únicas para cada usuario

❌ **Evitar:**
- Contraseñas simples como "123456" o "password"
- Reutilizar contraseñas
- Compartir contraseñas entre usuarios
- Dejar la contraseña por defecto "admin123"

### Roles

- **ADMIN**: Solo para personas de confianza total
- **USER**: Para el resto del equipo
- Revisar periódicamente quién tiene acceso

---

## 🆘 Recuperación de Emergencia

### "Olvidé la contraseña del admin"

**Opción 1: Crear un nuevo admin desde la base de datos**

```bash
# 1. Generar hash de contraseña en tu Mac
node -e "console.log(require('bcryptjs').hashSync('nueva_admin_pass', 10))"

# 2. Conectarse a la base de datos
docker-compose exec db psql -U inventory_user -d inventory_db

# 3. Crear nuevo admin
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'recovery@productora.com',
  'TU_HASH_AQUI',
  'Recovery Admin',
  'ADMIN',
  NOW(),
  NOW()
);
```

**Opción 2: Cambiar rol de un usuario existente a ADMIN**

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'usuario_existente@productora.com';
```

---

## 📞 Resumen Rápido

| Acción | Quién puede | Cómo |
|--------|-------------|------|
| Cambiar mi contraseña | Cualquier usuario | API: `PUT /api/users/me/password` |
| Ver mi perfil | Cualquier usuario | Token JWT tiene la info |
| Crear usuarios | Solo ADMIN | API: `POST /api/users` o Script |
| Listar usuarios | Solo ADMIN | API: `GET /api/users` o Script |
| Resetear contraseña de otro | Solo ADMIN | API: `PUT /api/users/:id/password` o Script |
| Eliminar usuario | Solo ADMIN | API: `DELETE /api/users/:id` o Script |
| Recuperación de emergencia | Acceso a servidor | SQL directo o Prisma Studio |

---

## 🎯 Próximos Pasos Recomendados

1. **Cambiar contraseña del admin por defecto**
   ```bash
   # Desde la terminal, hacer un POST a /api/users/me/password
   ```

2. **Crear usuarios para tu equipo**
   ```bash
   # Usar la API POST /api/users
   ```

3. **Documentar las contraseñas de forma segura**
   - Usar un gestor de contraseñas (1Password, Bitwarden, etc.)

4. **Implementar la UI de gestión de usuarios**
   - Página de perfil
   - Panel de administración de usuarios

---

¿Necesitas ayuda implementando la UI o tienes alguna pregunta? ¡Avísame! 🚀

---

## 🧪 Prueba Rápida

Ejecuta el script de prueba automática para verificar que todo funciona:

```bash
./test-user-api.sh
```

Este script prueba todos los endpoints:
- ✅ Login de admin
- ✅ Listar usuarios
- ✅ Crear nuevo usuario
- ✅ Cambiar propia contraseña
- ✅ Reset de contraseña por admin
- ✅ Actualizar información de usuario
