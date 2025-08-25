import 'isomorphic-fetch';
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './pages/App';

// @ts-ignore
delete window.__PRELOADED_STATE__;

(async () => {
  hydrateRoot(
    document.getElementById('root')!,
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  );
})();

if ((module as any).hot) {
  (module as any).hot.accept();
}
