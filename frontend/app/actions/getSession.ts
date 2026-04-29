import { cookies } from 'next/headers';

export default async function getSession() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        if (!token) return null;
        return { token };
    } catch {
        return null;
    }
}
