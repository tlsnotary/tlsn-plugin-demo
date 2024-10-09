import * as Comlink from 'comlink';
import init, { Presentation } from 'tlsn-js';

Comlink.expose({
  init,
  Presentation,
});
