
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AuthService - Customer Authentication', () => {
  let service: AuthService;

  const configMock = {
    get: vi.fn(),
  };

  const jwtMock = {
    signAsync: vi.fn(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    adminCredential: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    jwtMock.signAsync.mockResolvedValue('test-access-token');

    service = new AuthService(
      configMock as unknown as ConfigService,
      jwtMock as unknown as JwtService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('registers a customer with a normalized email and hashed password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockResolvedValue({
      id: 'customer-1',
      name: 'Ankur Sharma',
      email: 'ankur@example.com',
      phone: '9999999999',
    });

    const result = await service.registerCustomer(
      ' Ankur Sharma ',
      ' ANKUR@example.com ',
      'StrongPassword123!',
      ' 9999999999 ',
    );

    const createCall = prismaMock.user.create.mock.calls[0][0];

    expect(createCall.data.name).toBe('Ankur Sharma');
    expect(createCall.data.email).toBe('ankur@example.com');
    expect(createCall.data.phone).toBe('9999999999');
    expect(createCall.data.role).toBe(UserRole.CUSTOMER);

    expect(createCall.data.password).not.toBe('StrongPassword123!');
    expect(
      await bcrypt.compare(
        'StrongPassword123!',
        createCall.data.password,
      ),
    ).toBe(true);
    expect(bcrypt.getRounds(createCall.data.password)).toBe(12);

    expect(result.user.email).toBe('ankur@example.com');
    expect(result.accessToken).toBe('test-access-token');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe('15m');

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'customer-1',
      role: 'CUSTOMER',
    });
  });

  it('rejects registration when the email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-customer',
    });

    await expect(
      service.registerCustomer(
        'Ankur Sharma',
        'ankur@example.com',
        'StrongPassword123!',
      ),
    ).rejects.toThrow('An account with this email already exists.');

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('logs in a customer with the correct password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Ankur Sharma',
      email: 'ankur@example.com',
      phone: null,
      password: passwordHash,
      role: UserRole.CUSTOMER,
    });

    const result = await service.loginCustomer(
      ' ANKUR@example.com ',
      'CorrectPassword123!',
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'ankur@example.com' },
    });

    expect(result.user).toEqual({
      id: 'customer-1',
      name: 'Ankur Sharma',
      email: 'ankur@example.com',
      phone: null,
    });

    expect(result.accessToken).toBe('test-access-token');
    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'customer-1',
      role: 'CUSTOMER',
    });
  });

  it('rejects a customer login with an incorrect password', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Ankur Sharma',
      email: 'ankur@example.com',
      phone: null,
      password: passwordHash,
      role: UserRole.CUSTOMER,
    });

    await expect(
      service.loginCustomer(
        'ankur@example.com',
        'WrongPassword123!',
      ),
    ).rejects.toThrow('Invalid email or password.');

    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown email during customer login', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.loginCustomer(
        'unknown@example.com',
        'SomePassword123!',
      ),
    ).rejects.toThrow('Invalid email or password.');

    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('does not allow an admin account to use customer password login', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 4);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      phone: null,
      password: passwordHash,
      role: 'ADMIN' as UserRole,
    });

    await expect(
      service.loginCustomer(
        'admin@example.com',
        'CorrectPassword123!',
      ),
    ).rejects.toThrow('Invalid email or password.');

    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });
});

describe('AuthService - Google Customer Authentication', () => {
  let service: AuthService;

  const configMock = {
    get: vi.fn(),
  };

  const jwtMock = {
    signAsync: vi.fn(),
  };

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    adminCredential: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const googleUser = {
    googleId: 'google-user-123',
    email: ' CUSTOMER@example.com ',
    name: 'Google Customer',
    picture: 'https://example.com/photo.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    jwtMock.signAsync.mockResolvedValue('google-access-token');

    service = new AuthService(
      configMock as unknown as ConfigService,
      jwtMock as unknown as JwtService,
      prismaMock as unknown as PrismaService,
    );
  });


it('logs in an existing customer using their Google subject ID', async () => {
  prismaMock.user.findUnique.mockResolvedValue({
    id: 'customer-1',
    name: 'Existing Customer',
    email: 'customer@example.com',
    phone: '9999999999',
    role: UserRole.CUSTOMER,
    tokenVersion: 0,
  });

  const result = await service.loginCustomerWithGoogle(googleUser);

  expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
    where: { googleSub: 'google-user-123' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      tokenVersion: true,
    },
  });

  expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
  expect(prismaMock.user.create).not.toHaveBeenCalled();

  expect(result.user).toEqual({
    id: 'customer-1',
    name: 'Existing Customer',
    email: 'customer@example.com',
    phone: '9999999999',
  });

  expect(result.accessToken).toBe('google-access-token');
  expect(result.tokenType).toBe('Bearer');
  expect(result.expiresIn).toBe('15m');

  expect(jwtMock.signAsync).toHaveBeenCalledWith({
    sub: 'customer-1',
    role: 'CUSTOMER',
    tokenVersion: 0,
  });
});


  it('creates a customer account when no account exists for the Google email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockResolvedValue({
      id: 'new-customer-1',
      name: 'Google Customer',
      email: 'customer@example.com',
      phone: null,
      role: UserRole.CUSTOMER,
    });

    const result = await service.loginCustomerWithGoogle(googleUser);

    expect(prismaMock.user.create).toHaveBeenCalledOnce();

    const createCall = prismaMock.user.create.mock.calls[0][0];

    expect(createCall.data).toMatchObject({
      name: 'Google Customer',
      email: 'customer@example.com',
      phone: null,
      role: UserRole.CUSTOMER,
    });

    expect(createCall.data.password).not.toBe('');
    expect(createCall.data.password).not.toBe(googleUser.googleId);
    expect(bcrypt.getRounds(createCall.data.password)).toBe(12);

    expect(result.user).toEqual({
      id: 'new-customer-1',
      name: 'Google Customer',
      email: 'customer@example.com',
      phone: null,
    });

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 'new-customer-1',
      role: 'CUSTOMER',
    });
  });

  it('rejects Google customer login for an existing admin account', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      name: 'Shopora Admin',
      email: 'customer@example.com',
      phone: null,
      role: 'ADMIN' as UserRole,
    });

    await expect(
      service.loginCustomerWithGoogle(googleUser),
    ).rejects.toThrow(
      'This account cannot sign in through customer Google login.',
    );

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });
});
