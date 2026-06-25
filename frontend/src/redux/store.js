// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slices/authSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//   },
// });

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminReducer from './slices/adminSlice';
import dashboardReducer from './slices/dashboardSlice';
import workspaceReducer from './slices/workspaceSlice';
import chatReducer from './slices/chatSlice';

import storageModule from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';

const storage = storageModule.default || storageModule;

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const persistedReducer = persistReducer(
  persistConfig,
  authReducer
);

export const store = configureStore({
  reducer: {
    auth: persistedReducer,
    admin: adminReducer,
    dashboard: dashboardReducer,
    workspace: workspaceReducer,
    chat: chatReducer,
  },
   middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
