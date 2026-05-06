/**
 * E2E test for the Pusher -> Socket.io migration.
 *
 * Boots a real NestJS app (RealtimeGateway + RealtimeService + PresenceService)
 * with a mocked PrismaService, then opens real socket.io-client connections
 * over the loopback to verify the full WS contract introduced by the migration:
 *
 *   - JWT handshake auth (accept / reject)
 *   - Per-user room (`user:<id>`) auto-join on connect
 *   - presence:list to the new socket, presence:online/offline broadcasts
 *   - conversation:join / conversation:leave with membership check
 *   - typing:start / typing:stop fan-out, sender excluded
 *   - emitToUser / emitToConversation fan-out via RealtimeService
 *
 * No external services (Mongo, LiveKit, Cloudinary) are required.
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';

import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { RealtimeService } from '../src/realtime/realtime.service';
import { PresenceService } from '../src/realtime/presence.service';
import { PrismaService } from '../src/prisma/prisma.service';

const JWT_SECRET = 'test-secret-do-not-use-in-prod';

const USER_A = 'user-a-id';
const USER_B = 'user-b-id';
const USER_C = 'user-c-id'; // not a member of the conversation
const CONVO_ID = 'convo-shared';

// Prisma stub: only the fields the gateway actually reads.
const prismaMock = {
  conversation: {
    findUnique: jest.fn(({ where: { id } }: { where: { id: string } }) => {
      if (id === CONVO_ID) {
        return Promise.resolve({
          id: CONVO_ID,
          userIds: [USER_A, USER_B],
        });
      }
      return Promise.resolve(null);
    }),
  },
};

function waitFor<T = unknown>(socket: ClientSocket, event: string, timeoutMs = 2000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      timeoutMs,
    );
    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function neverFires(socket: ClientSocket, event: string, windowMs = 200): Promise<void> {
  return new Promise((resolve, reject) => {
    const handler = (payload: unknown) => {
      reject(new Error(`Unexpected "${event}" received: ${JSON.stringify(payload)}`));
    };
    socket.once(event, handler);
    setTimeout(() => {
      socket.off(event, handler);
      resolve();
    }, windowMs);
  });
}

function connect(port: number, token: string | null): ClientSocket {
  return ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    path: '/socket.io',
    auth: token ? { token } : {},
    forceNew: true,
    reconnection: false,
  });
}

describe('RealtimeGateway (e2e)', () => {
  let app: INestApplication;
  let port: number;
  let jwt: JwtService;
  let realtime: RealtimeService;

  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        JwtModule.register({ secret: JWT_SECRET }),
      ],
      providers: [
        RealtimeGateway,
        RealtimeService,
        PresenceService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0); // ephemeral port
    port = (app.getHttpServer().address() as AddressInfo).port;

    jwt = moduleRef.get(JwtService);
    realtime = moduleRef.get(RealtimeService);

    tokenA = jwt.sign({ sub: USER_A, email: 'a@test.local' });
    tokenB = jwt.sign({ sub: USER_B, email: 'b@test.local' });
    tokenC = jwt.sign({ sub: USER_C, email: 'c@test.local' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    prismaMock.conversation.findUnique.mockClear();
  });

  // ---------------------------------------------------------------- handshake

  describe('JWT handshake auth', () => {
    it('rejects connection with no token', async () => {
      const socket = connect(port, null);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('no disconnect within 2s')), 2000);
        socket.on('disconnect', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      expect(socket.connected).toBe(false);
      socket.close();
    });

    it('rejects connection with an invalid token', async () => {
      const socket = connect(port, 'not-a-real-jwt');
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('no disconnect within 2s')), 2000);
        socket.on('disconnect', () => {
          clearTimeout(timer);
          resolve();
        });
      });
      expect(socket.connected).toBe(false);
      socket.close();
    });

    it('accepts a valid token and sends presence:list', async () => {
      const socket = connect(port, tokenA);
      const list = await waitFor<{ userIds: string[] }>(socket, 'presence:list');
      expect(list.userIds).toContain(USER_A);
      socket.close();
      await new Promise((r) => setTimeout(r, 50)); // let disconnect settle
    });
  });

  // ----------------------------------------------------------------- presence

  describe('presence', () => {
    it('broadcasts presence:online when a new user connects, and presence:offline when last socket leaves', async () => {
      const a = connect(port, tokenA);
      await waitFor(a, 'presence:list');

      // Now B comes online — A should be told.
      const onlineEvent = waitFor<{ userId: string }>(a, 'presence:online');
      const b = connect(port, tokenB);
      await waitFor(b, 'presence:list');
      expect((await onlineEvent).userId).toBe(USER_B);

      // B disconnects — A should see presence:offline for B.
      const offlineEvent = waitFor<{ userId: string }>(a, 'presence:offline');
      b.close();
      expect((await offlineEvent).userId).toBe(USER_B);

      a.close();
      await new Promise((r) => setTimeout(r, 50));
    });

    it('does NOT emit presence:online twice when the same user opens a second tab', async () => {
      const observer = connect(port, tokenA);
      await waitFor(observer, 'presence:list');

      const tab1 = connect(port, tokenB);
      const firstOnline = await waitFor<{ userId: string }>(observer, 'presence:online');
      expect(firstOnline.userId).toBe(USER_B);

      // Second tab for B should NOT trigger another presence:online for B.
      const secondTab = connect(port, tokenB);
      await waitFor(secondTab, 'presence:list');
      await neverFires(observer, 'presence:online', 250);

      // First tab closes — still online via second tab — so NO offline either.
      tab1.close();
      await neverFires(observer, 'presence:offline', 250);

      // Second tab closes — now we should see presence:offline.
      const offline = waitFor<{ userId: string }>(observer, 'presence:offline');
      secondTab.close();
      expect((await offline).userId).toBe(USER_B);

      observer.close();
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  // ---------------------------------------------------------- per-user rooms

  describe('per-user rooms (emitToUser)', () => {
    it('only delivers to sockets belonging to the targeted user', async () => {
      const a = connect(port, tokenA);
      const b = connect(port, tokenB);
      await Promise.all([waitFor(a, 'presence:list'), waitFor(b, 'presence:list')]);

      const aGotIt = waitFor<{ hello: string }>(a, 'conversation:new');
      const bShouldNotGet = neverFires(b, 'conversation:new', 250);

      realtime.emitToUser(USER_A, 'conversation:new', { hello: 'world' });

      const payload = await aGotIt;
      expect(payload).toEqual({ hello: 'world' });
      await bShouldNotGet;

      a.close();
      b.close();
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  // -------------------------------------------------------- conversation room

  describe('conversation rooms', () => {
    it('rejects join when user is not a member', async () => {
      const c = connect(port, tokenC);
      await waitFor(c, 'presence:list');

      // Send messages:new to the conv room and check C never receives it.
      const cShouldNotGet = neverFires(c, 'messages:new', 350);

      c.emit('conversation:join', { conversationId: CONVO_ID });
      await new Promise((r) => setTimeout(r, 100)); // allow join attempt to resolve

      realtime.emitToConversation(CONVO_ID, 'messages:new', { id: 'm1' });
      await cShouldNotGet;

      c.close();
      await new Promise((r) => setTimeout(r, 50));
    });

    it('emitToConversation reaches every member after they join, but not after they leave', async () => {
      const a = connect(port, tokenA);
      const b = connect(port, tokenB);
      await Promise.all([waitFor(a, 'presence:list'), waitFor(b, 'presence:list')]);

      a.emit('conversation:join', { conversationId: CONVO_ID });
      b.emit('conversation:join', { conversationId: CONVO_ID });
      await new Promise((r) => setTimeout(r, 100));

      const aGets = waitFor(a, 'messages:new');
      const bGets = waitFor(b, 'messages:new');
      realtime.emitToConversation(CONVO_ID, 'messages:new', { id: 'm1' });
      await Promise.all([aGets, bGets]);

      // B leaves; only A should receive the next message.
      b.emit('conversation:leave', { conversationId: CONVO_ID });
      await new Promise((r) => setTimeout(r, 100));

      const aGetsAgain = waitFor(a, 'messages:new');
      const bShouldNotGet = neverFires(b, 'messages:new', 250);
      realtime.emitToConversation(CONVO_ID, 'messages:new', { id: 'm2' });
      await Promise.all([aGetsAgain, bShouldNotGet]);

      a.close();
      b.close();
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  // ------------------------------------------------------------------- typing

  describe('typing fan-out', () => {
    it('typing:start fans out to peers in the conv room and excludes the sender', async () => {
      const a = connect(port, tokenA);
      const b = connect(port, tokenB);
      await Promise.all([waitFor(a, 'presence:list'), waitFor(b, 'presence:list')]);

      a.emit('conversation:join', { conversationId: CONVO_ID });
      b.emit('conversation:join', { conversationId: CONVO_ID });
      await new Promise((r) => setTimeout(r, 100));

      const bGetsStart = waitFor<{ userId: string; conversationId: string }>(b, 'typing:start');
      const aShouldNotEcho = neverFires(a, 'typing:start', 250);

      a.emit('typing:start', { conversationId: CONVO_ID });
      const evt = await bGetsStart;
      expect(evt).toEqual({ userId: USER_A, conversationId: CONVO_ID });
      await aShouldNotEcho;

      // typing:stop is also forwarded.
      const bGetsStop = waitFor<{ userId: string; conversationId: string }>(b, 'typing:stop');
      a.emit('typing:stop', { conversationId: CONVO_ID });
      expect((await bGetsStop).userId).toBe(USER_A);

      a.close();
      b.close();
      await new Promise((r) => setTimeout(r, 50));
    });
  });
});
