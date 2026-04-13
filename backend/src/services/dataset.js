'use strict';

var fs   = require('fs');
var path = require('path');
var csv  = require('csv-parser');

// ─── Caminho do CSV ───────────────────────────────────────────────────────────
var csvPath = process.env.DATA_CSV_PATH || path.join(__dirname, '../../db/data.csv');

// ─── Cache interno ────────────────────────────────────────────────────────────
var builds  = [];
var loaded  = false;

// ─── Helper: normaliza lista separada por vírgula ─────────────────────────────
function normalizeList(value) {
  if (!value) return [];
  return value.toString().split(',').map(function(s) {
    return s.trim();
  }).filter(Boolean);
}

// ─── Helper: mapeia linha do CSV para objeto de build ─────────────────────────
function rowToBuild(row, index) {
  var keys = Object.keys(row);

  // Busca coluna ignorando maiúsculas e caracteres invisíveis do Notion
  function get() {
    var candidates = Array.prototype.slice.call(arguments);
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i].toLowerCase();
      for (var j = 0; j < keys.length; j++) {
        if (keys[j].toLowerCase().trim().indexOf(c) !== -1 && row[keys[j]]) {
          return row[keys[j]].toString().trim();
        }
      }
    }
    return '';
  }

  var id   = get('id')   || ('build-' + (index + 1));
  var name = get('nome', 'name', 'personagem', 'title') || ('Build ' + (index + 1));

  return {
    id:          id,
    name:        name,
    classe:      get('classe', 'role', 'funcao'),
    tier:        get('tier'),
    combo:       get('combo'),
    cartas:      get('cartas', 'carta'),
    times:       get('times'),
    observacoes: get('observacoes', 'observações'),
    description: get('description', 'descricao', 'descrição'),
    characters:  normalizeList(get('characters', 'personagens')),
    tags:        normalizeList(get('tags')),
  };
}

// ─── Carrega CSV usando csv-parser (lida com vírgulas dentro de aspas) ─────────
function loadCsv() {
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(csvPath)) {
      console.warn('[dataset] CSV nao encontrado: ' + csvPath);
      builds = [];
      loaded = true;
      return resolve([]);
    }

    var rows = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', function(row) { rows.push(row); })
      .on('end', function() {
        builds = rows.map(rowToBuild);
        loaded = true;
        console.log('[dataset] ' + builds.length + ' builds carregados de: ' + csvPath);
        resolve(builds);
      })
      .on('error', function(err) {
        console.error('[dataset] Erro ao ler CSV:', err.message);
        builds = [];
        loaded = true;
        reject(err);
      });
  });
}

// ─── Garante que o CSV foi carregado antes de usar ────────────────────────────
function ensureLoaded() {
  if (loaded) return Promise.resolve(builds);
  return loadCsv();
}

// ─── Retorna todas as builds ──────────────────────────────────────────────────
function getBuilds() {
  return ensureLoaded();
}

// ─── Busca por texto livre ────────────────────────────────────────────────────
function searchBuilds(query) {
  query = query || '';
  return ensureLoaded().then(function(all) {
    var q = query.toLowerCase().trim();
    if (!q) return all;

    var terms = q.split(/[\s,]+/).filter(Boolean);

    return all.filter(function(b) {
      var searchable = [
        b.name        || '',
        b.classe      || '',
        b.tier        || '',
        b.combo       || '',
        b.observacoes || '',
        b.description || '',
        (b.characters || []).join(' '),
        (b.tags       || []).join(' '),
      ].join(' ').toLowerCase();

      return terms.every(function(term) {
        return searchable.indexOf(term) !== -1;
      });
    });
  });
}

// ─── Busca por personagens com score de relevância ────────────────────────────
function findByCharacters(characters, max) {
  max = max || 6;
  if (!characters || !characters.length) return Promise.resolve([]);

  var charsNorm = characters.map(function(c) {
    return c.toLowerCase().trim();
  }).filter(Boolean);

  return ensureLoaded().then(function(all) {
    var scored = [];

    for (var i = 0; i < all.length; i++) {
      var b    = all[i];
      var cSet = {};
      var bChars = (b.characters || []);

      for (var j = 0; j < bChars.length; j++) {
        cSet[bChars[j].toLowerCase()] = true;
      }

      var score = 0;
      for (var k = 0; k < charsNorm.length; k++) {
        if (cSet[charsNorm[k]]) score++;
      }

      if (score > 0) scored.push({ build: b, score: score });
    }

    scored.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (a.build.name || '').localeCompare(b.build.name || '');
    });

    return scored.slice(0, max).map(function(x) { return x.build; });
  });
}

// ─── Inicializa ao carregar o módulo ──────────────────────────────────────────
loadCsv().catch(function(err) {
  console.error('[dataset] Falha na inicializacao:', err.message);
});

module.exports = {
  getBuilds:       getBuilds,
  searchBuilds:    searchBuilds,
  findByCharacters: findByCharacters,
  loadCsv:         loadCsv,
};