'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs').promises;

const router = express.Router();

// node-fetch: se der erro de require, rode: npm install node-fetch@2
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.error('[notionAuth] node-fetch not found. Run: npm install node-fetch@2');
  process.exit(1);
}

// ─── Configuração ──────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.NOTION_CLIENT_ID;
const CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET;
const REDIRECT_URI  = process.env.NOTION_REDIRECT_URI || 'http://localhost:5000/api/auth/notion/callback';

// ─── Helper: salva token no .env (apenas dev) ─────────────────────────────────
async function saveTokenToEnv(token) {
  try {
    const envPath = path.join(__dirname, '../../.env');
    let content   = '';

    try {
      content = await fs.readFile(envPath, 'utf8');
    } catch (e) {
      content = ''; // .env ainda não existe, cria do zero
    }

    const key   = 'NOTION_ACCESS_TOKEN';
    const line  = `${key}=${token}`;
    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      if (content && !content.endsWith('\n')) content += '\n';
      content += line + '\n';
    }

    await fs.writeFile(envPath, content, { encoding: 'utf8', flag: 'w' });
    console.warn('[notionAuth] Token salvo no .env — use apenas em desenvolvimento!');
    return true;

  } catch (err) {
    console.error('[notionAuth] Falha ao salvar token no .env:', err.message);
    return false;
  }
}

// ─── GET /api/auth/notion/start ───────────────────────────────────────────────
// Redireciona o usuário para a página de autorização do Notion
router.get('/start', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).send('NOTION_CLIENT_ID não configurado no .env');
  }

  const url = new URL('https://api.notion.com/v1/oauth/authorize');
  url.searchParams.set('client_id',     CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('owner',         'user');
  url.searchParams.set('redirect_uri',  REDIRECT_URI);

  res.redirect(url.toString());
});

// ─── GET /api/auth/notion/callback ───────────────────────────────────────────
// Recebe o code e troca pelo access_token
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  // Notion pode retornar ?error=access_denied se o usuário cancelou
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  if (!code) {
    return res.status(400).json({ success: false, error: 'Missing code' });
  }

  if (!CLIENT_SECRET) {
    return res.status(500).json({ success: false, error: 'NOTION_CLIENT_SECRET não configurado' });
  }

  try {
    const tokenResp = await fetch('https://api.notion.com/v1/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const data = await tokenResp.json();

    if (!tokenResp.ok) {
      console.error('[notionAuth] Notion retornou erro:', data);
      return res.status(tokenResp.status).json({
        success: false,
        error:   data.error || 'Token exchange failed',
        detail:  data.error_description || null,
      });
    }

    // Notion retorna access_token diretamente na raiz do objeto
    const accessToken = data.access_token;
    let saved = false;

    if (accessToken) {
      saved = await saveTokenToEnv(accessToken);
      // Atualiza process.env para a sessão atual sem precisar reiniciar
      process.env.NOTION_ACCESS_TOKEN = accessToken;
    } else {
      console.warn('[notionAuth] Resposta do Notion não contém access_token:', data);
    }

    return res.json({ success: true, data, savedToEnv: saved });

  } catch (err) {
    console.error('[notionAuth] Erro no token exchange:', err.message);
    return res.status(500).json({ success: false, error: 'Token exchange failed' });
  }
});

module.exports = router;