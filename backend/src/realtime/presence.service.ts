import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  /** userId -> Set of socketIds currently connected */
  private readonly sockets = new Map<string, Set<string>>();

  add(userId: string, socketId: string): void {
    if (!this.sockets.has(userId)) {
      this.sockets.set(userId, new Set());
    }
    this.sockets.get(userId)!.add(socketId);
  }

  remove(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size === 0) {
      this.sockets.delete(userId);
      return true; // last socket gone – user is now offline
    }
    return false;
  }

  list(): string[] {
    return Array.from(this.sockets.keys());
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }
}
