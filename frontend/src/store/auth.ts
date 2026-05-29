import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('mido_token'),
  user: localStorage.getItem('mido_user') ? JSON.parse(localStorage.getItem('mido_user')!) : null,
  
  setAuth: (token, user) => {
    localStorage.setItem('mido_token', token);
    localStorage.setItem('mido_user', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('mido_token');
    localStorage.removeItem('mido_user');
    set({ token: null, user: null });
  }
}));
