# Guía de Inicio Rápido

## Opción 1: Usando el script de instalación (Recomendado)

```bash
chmod +x install.sh
./install.sh
```

El script detectará automáticamente si tienes Docker o Podman y usará el comando correcto.

## Opción 2: Manual

```bash
# Copiar las variables de entorno del backend
cp backend/.env.example backend/.env

# Copiar las variables de entorno del frontend
cp frontend/.env.local.example frontend/.env.local

# Levantar todo el sistema
# El sistema detecta automáticamente: docker compose, docker-compose o podman-compose
docker-compose up --build -d
# O si tienes Docker moderno:
docker compose up --build -d

# Ver logs
docker-compose logs -f

# Acceder a:
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# Login: admin@productora.com / admin123
```

## Usando el script start.sh

```bash
chmod +x start.sh
./start.sh up-d    # Levantar servicios
./start.sh logs    # Ver logs
./start.sh down    # Parar servicios
./start.sh restart # Reiniciar
```

El script `start.sh` detecta automáticamente tu configuración (Docker/Podman).
