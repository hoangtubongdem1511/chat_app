import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        conversationIds: true,
        seenMessageIds: true,
      },
    });

    return this.issueToken(user);
  }

  async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.hashedPassword) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
      return null;
    }

    // Return user without hashedPassword
    const { hashedPassword: _, ...safeUser } = user;
    return safeUser;
  }

  login(user: AuthenticatedUser) {
    return this.issueToken(user);
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    name: string;
    image?: string;
    provider: string;
    providerAccountId: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: new Date(),
          accounts: {
            create: {
              type: 'oauth',
              provider: data.provider,
              providerAccountId: data.providerAccountId,
            },
          },
        },
      });
    } else {
      const existingAccount = await this.prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        },
      });

      if (!existingAccount) {
        await this.prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        });
      }
    }

    return user;
  }

  issueToken(user: Pick<AuthenticatedUser, 'id' | 'email' | 'name' | 'image'>) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    };
  }
}
