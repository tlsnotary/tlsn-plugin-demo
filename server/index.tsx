import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../web/pages/App';
import configureAppStore, { AppRootState } from '../web/store';
import { Provider } from 'react-redux';


const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  res.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-origin-Opener-Policy', 'same-origin');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.static('build/ui'));

app.get('*', (req, res) => {

  const storeConfig: AppRootState = {
    attestation: {
        raw: {
          version: '0.1.0-alpha.7',
          data: '',
          meta: {
            notaryUrl: '',
            websocketProxyUrl: '',
            pluginUrl: '',
          },
      }
    }
  };
  const store = configureAppStore(storeConfig);

  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url}>
        <App />
      </StaticRouter>
    </Provider>
  );

  const preloadedState = store.getState();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/static/favicon.png" />
        <title>TLSN Plugin Demo</title>
        <script>
        window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState)};
      </script>
      <script defer src="/index.bundle.js"></script>
      </head>
      <body>
        <div id="root">${html}</div>
        <div id="modal-root"></div>
      </body>
    </html>
    `);
});

app.listen(port, () => {
  console.log(`Plugin demo listening on port ${port}`);
});
