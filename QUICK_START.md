# Copiar las variables de entorno del backend
cp backend/.env.example backend/.env

# Copiar las variables de entorno del frontend
cp frontend/.env.local.example frontend/.env.local

# Levantar todo el sistema
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Acceder a:
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# Login: admin@productora.com / admin123
