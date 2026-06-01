# Stage 1: Install dependencies
# pnpm 10: the repo's pnpm-workspace.yaml uses pnpm-10 settings (allowBuilds /
# ignoredBuiltDependencies) and has no `packages` field. pnpm 9 reads it as a
# workspace manifest and aborts with "packages field missing or empty", which
# is what broke `pnpm prisma generate` in the builder stage.
# node:22 (not -slim) already ships openssl/libssl3/ca-certificates, so Prisma
# finds its engine without needing an extra apt-get step.
FROM node:22 AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22 AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client and build Next.js
ENV DATABASE_URL=file:/data/app.db
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values for build (not used at runtime)
ENV SESSION_SECRET=build-time-placeholder-not-used-in-runtime-at-all
ENV BAR_PIN=0000
ENV ADMIN_PIN=0000
RUN pnpm prisma generate
RUN pnpm build

# Stage 3: Production runner
FROM node:22 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/app.db
# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy prisma for migrations at startup
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
# Data directory
RUN mkdir -p /data/images && chown -R nextjs:nodejs /data
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
