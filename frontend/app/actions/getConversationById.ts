import { serverGet } from '@/app/lib/server-api-client';
import { FullConversationType } from '@/app/types';

const getConversationById = async (conversationId: string): Promise<FullConversationType | null> => {
    try {
        const conversation = await serverGet<FullConversationType>(`/conversations/${conversationId}`);
        return conversation ?? null;
    } catch {
        return null;
    }
};

export default getConversationById;
