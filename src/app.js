'use strict';

const express = require('express');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log setiap request (simple logger tanpa library tambahan)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/health', healthRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    app: 'projects-devops',
    version: process.env.npm_package_version || '1.0.0',
    status: 'running',
    docs: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} tidak ditemukan`,
  });
});

// Global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan' : err.message,
  });
});

// Hanya start server jika file ini dijalankan langsung (bukan di-import saat test)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app; // export untuk keperluan testing
