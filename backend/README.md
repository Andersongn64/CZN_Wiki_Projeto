Esqueleto de backend para Chaos Zero Nightmare

Estrutura:
- src/
  - index.js (servidor Express)
  - routes/
    - builds.js (listar/buscar builds)
    - recommend.js (endpoint de recomendação RAG)
    - notionAuth.js (início/callback OAuth)
  - services/
    - notionClient.js (SDK Notion)
    - recommender.js (ingestão + recuperação + geração)
    - embeddings.js (embeddings OpenAI)
    - vectorstore.js (store vetorial simples em disco)
  - db/
    - vectors.json (gerado pela ingestão)
- .env.example

Início rápido (dev):
1. Copie `.env.example` para `.env` e preencha NOTION_CLIENT_ID, NOTION_CLIENT_SECRET (e OPENAI_API_KEY quando disponível).
2. Instale dependências: npm install
3. Inicie servidor dev: npm run dev

Se estiver usando o frontend-web, execute em outra aba:
- cd ../frontend-web
- npm install
- npm run dev

O frontend por padrão usa `http://localhost:5000/api` (ajustável via `VITE_API_BASE`).

Fluxo OAuth Notion:
1. Em configurações da integração Notion, defina redirect URI para: http://localhost:5000/api/auth/notion/callback
2. Inicie OAuth: abra http://localhost:5000/api/auth/notion/start
3. Após autorizar, callback salvará NOTION_ACCESS_TOKEN em `backend/.env` (para testes).

Ingestão (RAG):
- Use `ingestNotion(databaseId)` em `src/services/recommender.js` ou chame o helper no código para popular `db/vectors.json`.

Notion ingestion (local CLI)
 - You can run a local ingestion to populate `backend/db/vectors.json` from a Notion database.
 - Option A (quick test using a token):
  1. Copy `.env.example` to `.env` and set:
    - `NOTION_ACCESS_TOKEN` (internal integration token)
    - `NOTION_DATABASE_ID` (the database id to ingest)
  2. Install dependencies: `npm install`
  3. Run ingestion:
    - `npm run ingest`  (reads `NOTION_DATABASE_ID` from env)
    - or `npm run ingest -- <DATABASE_ID>` to pass the id as an argument.

 - Option B (OAuth flow):
  1. Set `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, and `NOTION_REDIRECT_URI` in `.env`.
  2. Start the server (`npm start`) and open `http://localhost:5000/api/auth/notion/start` to begin OAuth.
  3. After authorizing, the callback will provide or persist the access token for use by the ingest endpoint.

Notes:
 - If `NOTION_ACCESS_TOKEN` is not set, the CLI and API will exit with a clear message telling you to configure credentials.
 - The CLI simply calls `src/services/recommender.ingestNotion(databaseId)` and writes `backend/db/vectors.json`.

Nota de segurança:
- Armazenar tokens em `.env` é apenas para testes rápidos. Use armazenamento seguro em produção.
