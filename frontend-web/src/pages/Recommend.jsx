import { useState, useEffect, useRef } from 'react';
import { recommend } from '../api';

// ─── Spinner reutilizavel ──────────────────────────────────────────────────────
function Spinner({ className }) {
  return (
    <svg
      className={'animate-spin h-4 w-4 ' + (className || 'text-white')}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Mensagens progressivas de espera ─────────────────────────────────────────
var WAIT_MESSAGES = [
  { delay: 0,     text: 'Consultando o banco de builds...' },
  { delay: 5000,  text: 'Analisando sinergias com IA...' },
  { delay: 15000, text: 'Quase lá, finalizando a análise...' },
  { delay: 30000, text: 'Isso está demorando mais que o normal, aguarde...' },
];

export default function Recommend() {
  const [chars, setChars]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [waitMsg, setWaitMsg] = useState('');

  const timeoutsRef = useRef([]);
  const abortRef    = useRef(null);

  // ─── Limpa timeouts e abort ao desmontar ─────────────────────────────────────
  useEffect(function() {
    return function() {
      timeoutsRef.current.forEach(function(t) { clearTimeout(t); });
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ─── Limpa timeouts anteriores ────────────────────────────────────────────────
  function clearAllTimeouts() {
    timeoutsRef.current.forEach(function(t) { clearTimeout(t); });
    timeoutsRef.current = [];
    setWaitMsg('');
  }

  // ─── Dispara mensagens progressivas ──────────────────────────────────────────
  function startWaitMessages() {
    clearAllTimeouts();
    WAIT_MESSAGES.forEach(function(msg) {
      var t = setTimeout(function() { setWaitMsg(msg.text); }, msg.delay);
      timeoutsRef.current.push(t);
    });
  }

  // ─── Acao principal ────────────────────────────────────────────────────────
  async function onRecommend() {
    var charList = chars
      .split(',')
      .map(function(s) { return s.trim(); })
      .filter(Boolean);

    if (charList.length === 0) {
      setError('Por favor, insira o nome de ao menos um personagem.');
      return;
    }

    // Cancela requisicao anterior
    if (abortRef.current) abortRef.current.abort();
    var controller   = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      startWaitMessages();

      var res = await recommend(charList, controller.signal);

      if (!controller.signal.aborted) {
        if (res.success) {
          setResult(res.recommendation);
        } else {
          throw new Error(res.error || 'Erro ao gerar recomendacao.');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erro ao conectar com o servidor.');
      }
    } finally {
      clearAllTimeouts();
      if (!abortRef.current || !abortRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !loading) onRecommend();
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">Recomendar Time</h2>
      <p className="text-sm text-gray-500 mb-6">
        A IA analisará o seu banco de dados para sugerir a melhor sinergia de time.
      </p>

      {/* Input + Botao */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          aria-label="Personagens para recomendacao"
          value={chars}
          onChange={function(e) { setChars(e.target.value); }}
          onKeyDown={onKeyDown}
          placeholder="Ex: Tiphera, Nia, Hugo..."
          disabled={loading}
          className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:border-green-500 outline-none transition-all shadow-sm disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={onRecommend}
          disabled={loading}
          className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Spinner className="text-white" />
              Analisando...
            </span>
          ) : 'Sugerir Time'}
        </button>
      </div>

      {/* Mensagem de progresso */}
      {loading && waitMsg && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4 rounded shadow-sm">
          <p className="text-green-700 text-sm font-medium flex items-center gap-2">
            <Spinner className="text-green-600" />
            {waitMsg}
          </p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded shadow-sm">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {result && (
        <div className="bg-white border border-green-100 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-600 px-4 py-2 flex items-center gap-2 text-white font-bold text-sm">
            <span aria-hidden="true">✨</span>
            ANÁLISE DO ORÁCULO CZN
          </div>
          <div className="p-6 text-gray-800 leading-relaxed text-base">
            <div className="whitespace-pre-wrap">{result}</div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!result && !loading && !error && (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 font-medium italic text-lg">
            Aguardando seus personagens para montar a estratégia...
          </p>
        </div>
      )}
    </div>
  );
}