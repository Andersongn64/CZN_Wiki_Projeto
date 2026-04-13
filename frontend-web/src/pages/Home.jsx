import { useEffect, useState, useRef } from 'react';
import { fetchBuilds } from '../api';

export default function Home() {
  const [builds, setBuilds]     = useState([]);
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(true); // true desde o inicio para evitar flash
  const [error, setError]       = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searched, setSearched] = useState(false); // controla se ja houve busca
  const abortRef = useRef(null);

  // ─── Helper: busca com abort de requisicao anterior ────────────────────────
  async function loadBuilds(query) {
    // cancela requisicao anterior se ainda estiver em andamento
    if (abortRef.current) abortRef.current.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchBuilds(query || undefined, controller.signal);
      if (!controller.signal.aborted) {
        setBuilds(data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erro ao carregar builds.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadBuilds('');
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ─── Busca manual ──────────────────────────────────────────────────────────
  function onSearch() {
    setExpandedId(null);
    setSearched(true);
    loadBuilds(q.trim());
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') onSearch();
  }

  // ─── Toggle card ──────────────────────────────────────────────────────────
  function toggleExpand(id) {
    setExpandedId(function(prev) { return prev === id ? null : id; });
  }

  // ─── Tier badge color ─────────────────────────────────────────────────────
  function tierColor(tier) {
    var map = { S: 'bg-yellow-100 text-yellow-700 border-yellow-300', A: 'bg-orange-100 text-orange-700 border-orange-300', B: 'bg-blue-100 text-blue-700 border-blue-300' };
    return map[tier] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        ChaosZero Wiki
      </h2>

      {/* Barra de Busca */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          aria-label="Buscar personagem ou build"
          value={q}
          onChange={function(e) { setQ(e.target.value); }}
          onKeyDown={onKeyDown}
          placeholder="Ex: Tiphera, Nia, Hugo..."
          className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-blue-500 outline-none transition-all"
        />
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-blue-600 font-medium mb-4 text-center">
          Carregando builds...
        </div>
      )}

      {/* Lista */}
      <div className="grid gap-4">
        {!loading && builds.length === 0 && (
          <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-xl border-2 border-dashed">
            {searched && q
              ? 'Nenhum resultado para "' + q + '".'
              : 'Nenhum registro encontrado.'}
          </p>
        )}

        {builds.map(function(b) {
          var isOpen = expandedId === b.id;
          return (
            <div
              key={b.id}
              className={'border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ' + (isOpen ? 'border-blue-500' : 'border-gray-100 bg-white')}
            >
              {/* Cabecalho */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                className="p-4 flex justify-between items-center cursor-pointer select-none"
                onClick={function() { toggleExpand(b.id); }}
                onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') toggleExpand(b.id); }}
              >
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <strong className="text-xl text-gray-900">{b.name}</strong>
                    {b.tier && (
                      <span className={'text-xs font-black px-2 py-0.5 rounded border ' + tierColor(b.tier)}>
                        TIER {b.tier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                    {b.classe || 'Classe não informada'}
                  </p>
                </div>
                <div className="text-blue-500 font-bold text-sm ml-4 shrink-0">
                  {isOpen ? '▲ RECOLHER' : '▼ DETALHES'}
                </div>
              </div>

              {/* Conteudo expandido */}
              {isOpen && (
                <div className="p-5 bg-gray-50 border-t border-gray-100">
                  <div className="space-y-5">

                    {/* Cartas */}
                    <div>
                      <h4 className="text-xs font-bold text-blue-600 uppercase mb-2">
                        🃏 Recomendação de Cartas
                      </h4>
                      <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-200 text-sm leading-relaxed shadow-sm">
                        {b.cartas || 'Nenhuma carta listada.'}
                      </p>
                    </div>

                    {/* Combo */}
                    <div>
                      <h4 className="text-xs font-bold text-red-600 uppercase mb-2">
                        ⚔️ Sequência de Combo
                      </h4>
                      <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-200 text-sm font-mono shadow-sm">
                        {b.combo || 'Combo não disponível.'}
                      </p>
                    </div>

                    {/* Times */}
                    {b.times && (
                      <div>
                        <h4 className="text-xs font-bold text-green-600 uppercase mb-2">
                          👥 Sinergia de Times
                        </h4>
                        <p className="text-gray-800 bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                          {b.times}
                        </p>
                      </div>
                    )}

                    {/* Observacoes */}
                    {b.observacoes && (
                      <div>
                        <h4 className="text-xs font-bold text-purple-600 uppercase mb-2">
                          💡 Dicas Estratégicas
                        </h4>
                        <p className="text-gray-700 bg-purple-50 p-3 rounded-lg border border-purple-100 text-sm italic">
                          "{b.observacoes}"
                        </p>
                      </div>
                    )}

                    {/* Link externo */}
                    {b.link && (
                      <div className="pt-2">
                        <a
                          href={b.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={function(e) { e.stopPropagation(); }}
                          className="inline-flex items-center justify-center w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                        >
                          Ver Guia Completo (Game8) ↗
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}