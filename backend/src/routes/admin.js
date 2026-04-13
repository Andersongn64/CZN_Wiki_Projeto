'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const { ingestNotion, ingestFromExport } = require('../services/recommender');

// ─── Pasta temporária para uploads ────────────────────────────────────────────
const TMP_DIR = path.join(__dirname, '../../tmp_uploads');

// Cria a pasta se não existir
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const upload = multer({ dest: TMP_DIR });

// ─── Helper: apaga arquivo temporário silenciosamente ─────────────────────────
function removeTmp(filepath) {
  try { fs.unlinkSync(filepath); } catch (e) { /* ignora */ }
}

// ─── Helper: valida secret ────────────────────────────────────────────────────
function checkSecret(req, res) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return true; // sem secret configurado, permite tudo
  const provided = req.headers['x-ingest-secret'] || req.body.ingestSecret;
  if (!provided || provided !== secret) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ─── POST /api/admin/ingest ───────────────────────────────────────────────────
// body: { databaseId?: string, ingestSecret?: string }
router.post('/ingest', async (req, res) => {
  try {
    if (!checkSecret(req, res)) return;

    const databaseId = req.body.databaseId || process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      return res.status(400).json({ success: false, error: 'Missing databaseId' });
    }

    await ingestNotion(databaseId);
    return res.json({ success: true, message: 'Ingestion completed' });

  } catch (err) {
    console.error('[admin] Ingest error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Ingestion failed'  // expõe mensagem para debug
    });
  }
});

// ─── POST /api/admin/ingest-file ──────────────────────────────────────────────
// multipart/form-data com campo "file"
router.post('/ingest-file', upload.single('file'), async (req, res) => {
  const fp = req.file ? req.file.path : null;

  try {
    if (!fp) {
      return res.status(400).json({ success: false, error: 'Missing file' });
    }

    const out = await ingestFromExport(fp);
    removeTmp(fp); // limpa só após sucesso

    return res.json({ success: true, ...out });

  } catch (err) {
    console.error('[admin] Ingest file error:', err);
    if (fp) removeTmp(fp); // limpa mesmo em caso de erro
    return res.status(500).json({
      success: false,
      error: err.message || 'Ingestion failed'
    });
  }
});

module.exports = router;