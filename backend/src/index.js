'use strict';

// ─── DOTENV PRIMEIRO — antes de qualquer require de rota ──────────────────────
var dotenv = require('dotenv');
dotenv.config();

var express = require('express');
var cors    = require('cors');
var fs      = require('fs');
var path    = require('path');

// ─── Rotas ────────────────────────────────────────────────────────────────────
var buildsRouter    = require('./routes/builds');
var recommendRouter = require('./routes/recommend');
var notionAuthRouter = require('./routes/notionAuth');
var adminRouter     = require('./routes/admin');
var adminUIRouter   = require('./routes/adminUI');

// ─── App ──────────────────────────────────────────────────────────────────────
var app  = express();
var PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Em producao defina CORS_ORIGIN no .env ex: CORS_ORIGIN=https://meusite.com
var corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

if (corsOrigin === '*') {
  console.warn('[server] AVISO: CORS aberto para todas as origens. Defina CORS_ORIGIN no .env em producao.');
}

// ─── Middlewares globais ───────────────────────────────────────────────────────
app.use(express.json());

// ─── Rotas raiz e health (antes do wildcard) ──────────────────────────────────
app.get('/', function(req, res) {
  res.send('Chaos Zero backend is running. Use /api endpoints or the frontend at http://localhost:8081');
});

app.get('/api/health', function(req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ─── Rotas da API ─────────────────────────────────────────────────────────────
app.use('/api/builds',       buildsRouter);
app.use('/api/recommend',    recommendRouter);
app.use('/api/auth/notion',  notionAuthRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/admin/ui',     adminUIRouter);

// ─── Frontend estático (producao) ─────────────────────────────────────────────
// Deve vir DEPOIS das rotas de API para nao interceptar chamadas /api/*
var frontendDist = path.join(__dirname, '../../frontend-web/dist');
if (fs.existsSync(frontendDist)) {
  console.log('[server] Servindo frontend estatico de: ' + frontendDist);
  app.use(express.static(frontendDist));

  // Wildcard SPA — captura tudo que nao for /api
  app.get('*', function(req, res) {
    if (req.path.indexOf('/api') === 0) {
      return res.status(404).json({ error: 'Endpoint nao encontrado.' });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ─── Middleware de erro global ────────────────────────────────────────────────
app.use(function(err, req, res, next) {
  console.error('[server] Erro nao tratado:', err.message || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
});

// ─── Inicializa servidor ──────────────────────────────────────────────────────
app.listen(PORT, function() {
  console.log('[server] Backend rodando na porta ' + PORT);
  console.log('[server] Health check: http://localhost:' + PORT + '/api/health');
});