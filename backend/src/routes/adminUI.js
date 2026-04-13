'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const router = express.Router();

// ─── Caminhos ──────────────────────────────────────────────────────────────────
const ADMIN_HTML   = path.join(__dirname, '../../frontend-admin/index.html');
const VECTORS_PATH = path.join(__dirname, '../../db/vectors.json');

// ─── GET / — Serve o painel admin ─────────────────────────────────────────────
router.get('/', (req, res) => {
  if (!fs.existsSync(ADMIN_HTML)) {
    return res.status(404).send('Admin UI not found. Make sure frontend-admin/index.html exists.');
  }
  res.sendFile(ADMIN_HTML);
});

// ─── GET /status — Status dos vetores ────────────────────────────────────────
router.get('/status', (req, res) => {
  const hasVectors = fs.existsSync(VECTORS_PATH);
  const stats      = { hasVectors };

  if (hasVectors) {
    // Tamanho do arquivo
    try {
      stats.size = fs.statSync(VECTORS_PATH).size;
    } catch (err) {
      console.warn('[adminUI] Could not stat vectors.json:', err.message);
    }

    // Contagem de entradas
    try {
      const raw = fs.readFileSync(VECTORS_PATH, 'utf8');
      const arr = JSON.parse(raw || '[]');
      stats.count = Array.isArray(arr) ? arr.length : null;
    } catch (err) {
      console.warn('[adminUI] Could not parse vectors.json:', err.message);
      stats.count = null;
      stats.parseError = true;
    }
  }

  res.json({ ok: true, stats });
});

module.exports = router;