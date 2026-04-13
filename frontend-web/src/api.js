import axios from 'axios';

// ─── Base URL ──────────────────────────────────────────────────────────────────
// Em dev: proxy do Vite redireciona /api para localhost:5000
// Em prod: defina VITE_API_BASE no .env do frontend
var API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// ─── Instancia padrao (builds, status, etc) ───────────────────────────────────
var api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Instancia de longa duracao (chamadas de IA podem demorar mais) ────────────
var apiAI = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutos para chamadas de IA
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor de erro (aplicado nas duas instancias) ───────────────────────
function errorInterceptor(err) {
  var message = 'Erro desconhecido na API';

  if (err.response && err.response.data && err.response.data.error) {
    message = err.response.data.error;
  } else if (err.message) {
    message = err.message;
  }

  console.error('[API Error]', message);
  return Promise.reject(new Error(message));
}

api.interceptors.response.use(function(res) { return res; }, errorInterceptor);
apiAI.interceptors.response.use(function(res) { return res; }, errorInterceptor);

// ─── fetchBuilds ──────────────────────────────────────────────────────────────
export async function fetchBuilds(q, signal) {
  q = q || '';
  var params = q.trim() ? { q: q.trim() } : {};
  var res = await api.get('/builds', {
    params: params,
    signal: signal || undefined,
  });
  return res.data;
}

// ─── recommend ────────────────────────────────────────────────────────────────
export async function recommend(characters, prompt, signal) {
  characters = characters || [];
  prompt     = prompt     || '';
  var res = await apiAI.post('/recommend', {
    characters: characters,
    prompt:     prompt,
  }, {
    signal: signal || undefined,
  });
  return res.data;
}

export default api;