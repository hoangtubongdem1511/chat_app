import { serverGet } from '@/app/lib/server-api-client';
import { FullConversationType } from '@/app/types';

const getConversations = async (): Promise<FullConversationType[]> => {
    try {
        const conversations = await serverGet<FullConversationType[]>('/conversations');
        return conversations ?? [];
    } catch {
        return [];
    }
};

export default getConversations;
