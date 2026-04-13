'use strict';

const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const csv        = require('csv-parser');
const { OpenAI } = require('openai');

const router = express.Router();

// ─── Caminhos ──────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, '../../db/data.csv');

// ─── Helper de coluna (lida com caracteres invisíveis do Notion) ───────────────
function colVal(row) {
  var names = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var keys = Object.keys(row);
    for (var j = 0; j < keys.length; j++) {
      if (keys[j].indexOf(name) !== -1 && row[keys[j]]) {
        return row[keys[j]].toString().trim();
      }
    }
  }
  return '';
}

// ─── Clientes de IA ───────────────────────────────────────────────────────────
function getGeminiClient() {
  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY nao encontrada no .env');
  return new OpenAI({
    apiKey:   apiKey,
    baseURL:  'https://generativelanguage.googleapis.com/v1beta/openai/',
    timeout:  120000,
  });
}

function getOpenAIClient() {
  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY nao encontrada no .env');
  return new OpenAI({ apiKey: apiKey, timeout: 60000 });
}

// ─── Leitura do CSV ───────────────────────────────────────────────────────────
function readCSV() {
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(CSV_PATH)) {
      return reject(new Error('CSV nao encontrado: ' + CSV_PATH));
    }
    var rows = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', function(row) { rows.push(row); })
      .on('end',  function()    { resolve(rows);   })
      .on('error', reject);
  });
}

// ─── Busca builds relevantes ──────────────────────────────────────────────────
async function retrieveRelevantBuilds(characters) {
  var allBuilds = await readCSV();
  var terms     = characters
    .map(function(c) { return c.trim().toLowerCase(); })
    .filter(Boolean);

  // Filtra por nome do personagem
  var relevant = allBuilds.filter(function(row) {
    var name = colVal(row, 'Nome', 'Personagem', 'Name');
    return terms.some(function(t) {
      return name.toLowerCase().indexOf(t) !== -1;
    });
  });

  if (relevant.length > 0) return relevant;

  // Fallback: builds Tier S ou A
  var fallback = allBuilds.filter(function(row) {
    var tier = colVal(row, 'Tier');
    return tier === 'S' || tier === 'A';
  }).slice(0, 8);

  if (fallback.length > 0) {
    console.log('[recommend] Fallback: ' + fallback.length + ' builds Tier S/A');
    return fallback;
  }

  // Ultimo recurso: primeiras 8 builds
  console.warn('[recommend] Sem matches e sem Tier S/A — usando primeiras 8 builds');
  return allBuilds.slice(0, 8);
}

// ─── Monta contexto para o prompt ─────────────────────────────────────────────
function buildContext(docs) {
  var lines = [];
  var limit = Math.min(docs.length, 12);

  for (var i = 0; i < limit; i++) {
    var d      = docs[i];
    var nome   = colVal(d, 'Nome', 'Personagem', 'Name') || 'Desconhecido';
    var classe = colVal(d, 'Classe', 'Funcao', 'Role')   || 'N/A';
    var tier   = colVal(d, 'Tier')                        || 'N/A';
    var combo  = colVal(d, 'Combo')                       || 'N/A';
    var carta  = colVal(d, 'Carta', 'Cartas')             || 'N/A';
    var times  = colVal(d, 'Times')                       || 'N/A';
    var obs    = colVal(d, 'Observacoes', 'Observações')  || 'N/A';

    lines.push(
      '- Nome: ' + nome +
      ' | Classe: '      + classe +
      ' | Tier: '        + tier   +
      ' | Combo: '       + combo  +
      ' | Cartas: '      + carta  +
      ' | Times: '       + times  +
      ' | Observacoes: ' + obs
    );
  }

  return lines.join('\n');
}

