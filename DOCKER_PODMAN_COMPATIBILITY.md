# 🐳 Compatibilidad Docker/Podman

Este sistema es compatible tanto con **Docker** como con **Podman** y detecta automáticamente el comando correcto a usar.

## Comandos Soportados

El sistema detecta automáticamente y usa el comando apropiado:

1. **`docker compose`** - Docker Desktop moderno (sin guion)
2. **`docker-compose`** - Docker Compose v1 (con guion)
3. **`podman-compose`** - Podman con compose

## Scripts Inteligentes

Los siguientes scripts detectan automáticamente tu configuración:

### 📦 `install.sh`
Script de instalación completa que:
- Detecta si tienes Docker o Podman
- Detecta el comando de compose correcto
- Configura el sistema automáticamente
- Crea el archivo `.env` si no existe

```bash
chmod +x install.sh
./install.sh
```

### 🚀 `start.sh`
Script de gestión de servicios:
```bash
./start.sh up       # Levantar servicios
./start.sh up-d     # Levantar en background
./start.sh down     # Parar servicios
./start.sh logs     # Ver logs
./start.sh restart  # Reiniciar
./start.sh clean    # Limpiar todo (⚠️ borra datos)
./start.sh rebuild  # Reconstruir contenedores
./start.sh ps       # Ver estado
```

### 🔧 `scripts/compose-utils.sh`
Utilidades para usar en tus propios scripts:

```bash
#!/bin/bash
source scripts/compose-utils.sh

# Obtener el comando correcto
COMPOSE_CMD=$(get_compose_command)

# Usar el comando
$COMPOSE_CMD up -d
$COMPOSE_CMD logs -f backend
$COMPOSE_CMD ps
```

## Uso Manual

Si prefieres ejecutar comandos manualmente, reemplaza `docker-compose` por el comando que corresponda a tu sistema:

### Con Docker moderno:
```bash
docker compose up -d
docker compose logs -f
docker compose down
```

### Con Docker Compose v1:
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Con Podman:
```bash
podman-compose up -d
podman-compose logs -f
podman-compose down
```

## Verificación

Para verificar qué comando usa tu sistema:

```bash
./test-compose-detection.sh
```

O manualmente:

```bash
# Probar docker compose (moderno)
docker compose version

# Probar docker-compose (antiguo)
docker-compose version

# Probar podman-compose
podman-compose version
```

## Solución de Problemas

### Docker no está corriendo
```bash
# En macOS/Windows con Docker Desktop:
# - Abre Docker Desktop desde el menú de aplicaciones

# En Linux:
sudo systemctl start docker
```

### Podman no está corriendo
```bash
# En macOS:
podman machine start

# En Linux:
sudo systemctl start podman
```

### Comando no encontrado

**Error**: `docker-compose: command not found`

**Solución**:
1. Si tienes Docker Desktop moderno, usa: `docker compose` (sin guion)
2. Si tienes Docker antiguo, instala compose: https://docs.docker.com/compose/install/
3. O usa nuestros scripts que detectan automáticamente: `./start.sh up`

## Recomendaciones

- ✅ **Usa los scripts**: `install.sh` y `start.sh` detectan todo automáticamente
- ✅ **Docker Desktop moderno**: Incluye `docker compose` integrado (sin guion)
- ✅ **Podman**: Funciona perfectamente, pero asegúrate de iniciar la máquina primero
- ⚠️ **Docker Compose v1**: Sigue funcionando pero está deprecated

## Más Información

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Podman Documentation](https://docs.podman.io/)
- [Docker vs Podman](https://docs.podman.io/en/latest/markdown/podman-vs-docker.1.html)
