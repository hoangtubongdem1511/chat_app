import { create } from 'zustand';
import { FullMessageType } from '../types';

type ConversationId = string;
type ClientId = string;

function getClientId(m: FullMessageType): string | undefined {
  return m.clientId;
}

function setFlags(
  message: FullMessageType,
  flags: Partial<Pick<FullMessageType, 'pending' | 'failed'>>,
): FullMessageType {
  return { ...message, ...flags };
}

interface MessagesState {
  byConversationId: Record<ConversationId, FullMessageType[]>;
  setInitial: (conversationId: ConversationId, messages: FullMessageType[]) => void;
  addOptimistic: (conversationId: ConversationId, message: FullMessageType) => void;
  applyServer: (
    conversationId: ConversationId,
    message: FullMessageType,
    clientId?: ClientId,
  ) => void;
  markFailed: (conversationId: ConversationId, clientId: ClientId) => void;
  clearFailed: (conversationId: ConversationId, clientId: ClientId) => void;
}

const useMessagesStore = create<MessagesState>((set) => ({
  byConversationId: {},

  setInitial: (conversationId, messages) => {
    set((state) => {
      // Preserve any optimistic messages already inserted for this conversation.
      const existing = state.byConversationId[conversationId] ?? [];
      if (existing.length === 0) {
        return {
          byConversationId: { ...state.byConversationId, [conversationId]: messages },
        };
      }

      const existingIds = new Set(existing.map((m) => m.id));
      const existingClientIds = new Set(
        existing.map(getClientId).filter((x): x is string => Boolean(x)),
      );
      const merged = [
        ...existing,
        ...messages.filter((m) => {
          if (existingIds.has(m.id)) return false;
          const cid = getClientId(m);
          if (cid && existingClientIds.has(cid)) return false;
          return true;
        }),
      ];
      return {
        byConversationId: { ...state.byConversationId, [conversationId]: merged },
      };
    });
  },

  addOptimistic: (conversationId, message) => {
    set((state) => ({
      byConversationId: {
        ...state.byConversationId,
        [conversationId]: [...(state.byConversationId[conversationId] ?? []), message],
      },
    }));
  },

  applyServer: (conversationId, message, clientId) => {
    set((state) => {
      const current = state.byConversationId[conversationId] ?? [];
      const dedupeId = clientId ?? getClientId(message);

      if (dedupeId) {
        const idx = current.findIndex((m) => getClientId(m) === dedupeId);
        if (idx !== -1) {
          const next = current.slice();
          next[idx] = setFlags({ ...message, clientId: dedupeId }, { pending: false, failed: false });
          return { byConversationId: { ...state.byConversationId, [conversationId]: next } };
        }
      }

      const byIdIdx = current.findIndex((m) => m.id === message.id);
      if (byIdIdx !== -1) {
        const next = current.slice();
        next[byIdIdx] = setFlags(message, { pending: false, failed: false });
        return { byConversationId: { ...state.byConversationId, [conversationId]: next } };
      }

      return {
        byConversationId: {
          ...state.byConversationId,
          [conversationId]: [...current, setFlags(message, { pending: false, failed: false })],
        },
      };
    });
  },

  markFailed: (conversationId, clientId) => {
    set((state) => {
      const current = state.byConversationId[conversationId] ?? [];
      const idx = current.findIndex((m) => getClientId(m) === clientId);
      if (idx === -1) return state;
      const next = current.slice();
      next[idx] = setFlags(next[idx], { pending: false, failed: true });
      return { byConversationId: { ...state.byConversationId, [conversationId]: next } };
    });
  },

  clearFailed: (conversationId, clientId) => {
    set((state) => {
      const current = state.byConversationId[conversationId] ?? [];
      const idx = current.findIndex((m) => getClientId(m) === clientId);
      if (idx === -1) return state;
      const next = current.slice();
      next[idx] = setFlags(next[idx], { pending: true, failed: false });
      return { byConversationId: { ...state.byConversationId, [conversationId]: next } };
    });
  },
}));

export default useMessagesStore;

