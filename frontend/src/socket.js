import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const SOCKET_URL = base.replace(/\/api$/, '');
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
        });
    }
    return socket;
};
