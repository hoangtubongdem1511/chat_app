import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // Lazy connection — Prisma connects on first query, same as the Next.js singleton pattern.
    // Calling $connect() eagerly can fail during startup if DNS/network is not yet ready.
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
