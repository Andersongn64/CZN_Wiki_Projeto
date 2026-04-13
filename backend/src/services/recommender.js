'use strict';

var path         = require('path');
var fs           = require('fs');
var csv          = require('csv-parser');
var dataset      = require('./dataset');
var embeddings   = require('./embeddings');
var vectorstore  = require('./vectorstore');
var notionClient = require('./notionClient');
var OpenAI       = require('openai');

var VECTORS_PATH = path.join(__dirname, '../../db/vectors.json');

// ─── Cliente OpenAI lazy ───────────────────────────────────────────────────────
var _openai = null;
function getOpenAI() {
  if (_openai) return _openai;
  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  _openai = new OpenAI({ apiKey: apiKey });
  return _openai;
}

// ─── Remove vetores antigos ────────────────────────────────────────────────────
function clearVectors() {
  try {
    if (fs.existsSync(VECTORS_PATH)) {
      fs.unlinkSync(VECTORS_PATH);
      console.log('[recommender] Vetores anteriores removidos.');
    }
  } catch (err) {
    console.warn('[recommender] Nao foi possivel remover vetores antigos:', err.message);
  }
}

// ─── Parse YAML front-matter simples ──────────────────────────────────────────
function parseFrontMatter(raw) {
  if (!raw || raw.indexOf('---') !== 0) return null;
  var fmEnd = raw.indexOf('\n---', 3);
  if (fmEnd === -1) return null;

  var fmBlock = raw.slice(3, fmEnd + 1).trim();
  var lines   = fmBlock.split('\n');
  var result  = {};

  var reKV    = new RegExp('^([^:]+):\\s*(.*)$');
  var reQuote = new RegExp('^"|"$', 'g');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var match = line.match(reKV);
    if (!match) continue;

    var key = match[1].trim();
    var val = match[2].trim();

    if (val.charAt(0) === '[' && val.charAt(val.length - 1) === ']') {
      try {
        val = val.slice(1, -1).split(',').map(function(x) {
          return x.trim().replace(reQuote, '');
        });
      } catch (e) { /* mantém string */ }
    }

    result[key] = val;
  }

  return result;
}

// ─── Parse CSV robusto ────────────────────────────────────────────────────────
function parseCsvRows(filePath) {
  return new Promise(function(resolve, reject) {
    var rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', function(row) { rows.push(row); })
      .on('end',  function()    { resolve(rows);   })
      .on('error', reject);
  });
}

// ─── Ingesta arquivo (MD, Markdown, CSV) ──────────────────────────────────────
async function ingestFromExport(filePath) {
  if (!filePath) throw new Error('[recommender] filePath nao informado.');

  var abs = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../', filePath);
  if (!fs.existsSync(abs)) throw new Error('[recommender] Arquivo nao encontrado: ' + abs);

  var ext  = abs.split('.').pop().toLowerCase();
  var raw  = fs.readFileSync(abs, 'utf8');
  var docs = [];

  // ── Markdown ────────────────────────────────────────────────────────────────
  if (ext === 'md' || ext === 'markdown') {
    var frontMatter = parseFrontMatter(raw);

    // remove blocos de codigo: ``` ... ```
    var reCodeBlock  = new RegExp('`[\\s\\S]*?`', 'g');
    var reHeading    = new RegExp('^#{1,2}\\s+', 'm');
    var reSeparator  = new RegExp('^---+$', 'm');
    var reCrLf       = new RegExp('\\r\\n', 'g');

    var content = raw.replace(reCodeBlock, '').replace(reCrLf, '\n');
    var parts   = content.split(reHeading).map(function(p) { return p.trim(); }).filter(Boolean);

    if (parts.length <= 1) {
      var alt = content.split(reSeparator).map(function(p) { return p.trim(); }).filter(Boolean);
      for (var i = 0; i < alt.length; i++) {
        docs.push({ title: null, text: alt[i], metadata: frontMatter });
      }
    } else {
      for (var j = 0; j < parts.length; j++) {
        var p         = parts[j];
        var firstLine = p.split('\n')[0] || '';
        var rest      = p.slice(firstLine.length).trim();
        var hasColon  = firstLine.indexOf(':') !== -1;
        var title     = (firstLine && firstLine.length < 120 && !hasColon) ? firstLine.trim() : null;
        docs.push({ title: title, text: rest || p, metadata: frontMatter });
      }
    }

  // ── CSV ─────────────────────────────────────────────────────────────────────
  } else if (ext === 'csv') {
    var rows = await parseCsvRows(abs);
    var reSpaces = new RegExp('\\s+', 'g');

    for (var r = 0; r < rows.length; r++) {
      var row  = rows[r];
      var keys = Object.keys(row);
      var rowTitle = '';

      for (var ki = 0; ki < keys.length; ki++) {
        var kl = keys[ki].toLowerCase();
        if (kl.indexOf('nome') !== -1 || kl.indexOf('name') !== -1 || kl === 'id') {
          rowTitle = row[keys[ki]] || '';
          break;
        }
      }
      if (!rowTitle) rowTitle = 'row-' + (r + 1);

      var text = keys.map(function(k) { return k + ': ' + (row[k] || ''); }).join('\n');
      docs.push({ title: rowTitle, text: text });
    }

  // ── Outro formato ────────────────────────────────────────────────────────────
  } else {
    docs.push({ title: path.basename(abs), text: raw });
  }

  // ── Gera e salva vetores ────────────────────────────────────────────────────
  clearVectors();

  var reSpacesId = new RegExp('\\s+', 'g');

  for (var di = 0; di < docs.length; di++) {
    var d   = docs[di];
    var id  = 'export-' + di + '-' + (d.title || '').slice(0, 30).replace(reSpacesId, '_');
    var emb = await embeddings.createEmbedding(d.text || d.title || '');
    vectorstore.add(id, emb, {
      title:    d.title    || null,
      source:   'export',
      metadata: d.metadata || null,
    });
  }

  vectorstore.save(VECTORS_PATH);
  console.log('[recommender] Ingesta concluida: ' + docs.length + ' docs de ' + abs);
  return { success: true, count: docs.length, path: VECTORS_PATH };
}

