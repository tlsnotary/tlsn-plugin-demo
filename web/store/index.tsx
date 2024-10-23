import { applyMiddleware, combineReducers, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { createLogger } from 'redux-logger';
import attestation from './attestation';


const rootReducer = combineReducers({
  attestation
});

export type AppRootState = ReturnType<typeof rootReducer>;

const createStoreWithMiddleware =
  process.env.NODE_ENV === 'development'
    ? applyMiddleware(
        thunk,
        createLogger({
          collapsed: true,
        }),
      )(createStore)
    : applyMiddleware(thunk)(createStore);

function configureAppStore(preloadedState?: AppRootState) {
  const { attestation } = preloadedState || {};
  return createStoreWithMiddleware(rootReducer, {
    attestation
  });
}

export default configureAppStore;
