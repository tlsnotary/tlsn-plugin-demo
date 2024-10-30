import 'isomorphic-fetch';
import type {} from 'redux-thunk/extend-redux';
import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './pages/App';
import { Provider } from 'react-redux';
import configureAppStore from './store';

// @ts-ignore
const store = configureAppStore(window.__PRELOADED_STATE__);

// @ts-ignore
delete window.__PRELOADED_STATE__;

(async () => {
  hydrateRoot(
    document.getElementById('root')!,
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>,
  );
})();

if ((module as any).hot) {
  (module as any).hot.accept();
}
