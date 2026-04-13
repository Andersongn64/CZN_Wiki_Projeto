'use strict';

var OpenAI = require('openai');

// Dimensao deve bater com o modelo real (text-embedding-3-small = 1536)
var EMBEDDING_DIM = 1536;

// ─── Cliente lazy (inicializa só quando necessário) ───────────────────────────
var _client = null;

function getClient() {
  if (_client) return _client;
  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  _client = new OpenAI({ apiKey: apiKey });
  return _client;
}

// ─── Fallback determinístico (sem API key) ────────────────────────────────────
// IMPORTANTE: usa a mesma dimensão do modelo real para compatibilidade
function fallbackEmbedding(text) {
  var dim = EMBEDDING_DIM;
  var vec = new Array(dim).fill(0);

  for (var i = 0; i < text.length; i++) {
    var code = text.charCodeAt(i);
    vec[i % dim] += (code % 100) / 100;
  }

  // normaliza para vetor unitário
  var norm = 0;
  for (var j = 0; j < vec.length; j++) {
    norm += vec[j] * vec[j];
  }
  norm = Math.sqrt(norm) + 1e-12;

  return vec.map(function(v) { return v / norm; });
}

// ─── Cria embedding via OpenAI ou fallback ────────────────────────────────────
async function createEmbedding(text) {
  if (!text || !text.trim()) {
    console.warn('[embeddings] Texto vazio, usando fallback.');
    return fallbackEmbedding('');
  }

  var client = getClient();

  if (!client) {
    console.warn('[embeddings] OPENAI_API_KEY nao configurada, usando fallback deterministico.');
    return fallbackEmbedding(text);
  }

  try {
    var resp = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    if (
      !resp ||
      !resp.data ||
      !resp.data[0] ||
      !resp.data[0].embedding ||
      !resp.data[0].embedding.length
    ) {
      console.warn('[embeddings] Resposta inesperada da API, usando fallback.');
      return fallbackEmbedding(text);
    }

    return resp.data[0].embedding;

  } catch (err) {
    console.error('[embeddings] Erro ao criar embedding:', err.message || err);
    console.warn('[embeddings] Usando fallback deterministico.');
    return fallbackEmbedding(text);
  }
}

module.exports = {
  createEmbedding:  createEmbedding,
  fallbackEmbedding: fallbackEmbedding,
  EMBEDDING_DIM:    EMBEDDING_DIM,
};