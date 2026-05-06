'use client';

import useConversation from "@/app/hooks/useConversation";
import apiClient from "@/app/lib/api-client";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import MessageInput from "./MessageInput";
import { CldUploadButton } from "next-cloudinary";
import { useTyping } from "@/app/hooks/useTyping";
import useMessagesStore from "@/app/hooks/useMessagesStore";
import { useJwtAuth } from "@/app/context/JwtAuthContext";
import { FullMessageType } from "@/app/types";

const Form = () => {
    const { conversationId } = useConversation();
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FieldValues>({
        defaultValues: {
            message: ""
        }
    });
    const { startTyping, stopTyping } = useTyping(conversationId);
    const { user } = useJwtAuth();
    const { addOptimistic, markFailed, applyServer } = useMessagesStore();

    const makeOptimisticMessage = (data: { body?: string; image?: string; clientId: string }): FullMessageType => {
        const now = new Date();
        const sender = (user ?? { id: 'unknown', email: 'unknown', name: null, image: null }) as unknown as FullMessageType['sender'];
        const seen = (user ? [user] : []) as unknown as FullMessageType['seen'];
        return {
            id: data.clientId,
            body: data.body,
            image: data.image,
            conversationId,
            senderId: user?.id ?? 'unknown',
            seenIds: user?.id ? [user.id] : [],
            createdAt: now,
            sender,
            seen,
            clientId: data.clientId,
            pending: true,
            failed: false,
        } as unknown as FullMessageType;
    };

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
        const clientId = crypto.randomUUID();
        const devLabel = process.env.NODE_ENV !== 'production' ? `send->paint:${clientId}` : null;
        if (devLabel) console.time(devLabel);
        stopTyping();
        setValue("message", "", { shouldValidate: true });
        addOptimistic(conversationId, makeOptimisticMessage({ body: data.message, clientId }));
        if (devLabel) {
            requestAnimationFrame(() => console.timeEnd(devLabel));
        }

        apiClient.post("/messages", {
            ...data,
            conversationId: conversationId,
            clientId,
        }).then((res) => {
            applyServer(conversationId, res.data, clientId);
        }).catch(() => {
            markFailed(conversationId, clientId);
        });
    };

    const handleUpload = (result: unknown) => {
        const uploadResult = result as { info?: { secure_url?: string } };
        const image = uploadResult?.info?.secure_url;
        if (!image) return;

        const clientId = crypto.randomUUID();
        const devLabel = process.env.NODE_ENV !== 'production' ? `send->paint:${clientId}` : null;
        if (devLabel) console.time(devLabel);
        addOptimistic(conversationId, makeOptimisticMessage({ image, clientId }));
        if (devLabel) {
            requestAnimationFrame(() => console.timeEnd(devLabel));
        }

        apiClient.post("/messages", {
            image,
            conversationId,
            clientId,
        }).then((res) => {
            applyServer(conversationId, res.data, clientId);
        }).catch(() => {
            markFailed(conversationId, clientId);
        });
    };

    return (
        <div className="py-4 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 w-full">
            <CldUploadButton options={{ maxFiles: 1 }} onSuccess={handleUpload} uploadPreset="chat-app">
                <HiPhoto size={30} className="text-sky-500" />
            </CldUploadButton>
            <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 lg:gap-4 w-full">
                <MessageInput
                    id="message"
                    register={register}
                    errors={errors}
                    required
                    placeholder="Write a message"
                    onTyping={startTyping}
                    onBlur={stopTyping}
                />
                <button type="submit" className="rounded-full p-2 bg-sky-500 cursor-pointer hover:bg-sky-600 transition">
                    <HiPaperAirplane size={18} className="text-white" />
                </button>
            </form>
        </div>
    );
};

export default Form;