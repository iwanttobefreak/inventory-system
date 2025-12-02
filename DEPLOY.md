# Guía de Despliegue en Servidor

Esta guía te ayudará a desplegar el sistema de inventario en un servidor remoto.

## 🖥️ Requisitos del Servidor

- Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / RHEL 8+
- 2GB RAM mínimo (4GB recomendado)
- 10GB espacio en disco
- Puerto 80 y 443 abiertos (para HTTP/HTTPS)
- Docker o Podman instalado

## 📦 Instalación en el Servidor

### Opción 1: Con Docker (Recomendado)

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Agregar tu usuario al grupo docker (opcional, para no usar sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Opción 2: Con Podman

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y podman podman-compose

# CentOS/RHEL
sudo yum install -y podman podman-compose
```

## 🚀 Desplegar la Aplicación

### 1. Subir los archivos al servidor

```bash
# Desde tu máquina local
scp -r inventory-system usuario@tu-servidor-ip:/home/usuario/

# O usando git
ssh usuario@tu-servidor-ip
cd /home/usuario
git clone <tu-repositorio>
cd inventory-system
```

### 2. Configurar variables de entorno

```bash
# Editar docker-compose.yml
nano docker-compose.yml

# Cambiar estas variables:
# - JWT_SECRET: Genera uno nuevo con: openssl rand -base64 32
# - COMPANY_NAME, COMPANY_PHONE, COMPANY_EMAIL, COMPANY_ADDRESS
# - Cambiar puertos si es necesario
```

### 3. Levantar los servicios

```bash
# Usando el script
chmod +x start.sh
./start.sh start

# O manualmente con Docker
docker-compose up -d --build

# O con Podman
podman-compose up -d --build
```

### 4. Verificar que todo funciona

```bash
# Ver logs
./start.sh logs

# O manualmente
docker-compose logs -f

# Ver estado
./start.sh status

# Verificar que responde
curl http://localhost:4000/health
```

## 🌐 Configurar Dominio (Opcional)

Si quieres usar un dominio personalizado, necesitarás:

1. **Apuntar el dominio a tu servidor** (configurar DNS A record)
2. **Actualizar las URLs en `.env`:**

```bash
# Editar .env
nano .env
```

Cambiar:
```env
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

3. **Reiniciar los servicios:**
```bash
./start.sh restart
```

## 🔒 Seguridad Adicional

### 1. Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir los puertos del frontend y backend
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp

# Bloquear puerto de base de datos desde externa
sudo ufw deny 5432/tcp

# Activar firewall
sudo ufw enable
```

### 2. Cambiar contraseña del admin

1. Accede a `https://tudominio.com`
2. Login con: `admin@productora.com` / `admin123`
3. Ve a tu perfil y cambia la contraseña

O desde la base de datos:
```bash
docker-compose exec backend npx prisma studio
# Abre http://localhost:5555 y cambia la contraseña hasheada
```

### 3. Backup automático de la base de datos

```bash
# Crear script de backup
nano /home/usuario/backup-inventory.sh
```

Contenido:
```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cd /home/usuario/inventory-system

docker-compose exec -T db pg_dump -U inventory_user inventory_db > $BACKUP_DIR/inventory_$DATE.sql

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "inventory_*.sql" -mtime +7 -delete

echo "Backup completado: inventory_$DATE.sql"
```

```bash
# Hacer ejecutable
chmod +x /home/usuario/backup-inventory.sh

# Agregar a crontab (ejecutar diariamente a las 2 AM)
crontab -e

# Agregar esta línea:
0 2 * * * /home/usuario/backup-inventory.sh >> /home/usuario/backup.log 2>&1
```

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
./start.sh logs
```

### Ver uso de recursos

```bash
docker stats

# O con Podman
podman stats
```

## 🔄 Actualizar la Aplicación

```bash
# Detener servicios
./start.sh down

# Actualizar código (si usas git)
git pull

# O reemplazar archivos manualmente

# Reconstruir y levantar
./start.sh rebuild
```

## 🆘 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs detallados
docker-compose logs

# Verificar que los puertos estén libres
sudo netstat -tulpn | grep -E '3000|4000|5432'
```

### Error de base de datos

```bash
# Reiniciar solo la base de datos
docker-compose restart db

# Ver logs de la base de datos
docker-compose logs db
```

### Frontend no conecta con backend

Verifica que `NEXT_PUBLIC_API_URL` en `.env` apunte a la URL correcta (ej: `http://localhost:4000/api`).

## 📞 Soporte

Si tienes problemas, revisa:
1. Los logs: `./start.sh logs`
2. El estado de los servicios: `./start.sh status`
3. La configuración en `.env`

---

**¡Listo! Tu sistema de inventario está desplegado en tu servidor!** 🎉
