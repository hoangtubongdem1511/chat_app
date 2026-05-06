import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      transports: ['websocket'],
      path: '/socket.io',
      // Function form so the latest token is read on every (re)connect,
      // not just the first connect attempt.
      auth: (cb: (data: object) => void) => {
        const token = readToken();
        cb(token ? { token } : {});
      },
    });
  }
  return socket;
}

export function connectSocket(): void {
  if (typeof window === 'undefined') return;
  if (!readToken()) return;

  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export { getSocket };
export default getSocket;
