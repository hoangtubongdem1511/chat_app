'use client';
import { FullConversationType } from "@/app/types";
import { useEffect, useState } from "react";
import useConversation from "@/app/hooks/useConversation";
import clsx from "clsx";

import { MdOutlineGroupAdd } from "react-icons/md";
import ConversationBox from "./ConversationBox";
import GroupChatModal from "./GroupChatModal";
import { User } from "@prisma/client";
import getSocket from "@/app/libs/socket";
import { find } from "lodash";
import { useRouter } from "next/navigation";

interface ConversationListProps {
    initialItems: FullConversationType[];
    users: User[];
}

const ConversationList: React.FC<ConversationListProps> = ({
    initialItems,
    users
}) => {
    const [items, setItems] = useState(initialItems);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const { conversationId, isOpen } = useConversation();

    useEffect(() => {
        const socket = getSocket();

        const newHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                if (find(current, { id: conversation.id })) {
                    return current;
                }
                return [conversation, ...current];
            });
        };

        const updateHandler = (conversation: FullConversationType) => {
            setItems((current) => current.map((currentConversation) => {
                if (currentConversation.id === conversation.id) {
                    return { ...currentConversation, messages: conversation.messages };
                }
                return currentConversation;
            }));
        };

        const removeHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                return [...current.filter((convo) => convo.id !== conversation.id)];
            });

            if (conversationId === conversation.id) {
                router.push('/conversations');
            }
        };

        socket.on('conversation:new', newHandler);
        socket.on('conversation:update', updateHandler);
        socket.on('conversation:remove', removeHandler);

        return () => {
            socket.off('conversation:new', newHandler);
            socket.off('conversation:update', updateHandler);
            socket.off('conversation:remove', removeHandler);
        };
    }, [conversationId, router]);
    return (
        <>
            <GroupChatModal
                users={users}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <aside className={clsx("fixed inset-y-0 pb-20 lg:pb-0 lg:left-20 lg:w-80 lg:block overflow-y-auto border-r border-gray-200", isOpen ? "hidden" : "block w-full left-0")}>
                <div className="px-5">
                    <div className="flex justify-between mb-4 pt-4">
                        <div className="text-2xl font-bold text-neutral-800">
                            Messages
                        </div>
                        <div onClick={() => setIsModalOpen(true)} className="rounded-full p-2 bg-gray-100 text-gray-600 cursor-pointer hover:opacity-75 transition">
                            <MdOutlineGroupAdd size={20} />
                        </div>
                    </div>
                    {items.map((item) => (
                        <ConversationBox key={item.id} data={item} selected={conversationId === item.id} />
                    ))}
                </div>
            </aside>
        </>
    )
}

export default ConversationList;