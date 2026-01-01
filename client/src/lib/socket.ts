import { io } from "socket.io-client";

// Use environment variable or default to localhost
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const socket = io(URL, {
    autoConnect: false,
    reconnection: true,
});
