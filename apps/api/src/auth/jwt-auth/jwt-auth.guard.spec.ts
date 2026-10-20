import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard - Admin Authorization', () => {
  const jwtMock = {
    verifyAsync: vi.fn(),
  };

  const prismaMock = {
    adminCredential: {
      findUnique: vi.fn(),
    },
  };

  let guard: JwtAuthGuard;

  function createContext(authorization?: string) {
    const request = {
      headers: authorization ? { authorization } : {},
      user: undefined as
        | { sub: string; role: string; tokenVersion: number }
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

    guard = new JwtAuthGuard(
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

  it('rejects a customer token on an admin endpoint', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'customer-1',
      role: 'CUSTOMER',
      tokenVersion: 0,
    });

    const { context } = createContext('Bearer customer-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(prismaMock.adminCredential.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a token when admin credentials do not exist', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'admin@example.com',
      role: 'admin',
      tokenVersion: 0,
    });

    prismaMock.adminCredential.findUnique.mockResolvedValue(null);

    const { context } = createContext('Bearer admin-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an admin token with a stale token version', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'admin@example.com',
      role: 'admin',
      tokenVersion: 1,
    });

    prismaMock.adminCredential.findUnique.mockResolvedValue({
      id: 'default',
      email: 'admin@example.com',
      tokenVersion: 2,
    });

    const { context } = createContext('Bearer stale-admin-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows a valid admin token and attaches the admin identity to the request', async () => {
    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'ADMIN@example.com',
      role: 'admin',
      tokenVersion: 2,
    });

    prismaMock.adminCredential.findUnique.mockResolvedValue({
      id: 'default',
      email: 'admin@example.com',
      tokenVersion: 2,
    });

    const { context, request } = createContext('Bearer valid-admin-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(prismaMock.adminCredential.findUnique).toHaveBeenCalledWith({
      where: { id: 'default' },
    });

    expect(request.user).toEqual({
      sub: 'ADMIN@example.com',
      role: 'admin',
      tokenVersion: 2,
    });
  });

  it('rejects an invalid or expired token', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    const { context } = createContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
