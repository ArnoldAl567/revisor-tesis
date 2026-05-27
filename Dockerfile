FROM node:20.18.0-alpine

# Instalar solo las dependencias ESENCIALES de Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copiar archivos de package (para cachear la instalación)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Generar Prisma client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Construir la aplicación
RUN cd apps/api && npm run build

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]