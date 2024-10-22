import 'isomorphic-fetch';
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './pages/App';
('use client');

(async () => {
  hydrateRoot(
    document.getElementById('root')!,
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
})();

if ((module as any).hot) {
  (module as any).hot.accept();
}
