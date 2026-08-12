export interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt: Date | null;
  }