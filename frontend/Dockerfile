FROM node:20-alpine AS deps

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias con legacy peer deps para compatibilidad
RUN npm install --legacy-peer-deps

# Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Generar tipos de Next.js y hacer build
RUN npm run build

# Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copiar archivos del build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
