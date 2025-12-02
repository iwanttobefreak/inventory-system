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

# Exponer puerto
EXPOSE 4000

# Script de inicio que ejecuta migraciones, seed y luego inicia el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]
