import { serverGet } from '@/app/lib/server-api-client';
import { User } from '@prisma/client';

const getCurrentUser = async (): Promise<User | null> => {
    try {
        const user = await serverGet<User>('/auth/me');
        return user ?? null;
    } catch {
        return null;
    }
};

export default getCurrentUser;
