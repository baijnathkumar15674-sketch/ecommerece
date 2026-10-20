import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { GoogleVerificationService } from '../src/auth/google-verification.service.js';
import { JwtAuthGuard } from '../src/auth/jwt-auth/jwt-auth.guard.js';
import { CustomerJwtGuard } from '../src/auth/customer-jwt/customer-jwt.guard.js';

describe('Google Customer Login (e2e)', () => {
  let app: INestApplication<App>;

  const authServiceMock = {
    loginCustomerWithGoogle: vi.fn(),
  };

  const googleVerificationMock = {
    verifyCredential: vi.fn(),
  };

  const verifiedGoogleUser = {
    googleId: 'google-user-123',
    email: 'customer@example.com',
    name: 'Shopora Customer',
    picture: 'https://example.com/photo.jpg',
  };

  const loginResponse = {
    user: {
      id: 'customer-1',
      name: 'Shopora Customer',
      email: 'customer@example.com',
      phone: null,
    },
    accessToken: 'test-access-token',
    tokenType: 'Bearer',
    expiresIn: '15m',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: GoogleVerificationService,
          useValue: googleVerificationMock,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: vi.fn(() => true) },
        },
        {
          provide: CustomerJwtGuard,
          useValue: { canActivate: vi.fn(() => true) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CustomerJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rejects a request with a missing Google credential', async () => {
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({})
      .expect(400);

    expect(googleVerificationMock.verifyCredential).not.toHaveBeenCalled();
    expect(authServiceMock.loginCustomerWithGoogle).not.toHaveBeenCalled();
  });

  it('rejects an empty Google credential', async () => {
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ credential: '' })
      .expect(400);

    expect(googleVerificationMock.verifyCredential).not.toHaveBeenCalled();
  });

  it('rejects an invalid Google credential', async () => {
    googleVerificationMock.verifyCredential.mockRejectedValue(
      new UnauthorizedException('Invalid or expired Google credential.'),
    );

    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ credential: 'invalid-google-credential' })
      .expect(401);

    expect(googleVerificationMock.verifyCredential).toHaveBeenCalledWith(
      'invalid-google-credential',
    );

    expect(authServiceMock.loginCustomerWithGoogle).not.toHaveBeenCalled();
  });

  it('returns a customer login response for a verified Google account', async () => {
    googleVerificationMock.verifyCredential.mockResolvedValue(
      verifiedGoogleUser,
    );

    authServiceMock.loginCustomerWithGoogle.mockResolvedValue(loginResponse);

    const response = await request(app.getHttpServer())
      .post('/auth/google')
      .send({ credential: 'valid-google-credential' })
      .expect(200);

    expect(googleVerificationMock.verifyCredential).toHaveBeenCalledWith(
      'valid-google-credential',
    );

    expect(authServiceMock.loginCustomerWithGoogle).toHaveBeenCalledWith(
      verifiedGoogleUser,
    );

    expect(response.body).toEqual(loginResponse);
  });

  it('rejects Google login when the account belongs to an admin', async () => {
    googleVerificationMock.verifyCredential.mockResolvedValue(
      verifiedGoogleUser,
    );

    authServiceMock.loginCustomerWithGoogle.mockRejectedValue(
      new UnauthorizedException(
        'This account cannot sign in through customer Google login.',
      ),
    );

    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ credential: 'valid-google-credential' })
      .expect(401);

    expect(googleVerificationMock.verifyCredential).toHaveBeenCalledOnce();
    expect(authServiceMock.loginCustomerWithGoogle).toHaveBeenCalledOnce();
  });

  it('rejects unexpected fields in the Google login request', async () => {
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({
        credential: 'valid-google-credential',
        role: 'ADMIN',
      })
      .expect(400);

    expect(googleVerificationMock.verifyCredential).not.toHaveBeenCalled();
  });
});
