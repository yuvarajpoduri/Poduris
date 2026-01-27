import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
                   (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 
                   window.location.origin);

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});
