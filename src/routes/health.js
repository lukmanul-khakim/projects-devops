'use strict';

const express = require('express');
const router = express.Router();
const os = require('os');

// Waktu server mulai (untuk menghitung uptime)
const START_TIME = Date.now();

/**
 * GET /health
 * Health check utama — dipakai oleh Docker, Kubernetes, load balancer, dll.
 * Selalu return 200 selama app berjalan normal.
 */
router.get('/', (req, res) => {
  const uptimeMs = Date.now() - START_TIME;

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptimeMs),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * GET /health/details
 * Info lebih lengkap: memory usage, hostname, Node.js version.
 * Berguna untuk debugging di staging, tapi sebaiknya di-protect di production.
 */
router.get('/details', (req, res) => {
  const uptimeMs = Date.now() - START_TIME;
  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptimeMs),
    environment: process.env.NODE_ENV || 'development',
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version,
    },
    memory: {
      heapUsedMB: toMB(memUsage.heapUsed),
      heapTotalMB: toMB(memUsage.heapTotal),
      rssMB: toMB(memUsage.rss),
    },
  });
});

/**
 * GET /health/ready
 * Readiness check — untuk Kubernetes readiness probe.
 * Kalau app belum siap terima traffic (misal: DB belum konek), return 503.
 */
router.get('/ready', (req, res) => {
  // Tambahkan pengecekan dependency di sini (database, cache, dll.)
  // Contoh: if (!db.isConnected()) return res.status(503).json({ status: 'not ready' });

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// --- Helper functions ---

function toMB(bytes) {
  return Math.round(bytes / 1024 / 1024 * 10) / 10;
}

function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

module.exports = router;
