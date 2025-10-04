import { useEffect, useMemo, useRef, useState } from "react";
import { useBeforeUnload } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { buildUrl } from "~/lib/urls";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

const eventSourceMap = new Map<string, { eventSource: EventSource; url: string }>();
const listenerRefs = new Map<string, Set<{ current: (event: MessageEvent) => void }>>();

interface Props {
  key: string;
  models: string[];
  operations?: ("create" | "update" | "delete")[];
  onEvent: (event: MessageEvent) => void;
}

export const useServerSentEvents = ({ key, models, operations, onEvent }: Props) => {
  const { apiUrl } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const [token, setToken] = useState<string | null>(null);
  const onEventRef = useRef<(event: MessageEvent) => void>(onEvent);
  const tokenRefreshAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Keep the ref up to date with the latest callback
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (token) {
      return;
    }

    fetchOrThrow("/events/token")
      .then((res) => res.json())
      .then((data) => {
        setToken(data.token);
      });
  }, [fetchOrThrow, token]);

  const refreshToken = () => {
    if (tokenRefreshAttempts.current >= 10) {
      console.error("Reconnection limit exceeded");
      return;
    }
    tokenRefreshAttempts.current++;
    setToken(null);
  };

  const url = useMemo(
    () =>
      token &&
      buildUrl("/events/db/listen", apiUrl, {
        token,
        models,
        operations,
      }).toString(),
    [apiUrl, models, operations, token]
  );

  useEffect(() => {
    if (!url) {
      return;
    }

    const existingConnection = eventSourceMap.get(key);

    // If URL changed, close existing connection and recreate
    if (existingConnection && existingConnection.url !== url) {
      existingConnection.eventSource.close();
      eventSourceMap.delete(key);
      listenerRefs.delete(key);
    }

    if (eventSourceMap.has(key)) {
      // Add this listener to existing EventSource
      listenerRefs.get(key)?.add(onEventRef);
    } else {
      // Create new EventSource
      const eventSource = new EventSource(url);
      eventSourceMap.set(key, { eventSource, url });

      const newListenerSet = new Set([onEventRef]);
      listenerRefs.set(key, newListenerSet);

      eventSource.onmessage = (event) => {
        listenerRefs.get(key)?.forEach((listenerRef) => {
          listenerRef.current(event);
        });
      };

      eventSource.onerror = (event) => {
        const readyState = eventSource.readyState;
        console.error("Event source error", { event, readyState, key });

        // EventSource will auto-reconnect if in CONNECTING state
        // If CLOSED, we need to refresh the token and recreate
        if (readyState === EventSource.CLOSED) {
          eventSourceMap.delete(key);
          listenerRefs.delete(key);

          // Debounce token refresh to avoid rapid retries
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            refreshToken();
          }, 3000);
        }
      };

      eventSource.onopen = () => {
        console.debug("Event source connected", { key });
        tokenRefreshAttempts.current = 0;
      };
    }

    return () => {
      const listenersForKey = listenerRefs.get(key);
      if (listenersForKey) {
        listenersForKey.delete(onEventRef);

        // If no more listeners, close the EventSource
        if (listenersForKey.size === 0) {
          const connection = eventSourceMap.get(key);
          if (connection) {
            connection.eventSource.close();
            console.debug("Closed event source (no listeners)", { key });
          }
          eventSourceMap.delete(key);
          listenerRefs.delete(key);
        }
      }

      // Clean up reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url, key]);

  useBeforeUnload(() => {
    eventSourceMap.forEach((connection, key) => {
      connection.eventSource.close();
      console.debug("closed event source", {
        key,
        closed: connection.eventSource.readyState === EventSource.CLOSED,
      });
    });
    eventSourceMap.clear();
    listenerRefs.clear();
  });
};
