FROM node:20.18.0-alpine

WORKDIR /app

# Copiar archivos de package
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