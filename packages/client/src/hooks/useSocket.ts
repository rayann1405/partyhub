import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "";

let globalSocket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const tokens = localStorage.getItem("tokens");
    if (!tokens) return;

    const { access } = JSON.parse(tokens);

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(SOCKET_URL, {
        auth: { token: access },
        transports: ["websocket", "polling"],
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect global socket on unmount
    };
  }, []);

  return socketRef.current;
}

export function useEventRoom(eventId: string | undefined) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("event:join", eventId);
    return () => {
      socket.emit("event:leave", eventId);
    };
  }, [socket, eventId]);

  return socket;
}
