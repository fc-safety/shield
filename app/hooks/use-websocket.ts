import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "~/contexts/auth-context";
import { buildUrl } from "~/lib/urls";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

interface Props {
  connectionPath: string;
  tokenPath: string;
  onMessage: (type: string, data: any, socket: WebSocket) => void;
  onOpen?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
}

export const useWebsocket = ({ connectionPath, tokenPath, onMessage, onOpen, onClose }: Props) => {
  const { apiUrl } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const [token, setToken] = useState<string | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (token) {
      return;
    }

    fetchOrThrow(tokenPath)
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
      });
  }, [fetchOrThrow, token, tokenPath]);

  const connectionUrl = useMemo(() => {
    if (!token) {
      return null;
    }

    const wsUrl = apiUrl.replace(/^http/, "ws");
    return buildUrl(connectionPath, wsUrl, { token }).toString();
  }, [apiUrl, connectionPath, token]);

  useEffect(() => {
    if (!connectionUrl) {
      return;
    }

    const socket = new WebSocket(connectionUrl);
    setSocket(socket);

    socket.onmessage = (event) => {
      const { event: type, data } = JSON.parse(event.data);
      onMessage(type, data, socket);
    };

    socket.onopen = (event) => {
      console.log("WebSocket opened");
      setIsOpen(true);
      onOpen?.(event);
    };

    socket.onclose = (event) => {
      console.log("WebSocket closed");
      setIsOpen(false);
      onClose?.(event);
    };

    return () => {
      socket.close();
    };
  }, [connectionUrl]);

  const sendMessage = useCallback(
    (type: string, data: any) => {
      if (!socket) {
        console.warn("WebSocket is not available");
        return;
      }

      if (socket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket is not open");
        return;
      }

      socket.send(JSON.stringify({ event: type, data }));
    },
    [socket]
  );

  return { socket, sendMessage, isOpen };
};
