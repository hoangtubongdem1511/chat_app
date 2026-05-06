'use client';

import Avatar from "@/app/components/Avatar";
import { FullMessageType } from "@/app/types";
import clsx from "clsx";
import { useJwtAuth } from "@/app/context/JwtAuthContext";
import { format } from "date-fns";
import Image from "next/image";
import { useState } from "react";
import ImageModal from "./ImageModal";
import { HiArrowPath, HiMiniClock } from "react-icons/hi2";
import apiClient from "@/app/lib/api-client";
import useMessagesStore from "@/app/hooks/useMessagesStore";

interface MessageBoxProps {
    data: FullMessageType;
    isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({
    data, 
    isLast
}) => {
    const { user } = useJwtAuth();
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const isOwn = user?.email === data?.sender?.email;
    const { markFailed, clearFailed, applyServer } = useMessagesStore();

    const seenList = (data.seen || [])
        .filter((user) => user.email !== data?.sender?.email)
        .map((user) => user.name)
        .join(", ");

    const container = clsx(
        "flex gap-3 p-4",
        isOwn && "justify-end"
    )

    const avatar = clsx(isOwn && "order-2");
    const body = clsx("flex flex-col gap-2", isOwn && "items-end");
    const message = clsx(
        "text-sm w-fit overflow-hidden",
        isOwn ? "bg-sky-500 text-white" : "bg-gray-100",
        data.image ? "rounded-md p-0" : "rounded-full py-2 px-3",
        data.pending && "opacity-60",
        data.failed && "ring-2 ring-red-500"
    );

    const retry = async () => {
        if (!isOwn) return;
        const clientId = data.clientId ?? data.id;
        clearFailed(data.conversationId, clientId);
        try {
            const res = await apiClient.post("/messages", {
                conversationId: data.conversationId,
                message: data.body,
                image: data.image,
                clientId,
            });
            applyServer(data.conversationId, res.data, clientId);
        } catch {
            markFailed(data.conversationId, clientId);
        }
    };

    return (
        <div className={container}>
            <div className={avatar}>
                <Avatar user={data.sender} />
            </div>
            <div className={body}>
                <div className="flex items-center gap-1">
                    <div className="text-sm text-gray-500">
                        {data.sender.name}
                    </div>
                    <div className="text-xs text-gray-400">
                        {format(new Date(data.createdAt), "p")}
                    </div>
                    {isOwn && data.pending && (
                        <HiMiniClock className="text-gray-300" size={14} />
                    )}
                </div>
                <div className={message}>
                    <ImageModal
                        src={data.image}
                        isOpen={imageModalOpen}
                        onClose={() => setImageModalOpen(false)}
                    />
                    {data.image ? (
                        <Image
                            onClick={() => setImageModalOpen(true)}
                            src={data.image} 
                            alt="Image" 
                            width={288} 
                            height={288} 
                            className="object-cover cursor-pointer hover:scale-110 transition translate"
                        />
                    ) : (
                        <div>{data.body}</div>
                    )}
                </div>
                {isOwn && data.failed && (
                    <button
                        type="button"
                        onClick={retry}
                        className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                        <HiArrowPath size={14} />
                        Retry
                    </button>
                )}
                {isLast && isOwn && seenList.length > 0 && (
                    <div className="text-xs font-light text-gray-500">
                        {`Seen by ${seenList}`}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MessageBox;