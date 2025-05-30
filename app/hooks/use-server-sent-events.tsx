import { useEffect, useState } from "react";
import { useAuth } from "~/contexts/auth-context";
import { buildUrl } from "~/lib/urls";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

const eventSourceMap = new Map<string, EventSource>();
const listeners = new Map<string, Set<(event: MessageEvent) => void>>();

interface Props {
  key: string;
  models: string[];
  operations?: ("create" | "update" | "delete")[];
  onEvent: (event: MessageEvent) => void;
}

export const useServerSentEvents = ({
  key,
  models,
  operations,
  onEvent,
}: Props) => {
  const { apiUrl } = useAuth();
  const { fetchOrThrow } = useAuthenticatedFetch();
  const [token, setToken] = useState<string | null>(null);

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

  useEffect(() => {
    if (!token) {
      return;
    }

    if (eventSourceMap.has(key)) {
      listeners.get(key)?.add(onEvent);
    } else {
      const url = buildUrl("/events/db/listen", apiUrl, {
        token,
        models,
        operations,
      });
      const eventSource = new EventSource(url.toString());
      eventSourceMap.set(key, eventSource);

      listeners.set(key, new Set([onEvent]));

      eventSource.onmessage = (event) => {
        listeners.get(key)?.forEach((listener) => listener(event));
      };
    }

    return () => {
      const listenersForKey = listeners.get(key);
      if (listenersForKey) {
        if (listenersForKey.size <= 1) {
          eventSourceMap.get(key)?.close();
          eventSourceMap.delete(key);
          listeners.delete(key);
          return;
        } else {
          listenersForKey.delete(onEvent);
        }
      }
    };
  }, [token, models, operations]);
};
