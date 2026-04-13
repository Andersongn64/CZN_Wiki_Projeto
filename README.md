# 🎮 Chaos Zero Nightmare — Wiki + Sistema de Recomendação de Times

Um aplicativo web e mobile que funciona como **wiki interativa** para o jogo Chaos Zero Nightmare, com um **sistema inteligente de recomendação de times** baseado em IA (Gemini/OpenAI).

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Recursos Implementados](#recursos-implementados)
- [Arquitetura](#arquitetura)
- [Instalação e Setup](#instalação-e-setup)
- [Como Usar](#como-usar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Rotas da API](#rotas-da-api)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

---

## 🎯 Visão Geral

O projeto **Chaos Zero Nightmare** é uma solução completa para jogadores que desejam:

1. **Consultar Builds**: Pesquisar e visualizar construções de personagens com detalhes completos
2. **Receber Recomendações de Times**: IA analisa sinergias entre personagens e sugere composições otimizadas
3. **Acessar em Múltiplos Dispositivos**: Web (Vite + React) e Mobile (Expo React Native)
4. **Integração com Notion**: Banco de dados dinâmico que alimenta todo o sistema

---

## ✨ Recursos Implementados

### 🌐 Frontend Web (Vite + React)

- **Página de Builds (Wiki)**
  - 📌 Listagem de todos os personagens com suas builds
  - 🔍 Busca em tempo real por nome, classe ou tier
  - 📖 Cards expansíveis com informações completas:
    - Nome, classe, tier
    - Cartas (habilidades)
    - Estratégia e combo principal
    - Link para build completa (Game8)
    - Observações táticas
    - Times recomendados
  - 📱 Design responsivo com Tailwind CSS

- **Página de Recomendação**
  - 🤖 Input para selecionar personagens
  - 🧠 Geração de recomendação via IA (Gemini ou OpenAI)
  - 📊 Resposta estruturada com:
    - Time sugerido (3 personagens)
    - Explicação de sinergias
    - Dicas táticas
  - ⚡ Feedback progressivo durante processamento
  - 🌙 Suporte a modo escuro/claro com persistência

### 🔧 Backend (Node.js + Express)

- **Rota `/api/builds`** (GET)
  - Carga dados do CSV do Notion
  - Busca por nome de personagem (case-insensitive)
  - Retorna array de builds formatadas

- **Rota `/api/recommend`** (POST)
  - Recebe lista de personagens do frontend
  - Busca builds relevantes no banco de dados
  - Integração com **Gemini** (com fallback para OpenAI)
  - Timeout estendido para requisições de IA
  - Resposta com recomendação estruturada

- **Sistema de Fallback Inteligente**
  - Tenta Gemini 2.0 Flash → Gemini 1.5 Flash → OpenAI GPT-4
  - Garante que sempre há uma resposta para o usuário
  - Logs detalhados sobre qual modelo foi usado

### 📱 Mobile App (Expo React Native)

- Estrutura preparada para:
  - Navegação com React Navigation
  - Mesmas funções do web (Builds + Recomendação)
  - Suporte cross-platform (iOS/Android/Web)
  - Cliente Axios integrado

### 📊 Data Management

- CSV estruturado com colunas:
  - Nome, Classe, Tier, Cartas, Combo
  - Build (link), Observações, Times
  - ~60+ personagens mapeados
  - Atualizado em: 10 de março de 2026

---

## 🏗️ Arquitetura

```
backend/
├── src/
│   ├── index.js              # Servidor Express
│   ├── routes/
│   │   ├── builds.js         # GET /api/builds
│   │   ├── recommend.js      # POST /api/recommend (IA)
│   │   ├── notionAuth.js     # OAuth Notion (stub)
│   │   └── admin.js          # Painel admin
│   └── services/
│       ├── notionClient.js   # SDK Notion
│       ├── embeddings.js     # Vetorização (stub)
│       ├── vectorstore.js    # Vector DB (stub)
│       └── recommender.js    # Lógica de recomendação
├── db/
│   ├── data.csv              # Dados dos personagens
│   └── vectors.json          # Embeddings (futuro)
└── scripts/
    └── ingest.js             # Ingestão de dados Notion

frontend-web/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Wiki de builds
│   │   └── Recommend.jsx     # Recomendador IA
│   ├── App.jsx               # Roteamento
│   ├── api.js                # Cliente Axios
│   └── index.css             # Tailwind CSS

mobile-app/
├── src/
│   ├── screens/
│   │   ├── Home.js
│   │   └── Recommend.js
│   └── api.js                # Cliente compartilhado
└── App.js                    # App Expo

```

---

## 🚀 Instalação e Setup

### Pré-requisitos

- **Node.js** >= 18.0.0
- **NPM** >= 9.0.0
- Chave da API **Google Gemini** ou **OpenAI** (ou ambas para fallback)
- (Opcional) Token Notion para ingestão dinâmica

### 1️⃣ Clonar e Instalar Dependências

```bash
# Raiz do projeto
cd "CZN DB"

# Backend
cd backend
npm install

# Frontend Web
cd ../frontend-web
npm install

# Mobile (opcional)
cd ../mobile-app
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```bash
# Cópia de backend/.env.example
cp backend/.env.example backend/.env
```

Preencha o arquivo `.env`:

```env
# Porta do servidor (padrão: 5000)
PORT=5000

# ===== IA - Escolha pelo menos um =====
# Google Gemini (recomendado - grátis com limite)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (fallback - pago)
OPENAI_API_KEY=your_openai_api_key_here

# ===== Notion (Futuro) =====
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_ACCESS_TOKEN=your_notion_access_token
NOTION_DATABASE_ID=your_notion_database_id
```

### 3️⃣ Iniciar Desenvolvimento

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Servidor rodando em http://localhost:5000
```

**Terminal 2 — Frontend Web:**
```bash
cd frontend-web
npm run dev
# Aplicação em http://localhost:5173 (Vite padrão)
```

**Terminal 3 — Mobile (opcional):**
```bash
cd mobile-app
npm start
# Escolha: a (Android) | i (iOS) | w (Web)
```

---

## 💻 Como Usar

### 🔍 **Página de Builds (Wiki)**

1. Acesse a aba **"Builds"** na navegação
2. Você verá uma lista de todos os personagens
3. **Para buscar específico:**
   - Digite o nome no campo de busca (ex: "Tiphera", "Hugo", "Mika")
   - Pressione Enter ou clique em "Buscar"
4. **Para visualizar detalhes:**
   - Clique no card do personagem para expandir
   - Veja combos, cartas, observações e times onde ele funciona

### 🤖 **Página de Recomendação**

1. Acesse a aba **"Recomendar"**
2. **Digite os personagens desejados:**
   - Separados por vírgula (ex: `Tiphera, Nia, Hugo`)
   - Use nomes como aparecem na wiki
3. Clique em **"Enviar para IA"**
4. **Aguarde o processamento:**
   - Mensagens de progresso aparecem ("Consultando banco...", "Analisando sinergias...")
5. **Receba a recomendação:**
   - Time sugerido com 3 personagens
   - Explicação detalhada de sinergias
   - Dicas táticas

### 🌙 **Modo Escuro/Claro**

- Clique no botão do sol/lua no canto superior direito
- Preferência salva automaticamente no navegador

---

## 🔌 Variáveis de Ambiente

| Variável | Tipo | Obrigatório | Descrição |
|----------|------|-------------|-----------|
| `PORT` | number | ❌ | Porta do servidor (padrão: 5000) |
| `GEMINI_API_KEY` | string | ✅* | Chave da API Google Gemini |
| `OPENAI_API_KEY` | string | ✅* | Chave da API OpenAI |
| `NOTION_CLIENT_ID` | string | ❌ | ID OAuth Notion (futuro) |
| `NOTION_CLIENT_SECRET` | string | ❌ | Secret OAuth Notion (futuro) |
| `NOTION_ACCESS_TOKEN` | string | ❌ | Token de integração Notion |
| `NOTION_DATABASE_ID` | string | ❌ | ID da database Notion |

**\* Obrigatório ter pelo menos um (Gemini ou OpenAI)**

---

## 📡 Rotas da API

### GET `/api/health`
Verificação rápida da saúde do servidor.

**Resposta:**
```json
{ "ok": true }
```

### GET `/api/builds`
Lista todos os personagens/builds ou filtra por busca.

**Parâmetros Query:**
- `q` (string, opcional): termo de busca (nome, classe, etc)

**Exemplo:**
```bash
GET http://localhost:5000/api/builds?q=tiphera
```

**Resposta:**
```json
[
  {
    "id": 0,
    "name": "Tiphera",
    "classe": "Suporte",
    "tier": "S",
    "cartas": "Barrier Deployment, Creation and Destruction, ...",
    "combo": "Quantum Seed para curar e criar Archetype...",
    "link": "https://game8.co/games/Chaos-Zero-Nightmare/archives/582561",
    "observacoes": "Tiphera é uma support focada em criar Archetype...",
    "times": "Combo Infinito (link)"
  }
]
```

### POST `/api/recommend`
Gera recomendação de time usando IA.

**Body:**
```json
{
  "characters": ["Tiphera", "Nia", "Hugo"],
  "prompt": "Foco em dano rápido com bom controle"
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "recommendation": "Time recomendado: Tiphera (Suporte), Kayron (DPS), Clara (Sub-DPS). Sinergia: Tiphera gera AP e exaure cartas para ativar Kayron constantemente...",
  "model": "gemini-2.0-flash"
}
```

**Resposta (Erro):**
```json
{
  "success": false,
  "error": "Nenhum personagem encontrado para: XXX"
}
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web REST
- **@notionhq/client** - Integração Notion
- **OpenAI SDK** - Acesso GPT-4 e Gemini (via compatibilidade OpenAI)
- **csv-parser** - Parse de dados CSV
- **Multer** - Upload de arquivos
- **CORS** - Cross-origin requests
- **Dotenv** - Gerenciamento de variáveis
- **Nodemon** - Reload automático em dev

### Frontend Web
- **React 18** - UI framework
- **Vite** - Build tool rápido
- **Tailwind CSS** - Styling utilitário
- **Axios** - Cliente HTTP
- **React Router DOM** - Roteamento
- **PostCSS** - Processamento CSS
- **Vitest** - Testes unitários

### Mobile
- **Expo** - Plataforma React Native
- **React Native** - Framework mobile
- **React Navigation** - Navegação
- **Axios** - Cliente HTTP (compartilhado)

### IA & Data
- **Google Gemini** - Modelo de linguagem primário
- **OpenAI GPT-4** - Fallback secundário
- **CSV** - Armazenamento de dados (tabela local)

---

## 📝 Notas de Desenvolvimento

### Banco de Dados
- ✅ CSV local (`backend/db/data.csv`) com ~60+ builds
- ⏳ Integração Notion dinâmica (próxima fase)
- ⏳ Vector store para embeddings (RAG futuro)

### Estados da IA
- ✅ Gemini 2.0 Flash (prioritário)
- ✅ Fallback automático para Gemini 1.5 Flash
- ✅ Fallback final para OpenAI GPT-4
- ❌ Tratamento completo de erros (em construção)

### Interface
- ✅ Modo escuro/claro com persistência
- ✅ Modo responsivo (mobile-first)
- ✅ Feedback de carregamento com mensagens progressivas
- ⏳ Temas customizáveis

---

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY não encontrada"
- Verifique se o arquivo `.env` existe em `backend/`
- Confirme que `GEMINI_API_KEY` está preenchida
- Reinicie o servidor: `npm run dev`

### Erro: "CSV não encontrado"
- Confirme que `backend/db/data.csv` existe
- O arquivo deve estar no caminho correto

### API retorna 504 (Timeout)
- Aumentar timeout em `frontend-web/src/api.js`
- Verificar se a chave da IA está válida
- Tentar com um número menor de personagens

### Frontend não conecta ao backend
- Verificar se backend está rodando em `http://localhost:5000`
- Conferir CORS: `cors()` deve estar ativo em `backend/src/index.js`
- Ajustar `VITE_API_BASE` se necessário

---

## 📦 Build para Produção

### Frontend Web
```bash
cd frontend-web
npm run build
# Gera: dist/ pronto para deploy
```

### Backend
```bash
cd backend
# Apenas executar com Node.js:
node src/index.js
```

---

## 📚 Referências

- [Game8 - Chaos Zero Nightmare Builds](https://game8.co/games/Chaos-Zero-Nightmare/)
- [Google Gemini API](https://ai.google.dev/)
- [OpenAI API](https://platform.openai.com/)
- [Notion API](https://developers.notion.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Expo Documentation](https://docs.expo.dev/)

---

## 📄 Licença

Este projeto é de uso pessoal/educacional. Chaos Zero Nightmare é propriedade intelectual do seu criador.

---

## 🎓 Status do Projeto

- [x] Frontend Web (Builds + Recomendação)
- [x] Backend com Gemini/OpenAI
- [x] Rota `/api/builds` (CSV)
- [x] Rota `/api/recommend` (IA com fallback)
- [x] Design responsivo & modo escuro
- [ ] Integração completa Notion
- [ ] Mobile app finalizado
- [ ] Vector store & embeddings (RAG completo)
- [ ] OAuth Notion
- [ ] Painel admin
- [ ] Testes automatizados

---

**Última atualização:** 7 de abril de 2026  
**Desenvolvedor:** CZN DB Project

## Licença

Este projeto é privado e não possui licença pública definida.
