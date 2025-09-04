export interface UserType {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallType {
  id: string;
  roomName: string;
  type: 'VIDEO' | 'VOICE';
  status: 'INCOMING' | 'ONGOING' | 'ENDED' | 'MISSED' | 'REJECTED' | 'CANCELLED';
  duration?: number;
  startedAt: Date;
  endedAt?: Date;
  conversationId: string;
  callerId: string;
  caller: UserType;
  participants: CallParticipantType[];
  conversation?: ConversationType;
}

export interface CallParticipantType {
  id: string;
  userId: string;
  user: UserType;
  callId: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'CALLER' | 'RECEIVER';
}

export interface ConversationType {
  id: string;
  name: string | null;
  isGroup: boolean;
  createdAt: Date;
  lastMessageAt: Date | null;
  users: UserType[];
}

export interface CreateCallRequest {
  conversationId: string;
  type: 'VIDEO' | 'VOICE';
}

export interface AcceptCallRequest {
  callId: string;
}

export interface RejectCallRequest {
  callId: string;
}

export interface EndCallRequest {
  callId: string;
}

export interface LiveKitTokenRequest {
  roomName: string;
}

export interface LiveKitTokenResponse {
  token: string;
}

// Pusher event types
export interface CallIncomingEvent {
  id: string;
  roomName: string;
  type: 'VIDEO' | 'VOICE';
  status: 'INCOMING';
  caller: UserType;
  conversation: ConversationType;
}

export interface CallAcceptedEvent {
  id: string;
  roomName: string;
  type: 'VIDEO' | 'VOICE';
  status: 'ONGOING';
  participants: CallParticipantType[];
}

export interface CallEndedEvent {
  id: string;
  status: 'ENDED' | 'MISSED' | 'REJECTED' | 'CANCELLED';
  duration?: number;
}
