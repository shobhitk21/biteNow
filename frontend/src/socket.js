import { io } from "socket.io-client";

let socket = null;

// ✅ Function to initialize the socket connection
export const initializeSocket = (userId) => {
    if (!userId) return null;

    if (!socket) {
        socket = io("http://localhost:4000", {
            transports: ["websocket"],
            query: { userId },
        });

        socket.on("connect", () => {
            console.log("✅ Connected to socket server:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("❌ Disconnected from socket server");
        });
    }

    return socket;
};

// ✅ Export the same socket instance for use across files
export { socket };
