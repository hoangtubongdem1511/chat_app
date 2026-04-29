'use client';

import useConversation from "@/app/hooks/useConversation";
import { FullMessageType } from "@/app/types";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./MessageBox";
import apiClient from "@/app/lib/api-client";
import { pusherClient } from "@/app/libs/pusher";
import { find } from "lodash";

interface BodyProps {
    initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ 
    initialMessages 
}) => {
    const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { conversationId } = useConversation();
    
    useEffect(() => {
        apiClient.post(`/conversations/${conversationId}/seen`);
    }, [conversationId]);


    useEffect(() => {
        pusherClient.subscribe(conversationId);
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
        }

        const updateMessageHandler = (newMessage: FullMessageType) => {
            setMessages((current) => current.map((currentMessage) => {
                if (currentMessage.id === newMessage.id) {
                    return newMessage;
                }
                return currentMessage;
            }));
        }
        

        pusherClient.bind('messages:new', messageHandler);
        pusherClient.bind('message:update', updateMessageHandler);

        return () => {
            pusherClient.unsubscribe(conversationId);
            pusherClient.unbind('messages:new', messageHandler);
            pusherClient.unbind('message:update', updateMessageHandler);
        }
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
            <div ref={bottomRef} className="pt-8" />
        </div>
    )
}

export default Body;