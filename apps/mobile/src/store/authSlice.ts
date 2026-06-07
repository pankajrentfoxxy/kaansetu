import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN' | null;
  isAuthenticated: boolean;
  language: string;
}

const initialState: AuthState = {
  userId: null,
  role: null,
  isAuthenticated: false,
  language: 'hi',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ userId: string; role: string }>) {
      state.userId = action.payload.userId;
      state.role = action.payload.role as AuthState['role'];
      state.isAuthenticated = true;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
    logout(state) {
      state.userId = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setLanguage, logout } = authSlice.actions;
export default authSlice.reducer;