// ─── Monta prompt ─────────────────────────────────────────────────────────────
function buildPrompt(characters, contextStr, userPrompt) {
  var extra = userPrompt ? 'Instrucao adicional do usuario: ' + userPrompt : '';

  var lines = [
    'Voce e um especialista em Chaos Zero Nightmare.',
    'Use APENAS as informacoes abaixo como base de builds e sinergias.',
    '',
    'BASE DE DADOS DE BUILDS:',
    contextStr,
    '',
    'Personagens de interesse: ' + characters.join(', '),
    extra,
    '',
    'Regras IMPORTANTES para montar o time de 3 personagens:',
    '- Nao coloque 2 ou mais DPS frageis juntos sem tank ou protetor (ex: Sereniel + Kayron sem protecao e ruim).',
    '- Evite composicoes sem sinergia clara entre os combos dos personagens.',
    '- Prefira: 1 frontliner/tank, 1 DPS principal, 1 suporte/controle/healer.',
    '- Se o usuario pedir um personagem fora de meta, avise e sugira alternativa.',
    '- Use a coluna "Times" e "Observacoes" para entender quais personagens combinam.',
    '',
    'TAREFA:',
    '- Monte o melhor time de 3 personagens com boa sinergia.',
    '- Explique a sinergia e o motivo de NAO usar combinacoes ruins.',
    '- Responda em portugues (PT-BR), de forma estruturada e direta.',
  ];

  return lines.filter(function(l) { return l !== null && l !== undefined; }).join('\n');
}

// ─── Delay helper ─────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

// ─── Geracao com fallback Gemini → OpenAI ─────────────────────────────────────
async function generateRecommendation(characters, docs, userPrompt) {
  var contextStr = buildContext(docs);
  var prompt     = buildPrompt(characters, contextStr, userPrompt);

  var GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
  ];

  // 1. Tenta cada modelo Gemini
  for (var i = 0; i < GEMINI_MODELS.length; i++) {
    var modelName = GEMINI_MODELS[i];
    try {
      console.log('[recommend] Gemini: tentando ' + modelName + '...');
      var client   = getGeminiClient();
      var response = await client.chat.completions.create({
        model:       modelName,
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      var text = response.choices &&
                 response.choices[0] &&
                 response.choices[0].message &&
                 response.choices[0].message.content &&
                 response.choices[0].message.content.trim();

      if (!text) throw new Error('Resposta vazia');

      console.log('[recommend] Gemini OK (' + modelName + ')');
      return text;

    } catch (err) {
      var status = err.status || 0;
      console.warn('[recommend] Gemini falhou (' + modelName + ') → ' + (status || err.message));
      if (status === 429 || status === 503) await delay(3000);
      else await delay(500);
    }
  }

  // 2. Fallback: OpenAI
  console.log('[recommend] Gemini indisponivel. Tentando OpenAI...');

  try {
    var oaiClient = getOpenAIClient();
    var oaiModel  = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    var oaiResp   = await oaiClient.chat.completions.create({
      model:       oaiModel,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    var oaiText = oaiResp.choices &&
                  oaiResp.choices[0] &&
                  oaiResp.choices[0].message &&
                  oaiResp.choices[0].message.content &&
                  oaiResp.choices[0].message.content.trim();

    if (!oaiText) throw new Error('Resposta vazia');

    console.log('[recommend] OpenAI OK (' + oaiModel + ')');
    return oaiText;

  } catch (err) {
    console.error('[recommend] OpenAI falhou → ' + err.message);
    throw new Error('Todas as APIs falharam. Ultimo erro: ' + err.message);
  }
}

// ─── POST /api/recommend ──────────────────────────────────────────────────────
router.post('/', async function(req, res) {
  try {
    var characters = req.body.characters || [];
    var prompt     = req.body.prompt     || '';

    var charList = (Array.isArray(characters) ? characters : [characters])
      .map(function(c) { return c.toString().trim(); })
      .filter(Boolean);

    if (charList.length === 0) {
      return res.status(400).json({
        success: false,
        error:   'Nenhum personagem informado.',
      });
    }

    console.log('[recommend] Personagens: ' + charList.join(', '));

    var docs           = await retrieveRelevantBuilds(charList);
    var recommendation = await generateRecommendation(charList, docs, prompt);

    return res.json({ success: true, recommendation: recommendation });

  } catch (err) {
    console.error('[recommend] Erro na rota:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;