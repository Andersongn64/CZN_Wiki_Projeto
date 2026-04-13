<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Project: Chaos Zero Nightmare — Wiki + RAG recommendation

- This workspace contains three skeletons: `backend` (Node.js + Express), `frontend-web` (Vite + React) and `mobile-app` (Expo React Native).
- Secrets (Notion integration token, OpenAI key) must be placed in `backend/.env` (see `.env.example`).
- The backend implements a RAG-ready pipeline: Notion ingestion -> embeddings -> vector store (stub) -> retrieval + LLM generation (stubbed). Fill in OpenAI/other provider code where indicated.
- Keep code modular: `notionClient.js`, `embeddings.js`, `vectorstore.js`, `routes/recommend.js`.
- Use the provided API surface (`/api/builds`, `/api/recommend`) for both web and mobile clients.
