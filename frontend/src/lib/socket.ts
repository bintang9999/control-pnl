import { io } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

const URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;

export const socket = io(URL, {
  autoConnect: false, // We connect manually when auth is ready
  auth: (cb) => {
    const token = useAuthStore.getState().token;
    cb({ token });
  }
});
