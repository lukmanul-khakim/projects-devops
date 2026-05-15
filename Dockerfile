# =============================================================================
# STAGE 1 — deps
# Install SEMUA dependencies (termasuk devDependencies untuk build/test).
# Layer ini di-cache Docker — hanya rebuild kalau package.json berubah.
# =============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files dulu (bukan seluruh kode) supaya layer cache optimal.
# Kalau kode berubah tapi package.json tidak → layer ini tetap dari cache.
COPY package.json package-lock.json ./

RUN npm ci --frozen-lockfile


# =============================================================================
# STAGE 2 — builder
# Jalankan lint/test, lalu prune devDependencies.
# Hasilnya: hanya production deps yang tersisa.
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy semua deps dari stage sebelumnya
COPY --from=deps /app/node_modules ./node_modules

# Copy seluruh source code
COPY . .

# Jalankan test (pipeline gagal di sini kalau ada test yang merah)
RUN npm test --if-present

# Hapus devDependencies — yang tersisa hanya yang dibutuhkan production
RUN npm prune --production


# =============================================================================
# STAGE 3 — production
# Image final yang sekecil dan seaman mungkin:
#   - Hanya production deps
#   - Tidak ada npm, git, atau tools build
#   - Berjalan sebagai non-root user (UID 1001)
# =============================================================================
FROM node:20-alpine AS production

# Pasang dumb-init: PID 1 yang benar untuk container.
# Tanpa ini, Node.js jadi PID 1 dan tidak handle SIGTERM dengan baik
# → container lambat mati, graceful shutdown tidak jalan.
RUN apk add --no-cache dumb-init

# Set environment production
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Buat non-root user & group khusus untuk app ini
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy hanya yang dibutuhkan dari stage builder:
# - node_modules yang sudah dipruned (production only)
# - source code app
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup package.json ./

# Jalankan sebagai non-root user
USER appuser

# Dokumentasi port yang diexpose (tidak otomatis publish — tetap butuh -p atau compose)
EXPOSE 3000

# Health check bawaan Docker.
# Docker akan poll endpoint ini setiap 30 detik.
# Container ditandai "unhealthy" kalau gagal 3 kali berturut-turut.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# dumb-init sebagai entrypoint agar signal (SIGTERM, SIGINT) diteruskan ke Node
ENTRYPOINT ["dumb-init", "--"]

# Jalankan app
CMD ["node", "src/app.js"]
