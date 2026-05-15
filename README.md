# projects-devops

[![CI/CD Pipeline](https://github.com/lukmanul-khakim/projects-devops/actions/workflows/ci.yml/badge.svg)](https://github.com/lukmankhakim09/projects-devops/actions/workflows/ci.yml)
[![Docker Image](https://img.shields.io/docker/v/lukmankhakim09/projects-devops?label=docker%20hub&color=2496ED&logo=docker&logoColor=white)](https://hub.docker.com/r/lukmankhakim09/projects-devops)
[![Docker Pulls](https://img.shields.io/docker/pulls/lukmankhakim09/projects-devops)](https://hub.docker.com/r/lukmankhakim09/projects-devops)
[![Node.js](https://img.shields.io/badge/node-20--alpine-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Production-ready REST API dengan Express.js, dikemas dalam multi-stage Docker image, dan di-deploy otomatis via GitHub Actions CI/CD pipeline ke Docker Hub.

---

## Daftar Isi

- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Project](#struktur-project)
- [Cara Menjalankan Lokal](#cara-menjalankan-lokal)
- [API Endpoints](#api-endpoints)
- [CI/CD Pipeline](#cicd-pipeline)
- [Docker](#docker)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Kontribusi](#kontribusi)

---

## Demo

```bash
# Pull dan jalankan langsung dari Docker Hub
docker pull lukmankhakim09/projects-devops:latest
docker run -p 3000:3000 lukmankhakim09/projects-devops

# Cek health
curl http://localhost:3000/health
```

---

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Runtime | Node.js 20 (Alpine) |
| Framework | Express.js 4 |
| Containerization | Docker (multi-stage build) |
| CI/CD | GitHub Actions |
| Registry | Docker Hub |
| Testing | Jest + Supertest |
| Process Manager | dumb-init |

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                            │
│                    git push → main                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions                            │
│                                                             │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │   Job: test     │  pass  │   Job: build-and-push    │   │
│  │                 │───────▶│                          │   │
│  │  npm ci         │        │  docker buildx build     │   │
│  │  npm test       │        │  docker push :latest     │   │
│  │  upload coverage│        │  docker push :sha-xxxxx  │   │
│  └─────────────────┘        └──────────────┬───────────┘   │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Docker Hub                             │
│                                                             │
│   lukmankhakim09/projects-devops:latest                     │
│   lukmankhakim09/projects-devops:sha-fb0f1cf                │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Stage Docker Build

```
Stage 1: deps          Stage 2: builder       Stage 3: production
─────────────────      ─────────────────      ─────────────────
node:20-alpine    ───▶  node:20-alpine    ───▶  node:20-alpine
                                                    (final)
npm ci                  copy node_modules
(semua deps)            copy source              hanya prod deps
                        npm test                 non-root user
                        npm prune --prod         dumb-init
                                                 ~50MB image
```

Kenapa multi-stage?
- **Ukuran image lebih kecil** — devDependencies & tools build tidak ikut ke production
- **Security** — tidak ada npm, git, atau credentials di image final
- **Test otomatis di build time** — build gagal kalau ada test yang merah

---

## Struktur Project

```
projects-devops/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions pipeline
├── __tests__/
│   └── health.test.js       # Jest integration tests
├── src/
│   ├── app.js               # Express app & middleware setup
│   └── routes/
│       └── health.js        # Health check endpoints
├── Dockerfile               # Multi-stage build
├── .dockerignore
├── docker-compose.yml       # Local development
├── package.json
└── README.md
```

---

## Cara Menjalankan Lokal

### Dengan Node.js langsung

```bash
# Clone repo
git clone git@github.com:lukmanul-khakim/projects-devops.git
cd projects-devops

# Install dependencies
npm install

# Jalankan (development mode dengan auto-reload)
npm run dev

# Server berjalan di http://localhost:3000
```

### Dengan Docker

```bash
# Build image lokal
docker build -t projects-devops:local .

# Jalankan container
docker run -p 3000:3000 --name devops-app projects-devops:local

# Atau dengan environment variable custom
docker run -p 8080:8080 -e PORT=8080 -e NODE_ENV=production projects-devops:local
```

### Dengan Docker Compose

```bash
docker compose up
# Server berjalan di http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Info aplikasi (versi, status) |
| `GET` | `/health` | Health check utama — untuk Docker & load balancer |
| `GET` | `/health/details` | Detail system: memory, hostname, Node version |
| `GET` | `/health/ready` | Readiness probe — siap terima traffic? |

### Contoh Response

**`GET /health`**
```json
{
  "status": "ok",
  "timestamp": "2025-05-15T10:30:00.000Z",
  "uptime": "0h 5m 23s",
  "environment": "production"
}
```

**`GET /health/details`**
```json
{
  "status": "ok",
  "timestamp": "2025-05-15T10:30:00.000Z",
  "uptime": "0h 5m 23s",
  "environment": "production",
  "system": {
    "hostname": "container-abc123",
    "platform": "linux",
    "nodeVersion": "v20.11.0"
  },
  "memory": {
    "heapUsedMB": 12.3,
    "heapTotalMB": 18.5,
    "rssMB": 35.2
  }
}
```

---

## CI/CD Pipeline

Pipeline otomatis berjalan setiap kali ada perubahan di repository.

```
git push ke main
      │
      ▼
┌─────────────────────────────────────┐
│  Job 1: test                        │
│  ✔ Checkout code                    │
│  ✔ Setup Node.js 20 + npm cache     │
│  ✔ npm ci (install deps)            │
│  ✔ npm test (Jest + coverage)       │
│  ✔ Upload coverage artifact         │
└────────────────┬────────────────────┘
                 │ (hanya kalau semua hijau)
                 ▼
┌─────────────────────────────────────┐
│  Job 2: build-and-push              │
│  ✔ Setup Docker Buildx              │
│  ✔ Login ke Docker Hub              │
│  ✔ Build multi-stage image          │
│  ✔ Push :latest                     │
│  ✔ Push :sha-xxxxxxx                │
│  ✔ Print job summary                │
└─────────────────────────────────────┘
```

**Pull Request** → hanya Job 1 (test) yang jalan. Image tidak di-push sebelum merge ke main.

### Setup Secrets

Sebelum pipeline bisa jalan, tambahkan dua secrets di:
`Repo → Settings → Secrets and variables → Actions`

| Secret | Nilai |
|---|---|
| `DOCKERHUB_USERNAME` | Username Docker Hub |
| `DOCKERHUB_TOKEN` | Access Token dari Docker Hub (bukan password) |

---

## Docker

### Pull dari Docker Hub

```bash
# Versi terbaru
docker pull lukmankhakim09/projects-devops:latest

# Versi spesifik (immutable, untuk production)
docker pull lukmankhakim09/projects-devops:sha-a1b2c3d
```

### Tagging Strategy

| Tag | Kapan di-push | Gunakan untuk |
|---|---|---|
| `latest` | Setiap push ke `main` | Development, testing cepat |
| `sha-xxxxxxx` | Setiap push ke `main` | Production, rollback presisi |

Selalu pin SHA di production — `latest` bisa berubah kapan saja.

### Cek Image Security

```bash
# Verifikasi berjalan sebagai non-root
docker run --rm lukmankhakim09/projects-devops whoami
# Output: appuser

# Cek ukuran image
docker images lukmankhakim09/projects-devops
```

---

## Testing

```bash
# Jalankan semua test
npm test

# Watch mode (development)
npx jest --watch

# Lihat coverage report
npm test -- --coverage
open coverage/lcov-report/index.html
```

Test mencakup semua endpoint dengan Supertest — tidak perlu server berjalan.

---

## Environment Variables

| Variable | Default | Deskripsi |
|---|---|---|
| `PORT` | `3000` | Port server |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |

---

## Kontribusi

1. Fork repo ini
2. Buat branch baru: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
4. Push dan buat Pull Request ke `main`
5. Pipeline test akan jalan otomatis di PR

---

## License

[MIT](LICENSE) — bebas digunakan untuk portfolio & project personal.
