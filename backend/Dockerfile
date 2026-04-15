# ── Build stage ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --module commonjs --target ES2021 --esModuleInterop true --skipLibCheck true --outDir ./dist --rootDir .

# ── Production stage ───────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL runtime (required by Prisma)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main"]
