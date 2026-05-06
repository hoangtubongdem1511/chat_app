'use client';

import useConversation from "@/app/hooks/useConversation";
import { FullMessageType } from "@/app/types";
import { useEffect, useMemo, useRef } from "react";
import MessageBox from "./MessageBox";
import apiClient from "@/app/lib/api-client";
import getSocket from "@/app/libs/socket";
import { useTyping } from "@/app/hooks/useTyping";
import useMessagesStore from "@/app/hooks/useMessagesStore";
import { useJwtAuth } from "@/app/context/JwtAuthContext";

interface BodyProps {
    initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ 
    initialMessages 
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { conversationId } = useConversation();
    const { typingUserIds } = useTyping(conversationId);
    const { user } = useJwtAuth();
    const { byConversationId, setInitial, applyServer } = useMessagesStore();

    const messages = useMemo(() => {
        return byConversationId[conversationId] ?? initialMessages;
    }, [byConversationId, conversationId, initialMessages]);

    useEffect(() => {
        if (!conversationId) return;
        setInitial(conversationId, initialMessages);
    }, [conversationId, initialMessages, setInitial]);
    
    useEffect(() => {
        apiClient.post(`/conversations/${conversationId}/seen`);
    }, [conversationId]);


    useEffect(() => {
        const socket = getSocket();
        socket.emit('conversation:join', { conversationId });
        bottomRef?.current?.scrollIntoView();

        const messageHandler = (message: FullMessageType) => {
            if (message.senderId !== user?.id) {
                apiClient.post(`/conversations/${conversationId}/seen`);
            }

            applyServer(conversationId, message, message.clientId);

            bottomRef?.current?.scrollIntoView();
        };

        const updateMessageHandler = (newMessage: FullMessageType) => {
            applyServer(conversationId, newMessage, newMessage.clientId);
        };

        socket.on('messages:new', messageHandler);
        socket.on('message:update', updateMessageHandler);

        return () => {
            socket.emit('conversation:leave', { conversationId });
            socket.off('messages:new', messageHandler);
            socket.off('message:update', updateMessageHandler);
        };
    }, [conversationId, applyServer, user?.id]);

    return (
        <div className="flex-1 overflow-y-auto">
            {messages.map((message, i) => (
                <MessageBox
                    isLast={i === messages.length - 1}
                    key={message.id}
                    data={message}
                />
            ))}
            {typingUserIds.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-xs text-gray-500">
                        {typingUserIds.length === 1 ? 'Someone is typing…' : 'Several people are typing…'}
                    </span>
                </div>
            )}
            <div ref={bottomRef} className="pt-8" />
        </div>
    )
}

export default Body;