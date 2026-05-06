'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import getSocket from '../libs/socket';

const TYPING_DEBOUNCE_MS = 800;
const TYPING_EXPIRE_MS = 3000;

interface UseTypingReturn {
  typingUserIds: string[];
  startTyping: () => void;
  stopTyping: () => void;
}

export function useTyping(conversationId: string): UseTypingReturn {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const isTypingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      getSocket().emit('typing:stop', { conversationId });
    }
  }, [conversationId]);

  const startTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getSocket().emit('typing:start', { conversationId });
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_DEBOUNCE_MS);
  }, [conversationId, stopTyping]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();

    const onStart = ({ userId }: { userId: string; conversationId: string }) => {
      setTypingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));

      const existing = expireTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      expireTimers.current.set(
        userId,
        setTimeout(() => {
          setTypingUserIds((prev) => prev.filter((id) => id !== userId));
          expireTimers.current.delete(userId);
        }, TYPING_EXPIRE_MS),
      );
    };

    const onStop = ({ userId }: { userId: string; conversationId: string }) => {
      const existing = expireTimers.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        expireTimers.current.delete(userId);
      }
      setTypingUserIds((prev) => prev.filter((id) => id !== userId));
    };

    socket.on('typing:start', onStart);
    socket.on('typing:stop', onStop);

    return () => {
      // If we still have an outstanding "I'm typing" broadcast, tell peers we
      // stopped before tearing down. Otherwise they'd see the indicator
      // stuck for ~3s until the receiver-side safety expiry kicks in.
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit('typing:stop', { conversationId });
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      socket.off('typing:start', onStart);
      socket.off('typing:stop', onStop);
      expireTimers.current.forEach(clearTimeout);
      expireTimers.current.clear();
    };
  }, [conversationId]);

  return { typingUserIds, startTyping, stopTyping };
}
