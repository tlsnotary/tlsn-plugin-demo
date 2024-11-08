import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../web/pages/App';
import configureAppStore, { AppRootState } from '../web/store';
import { Provider } from 'react-redux';
import { getPoapLink } from './util/index';
import { Mutex } from 'async-mutex';
//@ts-ignore
import { verify } from '../rs/0.1.0-alpha.7/index.node';
import { convertNotaryWsToHttp, fetchPublicKeyFromNotary } from './util/index';

const app = express();
const port = 3030;

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
app.use(express.json());
const mutex = new Mutex();

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
      },
    },
  };

  const store = configureAppStore(storeConfig);

  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url}>
        <App />
      </StaticRouter>
    </Provider>,
  );

  const preloadedState = store.getState();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
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

app.post('/poap-claim', async (req, res) => {
  const { screenName } = req.body;

  if (!screenName) {
    return res.status(400).send('Missing screen_name');
  }
  await mutex.runExclusive(async () => {
    const poapLink = getPoapLink(screenName);
    if (!poapLink) {
      return res.status(500).send('No more POAP links available');
    }
    res.json({ poapLink });
  });
});

app.post('/verify-attestation', async (req, res) => {
  const { attestation } = req.body;
  if (!attestation) {
    return res.status(400).send('Missing attestation');
  }
    /**
   * Two potential uncaught errors are causing the server to shutdown:
   *
   * 1. fetchPublicKeyFromNotary will throw an error is notary url is localhost (invalid pub key)
   * 2. I think verify would throw error or return null if notaryPem is undefined/invalid
   *
   * We should:
   * 1. Refactor fetch public key from notary to return null on error
   * 2. Refactor fetch public key to return a hardcoded pem of the localhost notary if url is localhost
   * 3. Put this entire request handler in a try-catch and res.json({ error: error }) when an error is caught
   * 4. Just in case, i would put the `/poap-claim` handler in a similar try-catch as well
   */
  const notaryUrl = convertNotaryWsToHttp(attestation.meta.notaryUrl);
  const notaryPem = await fetchPublicKeyFromNotary(notaryUrl);
  const presentation = verify(attestation.data, notaryPem);

  const presentationObj = {
    sent: presentation.sent,
    recv: presentation.recv,
  };

  res.json({ presentationObj });
});

app.listen(port, () => {
  console.log(`Plugin demo listening on port ${port}`);
});
