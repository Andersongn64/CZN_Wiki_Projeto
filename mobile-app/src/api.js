import axios from 'axios';

const API_BASE = '/api';

// Cliente com timeout generoso para chamadas de IA (que podem demorar)
const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutos
});

export async function fetchBuilds(q = '') {
  const res = await api.get('/builds', { params: { q } });
  return res.data;
}

export async function recommend(characters = [], prompt = '') {
  const res = await api.post('/recommend', { characters, prompt });
  return res.data;
}