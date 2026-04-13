'use strict';

/**
 * Smoke test manual — verifica se o servidor responde corretamente.
 * Uso: node scripts/smoke-test.js
 *
 * O servidor deve estar rodando antes de executar este script:
 *   node src/index.js
 */

var fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.error('[smoke] node-fetch nao encontrado. Execute: npm install node-fetch@2');
  process.exit(1);
}

var BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
var results  = { passed: 0, failed: 0 };

// ─── Helper: espera em ms ─────────────────────────────────────────────────────
function wait(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ─── Helper: tenta conectar ate o servidor responder ──────────────────────────
async function waitForServer(maxAttempts, intervalMs) {
  maxAttempts = maxAttempts || 10;
  intervalMs  = intervalMs  || 500;

  for (var i = 0; i < maxAttempts; i++) {
    try {
      var r = await fetch(BASE_URL + '/api/health');
      if (r.ok) {
        console.log('[smoke] Servidor respondeu apos ' + (i + 1) + ' tentativa(s).');
        return true;
      }
    } catch (e) {
      // servidor ainda nao subiu
    }
    await wait(intervalMs);
  }

  console.error('[smoke] Servidor nao respondeu apos ' + maxAttempts + ' tentativas.');
  return false;
}

// ─── Helper: roda um teste e registra resultado ───────────────────────────────
async function test(name, fn) {
  try {
    await fn();
    console.log('[smoke] PASSOU: ' + name);
    results.passed++;
  } catch (err) {
    console.error('[smoke] FALHOU: ' + name + ' — ' + (err.message || err));
    results.failed++;
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────
async function run() {
  console.log('[smoke] Aguardando servidor em ' + BASE_URL + '...');

  var up = await waitForServer(10, 500);
  if (!up) {
    console.error('[smoke] Abortando: servidor nao disponivel.');
    process.exit(1);
  }

  // ── Teste 1: Health check ──────────────────────────────────────────────────
  await test('GET /api/health', async function() {
    var r = await fetch(BASE_URL + '/api/health');
    if (!r.ok) throw new Error('Status HTTP: ' + r.status);
    var j = await r.json();
    if (!j.ok) throw new Error('Campo ok ausente ou false');
    console.log('           Resposta:', JSON.stringify(j));
  });

  // ── Teste 2: Recommend ────────────────────────────────────────────────────
  await test('POST /api/recommend (Sereniel)', async function() {
    var r = await fetch(BASE_URL + '/api/recommend', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ characters: ['Sereniel'] }),
    });
    if (!r.ok) throw new Error('Status HTTP: ' + r.status);
    var j = await r.json();
    if (!j.success) throw new Error('success=false — ' + j.error);
    if (!j.recommendation) throw new Error('Campo recommendation ausente');
    console.log('           Recomendacao recebida (' + j.recommendation.length + ' chars)');
  });

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('');
  console.log('[smoke] Resultado: ' + results.passed + ' passaram, ' + results.failed + ' falharam.');

  process.exit(results.failed > 0 ? 1 : 0);
}

run();