import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  background: string;
}

function getInitialState(): SettingsState {
  return {
    theme: (localStorage.getItem('messenger-theme') as Theme) ?? 'light',
    background: localStorage.getItem('messenger-background') ?? 'none',
  };
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: getInitialState(),
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setBackground(state, action: PayloadAction<string>) {
      state.background = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, setBackground } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
