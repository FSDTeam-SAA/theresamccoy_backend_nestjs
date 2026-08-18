FROM node:20-alpine AS base

WORKDIR /usr/src/app
ENV CI=true
FROM base AS deps
COPY package*.json ./
RUN npm ci
FROM deps AS builder

COPY . .
RUN npm run build
FROM base AS production-deps

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=production-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

RUN addgroup -S nestjs -g 1001 \
  && adduser -S nestjs -u 1001 -G nestjs

USER nestjs

EXPOSE 8080


HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080)).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Production command
CMD ["node", "dist/main.js"]
