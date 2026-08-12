// frontend/app/types/index.ts
export interface User {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt: Date | null;
  }
  
  export interface Message {
    id: string;
    body: string | null;
    image: string | null;
    createdAt: Date;
    seenIds: string[];
    conversationId: string;
    senderId: string;
    sender: User;
    seen: User[];
  }
  
  export interface Conversation {
    id: string;
    name: string | null;
    isGroup: boolean;
    createdAt: Date;
    lastMessageAt: Date | null;
    userIds: string[];
    messages: Message[];
    users: User[];
  }
  
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