FROM node:20-alpine AS base

# Instalar dependencias necesarias incluyendo OpenSSL
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Build de TypeScript
RUN npm run build

# Instalar netcat para el script de espera
RUN apk add --no-cache netcat-openbsd

# Copiar script de inicio
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Exponer puerto
EXPOSE 4000

# Usar script de inicio
CMD ["/app/start.sh"]
