import { serverGet } from '@/app/lib/server-api-client';
import { User } from '@prisma/client';

const getUsers = async (): Promise<User[]> => {
    try {
        const users = await serverGet<User[]>('/users');
        return users ?? [];
    } catch {
        return [];
    }
};

export default getUsers;
