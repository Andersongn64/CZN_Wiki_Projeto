'use strict';

// ─── Cliente lazy ─────────────────────────────────────────────────────────────
var _notion          = null;
var _notionAvailable = null; // null = nao verificado ainda

function getNotion() {
  if (_notionAvailable !== null) {
    return _notionAvailable ? _notion : null;
  }

  try {
    var Client = require('@notionhq/client').Client;
    var token  = process.env.NOTION_ACCESS_TOKEN || process.env.NOTION_TOKEN;

    if (!token) {
      console.warn('[notionClient] Nenhum token configurado (NOTION_ACCESS_TOKEN ou NOTION_TOKEN).');
      _notionAvailable = false;
      return null;
    }

    _notion = new Client({
      auth:    token,
      // Notion-Version 2022-06-28 ja e o padrao do SDK
    });

    _notionAvailable = true;
    console.log('[notionClient] Cliente Notion inicializado com sucesso.');
    return _notion;

  } catch (err) {
    console.warn('[notionClient] SDK @notionhq/client nao disponivel:', err.message);
    _notionAvailable = false;
    return null;
  }
}

// ─── Query com paginacao completa ─────────────────────────────────────────────
async function queryDatabase(databaseId, maxPages) {
  maxPages = maxPages || 500; // limite de seguranca

  var client = getNotion();
  if (!client) {
    throw new Error('[notionClient] Notion nao disponivel. Instale @notionhq/client e configure o token.');
  }
  if (!databaseId) {
    throw new Error('[notionClient] databaseId nao informado.');
  }

  var pages  = [];
  var cursor = undefined;
  var rounds = 0;

  do {
    var params = { database_id: databaseId };
    if (cursor) params.start_cursor = cursor;

    var resp = await client.databases.query(params);

    for (var i = 0; i < resp.results.length; i++) {
      pages.push(resp.results[i]);
    }

    cursor = resp.has_more ? resp.next_cursor : undefined;
    rounds++;

    if (pages.length >= maxPages) {
      console.warn('[notionClient] Limite de ' + maxPages + ' paginas atingido, interrompendo paginacao.');
      break;
    }

  } while (cursor);

  console.log('[notionClient] ' + pages.length + ' paginas carregadas do banco ' + databaseId + ' em ' + rounds + ' requisicao(oes).');
  return pages;
}

// ─── Extrai texto de uma pagina do Notion ─────────────────────────────────────
function pageToText(page) {
  var props = page.properties || {};
  var parts = [];

  var keys = Object.keys(props);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = props[k];

    if (!v) continue;

    // Titulo (Name, Nome, Personagem, Title)
    if (v.type === 'title' && v.title) {
      var titleText = v.title.map(function(t) { return t.plain_text || ''; }).join('');
      if (titleText) parts.push(k + ': ' + titleText);
      continue;
    }

    // Texto rico
    if (v.type === 'rich_text' && v.rich_text) {
      var rtText = v.rich_text.map(function(r) { return r.plain_text || ''; }).join('');
      if (rtText) parts.push(k + ': ' + rtText);
      continue;
    }

    // Select simples (Tier, Classe, etc)
    if (v.type === 'select' && v.select) {
      parts.push(k + ': ' + v.select.name);
      continue;
    }

    // Multi-select (Tags, Times, etc)
    if (v.type === 'multi_select' && v.multi_select) {
      var msText = v.multi_select.map(function(m) { return m.name; }).join(', ');
      if (msText) parts.push(k + ': ' + msText);
      continue;
    }

    // Numero
    if (v.type === 'number' && v.number !== null && v.number !== undefined) {
      parts.push(k + ': ' + v.number);
      continue;
    }

    // URL
    if (v.type === 'url' && v.url) {
      parts.push(k + ': ' + v.url);
      continue;
    }

    // Checkbox
    if (v.type === 'checkbox') {
      parts.push(k + ': ' + (v.checkbox ? 'sim' : 'nao'));
      continue;
    }
  }

  return parts.join('\n');
}

// ─── Verifica se o Notion esta disponivel ─────────────────────────────────────
function isAvailable() {
  return getNotion() !== null;
}

module.exports = {
  queryDatabase: queryDatabase,
  pageToText:    pageToText,
  isAvailable:   isAvailable,
};