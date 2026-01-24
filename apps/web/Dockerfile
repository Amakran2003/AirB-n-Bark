FROM node:22-alpine AS builder

WORKDIR /app

# Variables d'environnement pour le build Vite
ARG VITE_API_URL
ARG VITE_USE_API
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_USE_API=${VITE_USE_API}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
