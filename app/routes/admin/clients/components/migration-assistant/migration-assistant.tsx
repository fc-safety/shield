import { AnimatePresence, motion } from "framer-motion";
import { produce } from "immer";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import GradientScrollArea from "~/components/gradient-scroll-area";
import { useWebsocket } from "~/hooks/use-websocket";
import ChatBlock from "./components/chat-block";
import type { WsChatBlock } from "./types/ws-chat";

interface ChatBlocksState {
  status:
    | "idle"
    | "processing"
    | "completed"
    | "error"
    | "waiting-for-response";
  chatBlocks: WsChatBlock[];
}

interface ChatBlocksActions {
  addChatBlock: (chatBlock: Omit<WsChatBlock, "id" | "status">) => void;
  deactivateChatBlock: (id: number) => void;
  deactivateAllChatBlocks: () => void;
  setStatus: (status: ChatBlocksState["status"]) => void;
  reset: () => void;
}

const initialState: ChatBlocksState = {
  status: "idle",
  chatBlocks: [],
};

const useChatBlocks = create<ChatBlocksState & ChatBlocksActions>(
  (set, get) => {
    let blockId = 0;
    return {
      ...initialState,
      addChatBlock: (chatBlock: Omit<WsChatBlock, "id" | "status">) => {
        set(
          produce((state: ChatBlocksState) => {
            if (chatBlock.type === "prompt") {
              state.status = "waiting-for-response";
            } else if (chatBlock.type === "alert") {
              state.status = "processing";
            }
            state.chatBlocks.push({
              ...chatBlock,
              id: blockId++,
              status: chatBlock.type === "prompt" ? "active" : "inactive",
            });
          })
        );
      },
      deactivateChatBlock: (id: number) => {
        set(
          produce((state: ChatBlocksState) => {
            state.chatBlocks = state.chatBlocks.map((chatBlock) =>
              chatBlock.id === id
                ? { ...chatBlock, status: "inactive" }
                : chatBlock
            );
          })
        );
      },
      deactivateAllChatBlocks: () => {
        set(
          produce((state: ChatBlocksState) => {
            state.chatBlocks = state.chatBlocks.map((chatBlock) => ({
              ...chatBlock,
              status: "inactive",
            }));
          })
        );
      },
      setStatus: (status: ChatBlocksState["status"]) => {
        set(
          produce((state: ChatBlocksState) => {
            state.status = status;
          })
        );
      },
      reset: () => {
        set(initialState);
      },
    };
  }
);

export default function MigrationAssistant({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const {
    status,
    setStatus,
    chatBlocks,
    addChatBlock,
    deactivateChatBlock,
    deactivateAllChatBlocks,
    reset,
  } = useChatBlocks();

  const { sendMessage, isOpen: webSocketIsOpen } = useWebsocket({
    connectionPath: "/legacy-migration",
    tokenPath: "/legacy-migration/ws-token",
    onMessage: (type, data, socket) => {
      if (type === "alert") {
        addChatBlock({
          type: "alert",
          direction: "incoming",
          message: data.message,
          alertType: data.type,
        });
      } else if (type === "prompt") {
        addChatBlock({
          type: "prompt",
          direction: "incoming",
          message: data.message,
        });
        addChatBlock({
          type: "prompt",
          direction: "outgoing",
          promptType: data.type,
          promptOptions: data.options,
          promptValue: data.value,
        });
      } else if (type === "prompt-validation-error") {
        addChatBlock({
          type: "prompt",
          direction: "incoming",
          message: "Uh oh, something doesn't look right. Please try again.",
        });
        addChatBlock({
          type: "prompt",
          direction: "outgoing",
          promptType: data.original.type,
          promptOptions: data.original.options,
        });
      }

      if (data.signal === "close") {
        socket.close();
        onComplete?.();
      }
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  const migrationInitialized = useRef(false);

  useEffect(() => {
    setStatus("processing");
  }, []);

  useEffect(() => {
    if (!migrationInitialized.current && webSocketIsOpen) {
      migrationInitialized.current = true;
      setStatus("processing");
      sendMessage("process-migration", null);
    }
  }, [sendMessage, webSocketIsOpen]);

  const prevWebSocketIsOpen = useRef(webSocketIsOpen);
  useEffect(() => {
    if (prevWebSocketIsOpen.current && !webSocketIsOpen) {
      addChatBlock({
        type: "system_note",
        message: "Session ended.",
        direction: "incoming",
      });
      deactivateAllChatBlocks();
      setStatus("completed");
    }
    prevWebSocketIsOpen.current = webSocketIsOpen;
  }, [webSocketIsOpen]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [chatBlocks]);

  return (
    <GradientScrollArea className="h-full w-full border-t border-border mt-2">
      <div className="flex flex-col gap-y-4 py-4 w-full px-3">
        {chatBlocks.map((chatBlock) => (
          <AnimatePresence key={chatBlock.id}>
            <MotionChatBlock
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              chatBlock={chatBlock}
              onEmitValue={(value) => {
                if (chatBlock.type === "prompt") {
                  sendMessage("prompt-response", { value });
                  deactivateChatBlock(chatBlock.id);
                }
              }}
            />
          </AnimatePresence>
        ))}
        {status === "processing" && <Loader2 className="animate-spin size-4" />}
        <div ref={bottomRef} />
        <div className="h-36" />
      </div>
    </GradientScrollArea>
  );
}

const MotionChatBlock = motion.create(ChatBlock);
