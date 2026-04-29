import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(currentUserEmail: string) {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        NOT: { email: currentUserEmail },
      },
    });
  }

  async updateSettings(userId: string, name?: string, image?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name, image },
    });
  }
}