// ─── Ingesta banco do Notion ───────────────────────────────────────────────────
async function ingestNotion(databaseId) {
  if (!databaseId) throw new Error('[recommender] databaseId nao informado.');

  var pages = await notionClient.queryDatabase(databaseId);
  clearVectors();

  for (var i = 0; i < pages.length; i++) {
    var page      = pages[i];
    var text      = notionClient.pageToText(page) || '';
    var pageId    = page.id || ('page-' + i);
    var titleProp = page.properties && page.properties.Name && page.properties.Name.title;
    var title     = titleProp
      ? titleProp.map(function(t) { return t.plain_text || ''; }).join('')
      : pageId;

    var emb = await embeddings.createEmbedding(text);
    vectorstore.add(pageId, emb, { title: title, source: 'notion' });
  }

  vectorstore.save(VECTORS_PATH);
  console.log('[recommender] Ingesta Notion concluida: ' + pages.length + ' paginas.');
  return { success: true, count: pages.length, path: VECTORS_PATH };
}

// ─── Busca builds relevantes ──────────────────────────────────────────────────
async function retrieveRelevantBuilds(characters) {
  return dataset.findByCharacters(characters, 12);
}

// ─── Gera recomendacao ────────────────────────────────────────────────────────
async function generateRecommendation(characters, docs, prompt) {
  var client = getOpenAI();

  if (!client) {
    if (!docs || !docs.length) {
      return 'Nao foi possivel encontrar builds relevantes para os personagens informados.';
    }
    var suggestions = '';
    for (var i = 0; i < docs.length; i++) {
      var b = docs[i];
      suggestions += (i + 1) + '. ' + b.name + ' (' + (b.characters || []).join(', ') + ')\n';
      suggestions += (b.description || '') + '\n\n';
    }
    return 'Sugestoes locais para ' + characters.join(', ') + ':\n\n' + suggestions.trim();
  }

  var system = 'Voce e um especialista em builds do jogo Chaos Zero Nightmare. Use as builds recuperadas para montar a melhor recomendacao em PT-BR.';

  var buildsText = '';
  for (var j = 0; j < docs.length; j++) {
    var d = docs[j];
    buildsText += '- ' + d.name + ': ' + (d.description || '') + '\n';
  }

  var userLines = [
    'Personagens: ' + characters.join(', '),
    prompt ? 'Instrucao extra: ' + prompt : '',
    '',
    'Builds recuperadas:',
    buildsText,
  ];

  var user = userLines.filter(function(l) { return l !== ''; }).join('\n');

  try {
    var resp = await client.chat.completions.create({
      model:      process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages:   [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      max_tokens: 600,
    });

    if (
      !resp ||
      !resp.choices ||
      !resp.choices[0] ||
      !resp.choices[0].message ||
      !resp.choices[0].message.content
    ) {
      return 'Erro ao gerar sugestao de build via OpenAI.';
    }

    return resp.choices[0].message.content;

  } catch (err) {
    console.error('[recommender] Erro OpenAI:', err.message);
    throw new Error('Falha ao gerar recomendacao: ' + err.message);
  }
}

module.exports = {
  ingestNotion:           ingestNotion,
  ingestFromExport:       ingestFromExport,
  retrieveRelevantBuilds: retrieveRelevantBuilds,
  generateRecommendation: generateRecommendation,
};