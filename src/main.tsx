import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { PlatformDataProvider } from './data/PlatformDataContext';
import { LocaleProvider } from './i18n/LocaleContext';
import LocalizedBoundary from './i18n/LocalizedBoundary';
import App from './App';
import './index.css';

// Hospedagens estaticas sem rewrite (GitHub Pages, por exemplo) nao resolvem
// deep links do BrowserRouter; nesses builds usamos rotas em hash.
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter;
const basename = import.meta.env.VITE_ROUTER === 'hash' ? undefined : import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <LocalizedBoundary>
        <Router basename={basename}>
          <AuthProvider>
            <PlatformDataProvider>
              <App />
            </PlatformDataProvider>
          </AuthProvider>
        </Router>
      </LocalizedBoundary>
    </LocaleProvider>
  </React.StrictMode>
);
