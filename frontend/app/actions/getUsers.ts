import { serverGet } from '@/app/lib/server-api-client';
import { User } from '../types/user';

const getUsers = async (): Promise<User[]> => {
    try {
        const users = await serverGet<User[]>('/users');
        return users ?? [];
    } catch {
        return [];
    }
};

export default getUsers;
