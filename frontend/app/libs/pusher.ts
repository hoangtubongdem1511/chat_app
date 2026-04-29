import PusherClient from "pusher-js";

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
    channelAuthorization: {
        endpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/pusher/auth`,
        transport: 'ajax',
        headers: {},
        customHandler: async ({ socketId, channelName }, callback) => {
            const token = getAuthToken();
            if (!token) {
                callback(new Error('No auth token'), null);
                return;
            }
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/pusher/auth`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
                    }
                );
                const data = await res.json();
                callback(null, data);
            } catch (err: any) {
                callback(err, null);
            }
        },
    },
    cluster: 'ap1',
});
