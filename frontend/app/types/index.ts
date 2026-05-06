import { Conversation, Message, User } from "@prisma/client";

export type FullMessageType = Message & {
    sender: User;
    seen: User[];
    clientId?: string;
    pending?: boolean;
    failed?: boolean;
}

export type FullConversationType = Conversation & {
    users: User[];
    messages: FullMessageType[];
}