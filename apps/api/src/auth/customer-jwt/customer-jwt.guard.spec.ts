import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CustomerJwtGuard } from './customer-jwt.guard.js';

describe('CustomerJwtGuard - Customer Authorization', () => {
  const jwtMock = {
    verifyAsync: vi.fn(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };

  let guard: CustomerJwtGuard;

  function createContext(authorization?: string) {
    const request = {
      headers: authorization ? { authorization } : {},
      user: undefined as
        | { sub: string; role: 'CUSTOMER' }
        | undefined,
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    guard = new CustomerJwtGuard(
      jwtMock as unknown as JwtService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('rejects requests without a bearer token', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(jwtMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an admin token on a customer endpoint', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'admin@example.com',
      role: 'admin',
    });

    const { context } = createContext('Bearer admin-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const { context } = createContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a customer token when the customer no longer exists', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'customer-1',
      role: 'CUSTOMER',
    });

    prismaMock.user.findUnique.mockResolvedValue(null);

    const { context } = createContext('Bearer customer-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a customer token when the account has a different role', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'customer-1',
      role: 'CUSTOMER',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'customer-1',
      role: 'ADMIN',
    });

    const { context } = createContext('Bearer customer-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows a valid customer token and attaches the customer identity', async () => {
  jwtMock.verifyAsync.mockResolvedValue({
  sub: 'customer-1',
  role: 'CUSTOMER',
  tokenVersion: 0,
});

prismaMock.user.findUnique.mockResolvedValue({
  id: 'customer-1',
  role: 'CUSTOMER',
  tokenVersion: 0,
});

    const { context, request } = createContext('Bearer customer-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
  where: { id: 'customer-1' },
  select: {
    id: true,
    role: true,
    tokenVersion: true,
  },
});

    expect(request.user).toEqual({
      sub: 'customer-1',
      role: 'CUSTOMER',
    });
  });
});
