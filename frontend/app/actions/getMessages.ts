import { serverGet } from '@/app/lib/server-api-client';
import { FullMessageType } from '@/app/types';

const getMessages = async (conversationId: string): Promise<FullMessageType[]> => {
    try {
        const messages = await serverGet<FullMessageType[]>(`/messages?conversationId=${conversationId}`);
        return messages ?? [];
    } catch {
        return [];
    }
};

export default getMessages;
