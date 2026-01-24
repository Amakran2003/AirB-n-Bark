FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
# Compile seed file for production use
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --module ESNext --moduleResolution node

FROM node:22-alpine AS runner

WORKDIR /app

# Install netcat for database health check and OpenSSL for Prisma
RUN apk add --no-cache netcat-openbsd openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
