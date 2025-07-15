import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../web/pages/App';
import configureAppStore, { AppRootState } from '../web/store';
import { Provider } from 'react-redux';
import { Mutex } from 'async-mutex';
//@ts-ignore
import { verify } from '../rs/0.1.0-alpha.11/index.node';
import { convertNotaryWsToHttp, fetchPublicKeyFromNotary } from './util/index';
import { assignPoapToUser } from './util/index';

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

const sessions = new Map<string, string>();

app.post('/update-session', async (req, res) => {
  console.log('update-session', req.body);
  const { screen_name, session_id } = req.body;

  if (!screen_name || !session_id) {
    return res.status(400).json({ error: 'Missing screen_name or session_id' });
  }

  sessions.set(session_id, screen_name);
  res.json({ success: true });
});

app.post('/check-session', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }
  const screen_name = sessions.get(session_id);
  if (!screen_name) {
    return res.status(404).json({ error: 'Session not found' });
  }
  sessions.delete(session_id);
  res.json({ screen_name });
});

app.post('/poap-claim', async (req, res) => {
  const { screenName } = req.body;
  if (!screenName) {
    return res.status(400).json({ error: 'Missing screen_name' });
  }

  try {
    await mutex.runExclusive(async () => {
      const poapLink = await assignPoapToUser(screenName);

      if (!poapLink) {
        return res.status(404).json({ error: 'No POAPs available' });
      }

      return res.json({ poapLink });
    });
  } catch (error) {
    console.error('Error claiming POAP:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/verify-attestation', async (req, res) => {
  const { attestation } = req.body;
  if (!attestation) {
    return res.status(400).send('Missing attestation');
  }

  try {
    const notaryUrl = attestation.meta.notaryUrl;
    const notaryPem = await fetchPublicKeyFromNotary(notaryUrl);

    const presentation = await verify(attestation.data, notaryPem);

    const presentationObj = {
      sent: presentation.sent,
      recv: presentation.recv,
    };
    res.json({ presentationObj });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error verifying attestation');
  }
});

app.get('*', (req, res) => {
  try {
    const storeConfig: AppRootState = {
      attestation: {
        raw: {
          version: '0.1.0-alpha.11',
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
  } catch (e) {
    res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <title>TLSN Plugin Demo</title>
      <script>
      window.__PRELOADED_STATE__ = {};
    </script>
    <script defer src="/index.bundle.js"></script>
    </head>
    <body>
      <div id="root"></div>
      <div id="modal-root"></div>
    </body>
  </html>
  `);
  }
});

app.listen(port, () => {
  console.log(`Plugin demo listening on port ${port}`);
});
