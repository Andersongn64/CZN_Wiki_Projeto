import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';

// ─── Lazy pages ────────────────────────────────────────────────────────────────
var Home      = lazy(function() { return import('./pages/Home'); });
var Recommend = lazy(function() { return import('./pages/Recommend'); });

// ─── Helper: le preferencia de tema salva ─────────────────────────────────────
function getInitialDark() {
  try {
    var saved = localStorage.getItem('czn-theme');
    if (saved) return saved === 'dark';
    if (window.matchMedia) return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    // SSR ou ambiente sem localStorage/matchMedia
  }
  return false;
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="text-center mt-12">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
        404 — Página não encontrada
      </h2>
      <Link
        to="/"
        className="text-chaos-primary hover:underline mt-4 block"
      >
        Voltar para Home
      </Link>
    </div>
  );
}

// ─── Spinner reutilizavel ─────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center mt-16" aria-label="Carregando">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin h-8 w-8 text-chaos-primary"
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
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ dark, toggleDark }) {
  function linkClass(props) {
    var isActive = props.isActive;
    return isActive
      ? 'font-semibold text-chaos-primary border-b-2 border-chaos-primary pb-1 transition-all'
      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white pb-1 transition-all';
  }

  return (
    <nav
      className="flex items-center gap-6 mb-8 border-b border-gray-200 dark:border-gray-700 pb-3"
      aria-label="Navegação principal"
    >
      <NavLink to="/"          className={linkClass}>Builds</NavLink>
      <NavLink to="/recommend" className={linkClass}>Recomendar</NavLink>

      <div className="flex-1" aria-hidden="true" />

      {/* Toggle Dark Mode */}
      <button
        type="button"
        onClick={toggleDark}
        aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-300 shadow-sm"
      >
        {dark ? (
          /* Sol */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m8.66-9H21M3 12H2m15.36-6.36l-.71.71M6.34 17.66l-.71.71M17.66 17.66l.71.71M6.34 6.34l.71.71M12 5a7 7 0 100 14A7 7 0 0012 5z"
            />
          </svg>
        ) : (
          /* Lua */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
            />
          </svg>
        )}
      </button>
    </nav>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  var [dark, setDark] = useState(getInitialDark);

  // Aplica/remove classe "dark" no <html>
  useEffect(function() {
    var root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('czn-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('czn-theme', 'light');
    }
  }, [dark]);

  function toggleDark() {
    setDark(function(prev) { return !prev; });
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="p-6 max-w-5xl mx-auto">

          {/* Header */}
          <header className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chaos-primary flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg" aria-hidden="true">CZ</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                ChaosZero <span className="text-chaos-primary">Wiki</span>
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Nightmare Database</p>
            </div>
          </header>

          {/* Navbar */}
          <Navbar dark={dark} toggleDark={toggleDark} />

          {/* Rotas */}
          <main>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/"          element={<Home />} />
                <Route path="/recommend" element={<Recommend />} />
                <Route path="*"          element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>

        </div>
      </div>
    </BrowserRouter>
  );
}