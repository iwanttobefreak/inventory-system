# 📝 Guía Rápida de Comandos

## 👥 Gestión de Usuarios

### ✅ Crear Usuario
```bash
docker-compose exec backend npx tsx scripts/create-user.ts \
  "email@productora.com" "password123" "Nombre Completo" "USER"
```

### 📋 Listar Usuarios
```bash
docker-compose exec backend npx tsx scripts/list-users.ts
```

### 🔑 Cambiar Contraseña
```bash
docker-compose exec backend npx tsx scripts/reset-password.ts \
  "email@productora.com" "nueva_contraseña"
```

### 🗑️ Eliminar Usuario
```bash
docker-compose exec backend npx tsx scripts/delete-user.ts \
  "email@eliminar.com"
```

---

## 🧪 Pruebas

### Probar API completa
```bash
./test-user-api.sh
```

---

## 🐳 Docker

### Ver contenedores
```bash
docker-compose ps
```

### Ver logs
```bash
# Todos los logs
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Rebuild servicios
```bash
# Frontend
docker-compose up -d --build frontend

# Backend
docker-compose up -d --build backend

# Todo
docker-compose up -d --build
```

### Reiniciar servicios
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Limpiar y empezar de cero
```bash
./start.sh clean
```

---

## 💾 Base de Datos

### Conectarse a PostgreSQL
```bash
docker-compose exec db psql -U inventory_user -d inventory_db
```

### Ver usuarios (SQL)
```sql
SELECT id, email, name, role FROM users;
\q
```

### Prisma Studio (GUI)
```bash
docker-compose exec backend sh
npx prisma studio
# Abrir: http://localhost:5555
```

---

## 🔧 Desarrollo

### Entrar al contenedor
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

### Ver variables de entorno
```bash
docker-compose exec backend env | grep DATABASE
```

---

## 📱 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **Prisma Studio**: http://localhost:5555 (cuando esté corriendo)

---

## 🚨 Solución de Problemas

### Puerto ocupado
```bash
# Ver qué está usando el puerto
lsof -i :3000
lsof -i :4000

# Matar el proceso
kill -9 PID
```

### Frontend no se ve bien en móvil
Ya está arreglado con:
- `bg-white` - Fondo blanco explícito
- `text-gray-900` - Texto negro explícito
- `placeholder:text-gray-400` - Placeholder gris visible
- `focus:ring-2` - Mejor indicador de foco

### Olvidé la contraseña del admin
```bash
docker-compose exec backend npx tsx scripts/reset-password.ts \
  "admin@productora.com" "nueva_contraseña"
```

---

## 📚 Documentación Completa

- **README.md** - Instalación y configuración inicial
- **USER_MANAGEMENT.md** - Gestión de usuarios completa
- **DEPLOY.md** - Despliegue en producción
- **STATUS.md** - Estado del proyecto

---

💡 **Tip**: Guarda este archivo para tener siempre a mano los comandos más usados.
