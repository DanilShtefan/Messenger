import { configureStore } from '@reduxjs/toolkit';
import { injectStore } from '@/shared/api/axiosInstance';
import { userReducer } from '@/entities/user/user.slice';
import { themeReducer } from './theme.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer,
  },
  devTools: import.meta.env.DEV,
});

injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
