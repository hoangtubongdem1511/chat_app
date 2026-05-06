'use client';

import useConversation from "@/app/hooks/useConversation";
import { FullMessageType } from "@/app/types";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./MessageBox";
import apiClient from "@/app/lib/api-client";
import getSocket from "@/app/libs/socket";
import { find } from "lodash";
import { useTyping } from "@/app/hooks/useTyping";

interface BodyProps {
    initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ 
    initialMessages 
}) => {
    const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { conversationId } = useConversation();
    const { typingUserIds } = useTyping(conversationId);
    
    useEffect(() => {
        apiClient.post(`/conversations/${conversationId}/seen`);
    }, [conversationId]);


    useEffect(() => {
        const socket = getSocket();
        socket.emit('conversation:join', { conversationId });
        bottomRef?.current?.scrollIntoView();

        const messageHandler = (message: FullMessageType) => {
            apiClient.post(`/conversations/${conversationId}/seen`);
            setMessages((current) => {
                if (find(current, { id: message.id })) {
                    return current;
                }
                return [...current, message];
            });

            bottomRef?.current?.scrollIntoView();
        };

        const updateMessageHandler = (newMessage: FullMessageType) => {
            setMessages((current) => current.map((currentMessage) => {
                if (currentMessage.id === newMessage.id) {
                    return newMessage;
                }
                return currentMessage;
            }));
        };

        socket.on('messages:new', messageHandler);
        socket.on('message:update', updateMessageHandler);

        return () => {
            socket.emit('conversation:leave', { conversationId });
            socket.off('messages:new', messageHandler);
            socket.off('message:update', updateMessageHandler);
        };
    }, [conversationId]);

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