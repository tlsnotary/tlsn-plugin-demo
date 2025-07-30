import express from 'express';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../web/pages/App';
import { Mutex } from 'async-mutex';
//@ts-ignore
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
  if (
    req.headers['x-verifier-secret-key'] !== process.env.VERIFIER_SECRET_KEY
  ) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  console.log('Update session:', req.body);

  const { screen_name, session_id } = req.body;

  if (!screen_name || !session_id) {
    return res.status(400).json({ error: 'Missing screen_name or session_id' });
  }

  sessions.set(session_id, screen_name);
  console.log('Updated session:', session_id, screen_name);
  res.json({ success: true });
});

app.post('/check-session', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }
  let screen_name: string | undefined;
  for (let i = 0; i < 5; i++) {
    screen_name = sessions.get(session_id);
    if (screen_name) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('Check session:', session_id, screen_name);
  if (!screen_name) {
    return res.status(404).json({ error: 'Session not found' });
  }
  sessions.delete(session_id);
  res.json({ screen_name });
});

app.post('/poap-claim', async (req, res) => {
  const { screenName, sessionId } = req.body;
  const sn = screenName || sessions.get(sessionId);

  if (!sn) {
    return res.status(400).json({ error: 'Missing screen_name or sessionId' });
  }

  try {
    await mutex.runExclusive(async () => {
      if (process.env.NODE_ENV === 'development') {
        return res.status(404).json({ error: 'No POAPs available in development mode' });
      }

      const poapLink = await assignPoapToUser(sn);

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

function renderHTML(html: string = '', preloadedState: any = {}) {
  return `
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
  `;
}

app.get('*', (req, res) => {
  try {
    const html = renderToString(
      <StaticRouter location={req.url}>
        <App />
      </StaticRouter>
    );

    res.send(renderHTML(html));
  } catch (error) {
    console.error('SSR Error:', error);
    // Send client-only version on SSR error
    res.send(renderHTML());
  }
});

app.listen(port, () => {
  console.log(`Plugin demo listening on port ${port}`);
});
