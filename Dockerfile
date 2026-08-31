# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat git

COPY package.json package-lock.json ./
RUN npm ci


# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build with standalone output for optimized production bundle
RUN npm run build

RUN mkdir -p public/kannada/_next && cp -r .next/static public/kannada/_next/static

# Create build info
RUN mkdir -p /app/public && \
    git log -n1 --pretty="Commit Date: %aD%nBuild Date: $(date --rfc-2822)%n%h %an%n%s%n" \
    > /app/public/round-table.txt || true

# Ensure .env.production / .env.local exist (create empty if missing)
RUN touch .env.production .env.local


# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl and tini
RUN apk add --no-cache curl tini \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone build and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy RSC cache patch (prevents CDN from caching flight data as HTML)
# DISABLED: rsc-cache-patch.js is not present in this repository yet.
# Re-enable this line once the file is added from the source project.
# COPY --from=builder --chown=nextjs:nodejs /app/rsc-cache-patch.js ./rsc-cache-patch.js

# Copy .env.production (will be empty if not in build context)
# Prefer passing environment variables at runtime via Docker env or secrets
COPY --from=builder --chown=nextjs:nodejs /app/.env.production ./

# Copy .env.local — the standalone server.js calls loadEnvConfig() at startup and
# reads .env.local from its CWD. Without this the build stage sees the vars but the
# container does not, so QUINTYPE_API_BASE_URL / REDIS_URL / MEDIA_BASE_URL and every
# other server-side var are undefined at runtime. Runtime -e / --env-file still wins.
COPY --from=builder --chown=nextjs:nodejs /app/.env.local ./

# Copy src/data directory for dynamic page store
# This directory contains store.json which holds page layouts and routes
COPY --from=builder --chown=nextjs:nodejs /app/src/data ./src/data

# Create startup script for Next.js
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start Next.js with 1GB heap limit + expose GC for periodic cleanup' >> /app/start.sh && \
    # DISABLED: restore the --require flag once rsc-cache-patch.js is added.
    # echo 'exec node --max-old-space-size=1024 --expose-gc --require ./rsc-cache-patch.js server.js' >> /app/start.sh && \
    echo 'exec node --max-old-space-size=1024 --expose-gc server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -sf http://localhost:3000/ > /dev/null || exit 1

# Volume for dynamic configuration (store.json)
VOLUME ["/app/src/data"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/start.sh"]
