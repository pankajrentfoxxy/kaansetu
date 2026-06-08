FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy API package files
COPY packages/api/package*.json ./

RUN npm install

# Copy Prisma schema from packages/database
COPY packages/database/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy API source
COPY packages/api/src ./src
COPY packages/api/tsconfig.json ./

# Build TypeScript
RUN npx tsc --skipLibCheck

EXPOSE 3000

CMD ["node", "dist/index.js"]
