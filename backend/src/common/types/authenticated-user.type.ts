export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  conversationIds: string[];
  seenMessageIds: string[];
}
