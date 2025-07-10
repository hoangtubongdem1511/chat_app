import { pusherServer } from "@/app/libs/pusher";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        let socket_id = "";
        let channel_name = "";

        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            const body = await request.json();
            socket_id = body.socket_id;
            channel_name = body.channel_name;
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.text();
            const params = new URLSearchParams(formData);
            socket_id = params.get("socket_id") || "";
            channel_name = params.get("channel_name") || "";
        }

        const data = {
            user_id: session.user.email,
        };
        const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, data);

        return NextResponse.json(authResponse);
    } catch (error) {
        console.log(error, "PUSHER_AUTH_ERROR");
        return new NextResponse("Internal Error", { status: 500 });
    }
} 