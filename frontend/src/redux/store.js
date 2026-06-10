// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slices/authSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//   },
// });

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

import storageModule from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

const storage = storageModule.default || storageModule;

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(
  persistConfig,
  authReducer
);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
  },
});

export const persistor = persistStore(store);