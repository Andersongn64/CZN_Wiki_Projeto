'use strict';

var fs   = require('fs');
var path = require('path');

// ─── Store interno ────────────────────────────────────────────────────────────
// Cada entrada: { id: string, vector: number[], metadata: object }
var vectors = [];

// ─── Adiciona ou atualiza um vetor por ID ─────────────────────────────────────
function add(id, vector, metadata) {
  // substitui se já existir o mesmo id
  for (var i = 0; i < vectors.length; i++) {
    if (vectors[i].id === id) {
      vectors[i] = { id: id, vector: vector, metadata: metadata || {} };
      return;
    }
  }
  vectors.push({ id: id, vector: vector, metadata: metadata || {} });
}

// ─── Limpa todos os vetores da memória ────────────────────────────────────────
function clear() {
  vectors = [];
}

// ─── Salva vetores em arquivo JSON ────────────────────────────────────────────
function save(filepath) {
  try {
    var dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[vectorstore] Diretorio criado: ' + dir);
    }
    fs.writeFileSync(filepath, JSON.stringify(vectors), 'utf8');
    console.log('[vectorstore] ' + vectors.length + ' vetores salvos em: ' + filepath);
  } catch (err) {
    console.error('[vectorstore] Erro ao salvar vetores:', err.message);
    throw err;
  }
}

// ─── Carrega vetores de arquivo JSON ──────────────────────────────────────────
function load(filepath) {
  if (!fs.existsSync(filepath)) {
    console.warn('[vectorstore] Arquivo nao encontrado: ' + filepath);
    return;
  }
  try {
    var raw  = fs.readFileSync(filepath, 'utf8');
    var data = JSON.parse(raw || '[]');
    if (!Array.isArray(data)) {
      console.warn('[vectorstore] Arquivo invalido, esperado array JSON.');
      return;
    }
    vectors = data;
    console.log('[vectorstore] ' + vectors.length + ' vetores carregados de: ' + filepath);
  } catch (err) {
    console.error('[vectorstore] Erro ao carregar vetores:', err.message);
  }
}

// ─── Funções de similaridade ──────────────────────────────────────────────────
function dot(a, b) {
  var sum = 0;
  for (var i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

function norm(a) {
  var sum = 0;
  for (var i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
}

function cosine(a, b) {
  var denom = norm(a) * norm(b) + 1e-10;
  return dot(a, b) / denom;
}

// ─── Busca por similaridade vetorial ─────────────────────────────────────────
function searchByVector(queryVector, topK) {
  topK = topK || 5;

  if (!vectors.length) {
    console.warn('[vectorstore] Nenhum vetor carregado.');
    return [];
  }

  var scored = [];
  for (var i = 0; i < vectors.length; i++) {
    var v = vectors[i];
    if (!v.vector || v.vector.length !== queryVector.length) continue;
    scored.push({ score: cosine(queryVector, v.vector), item: v });
  }

  scored.sort(function(a, b) { return b.score - a.score; });

  return scored.slice(0, topK).map(function(s) { return s.item; });
}

// ─── Retorna contagem atual ───────────────────────────────────────────────────
function count() {
  return vectors.length;
}

module.exports = {
  add:            add,
  clear:          clear,
  save:           save,
  load:           load,
  searchByVector: searchByVector,
  count:          count,
};