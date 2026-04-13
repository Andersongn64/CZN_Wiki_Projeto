'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const csv     = require('csv-parser');

const router = express.Router();

// ─── Caminho do banco de dados ────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, '../../db/data.csv');

// ─── Helper: busca valor de coluna ignorando caracteres invisíveis do Notion ──
function getVal(item, colName) {
  const key = Object.keys(item).find(k => k.includes(colName));
  return key ? (item[key] || '').trim() : '';
}

// ─── GET /api/builds?q=termo ──────────────────────────────────────────────────
router.get('/', (req, res) => {
  const q = req.query.q ? req.query.q.toLowerCase().trim() : '';

  if (!fs.existsSync(CSV_PATH)) {
    console.warn('[builds] CSV não encontrado em:', CSV_PATH);
    return res.json([]);
  }

  const results = [];

  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', () => {
      const filtered = results.filter(item => {
        const nameKey = Object.keys(item).find(k => k.includes('Nome'));

        // Se não encontrar coluna de Nome, ignora o item
        if (!nameKey) return false;

        return (item[nameKey] || '').toLowerCase().includes(q);
      });

      const formatted = filtered.map((item, index) => ({
        id:          index,
        name:        getVal(item, 'Nome'),
        classe:      getVal(item, 'Classe'),
        tier:        getVal(item, 'Tier'),
        cartas:      getVal(item, 'Cartas'),
        combo:       getVal(item, 'Combo'),
        link:        getVal(item, 'Build'),
        observacoes: getVal(item, 'Observações'),
        times:       getVal(item, 'Times'),
      }));

      console.log(`[builds] Busca "${q}" retornou ${formatted.length} resultado(s).`);
      res.json(formatted);
    })
    .on('error', (err) => {
      console.error('[builds] Erro ao ler CSV:', err.message);
      res.status(500).json({ error: 'Erro ao processar banco de dados' });
    });
});

module.exports = router;