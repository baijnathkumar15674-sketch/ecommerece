import { afterEach, describe, expect, it, vi } from 'vitest';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleVerificationService } from './google-verification.service.js';

describe('GoogleVerificationService', () => {
  const configService = {
    get: vi.fn(),
  } as unknown as ConfigService;

  let service: GoogleVerificationService;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  function createService() {
    service = new GoogleVerificationService(configService);
    return service;
  }

  it('rejects Google login when GOOGLE_CLIENT_ID is missing', async () => {
    vi.mocked(configService.get).mockReturnValue(undefined);

    await expect(
      createService().verifyCredential('some-google-credential'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects an empty Google credential', async () => {
    vi.mocked(configService.get).mockReturnValue('test-client-id');

    await expect(
      createService().verifyCredential(''),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns verified Google account details for a valid credential', async () => {
    vi.mocked(configService.get).mockReturnValue('test-client-id');

    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-user-123',
        email: 'customer@example.com',
        email_verified: true,
        name: 'Shopora Customer',
        picture: 'https://example.com/photo.jpg',
      }),
    } as any);

    const result = await createService().verifyCredential('valid-credential');

    expect(result).toEqual({
      googleId: 'google-user-123',
      email: 'customer@example.com',
      name: 'Shopora Customer',
      picture: 'https://example.com/photo.jpg',
    });

    expect(OAuth2Client.prototype.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-credential',
      audience: 'test-client-id',
    });
  });

  it('rejects a Google account whose email is not verified', async () => {
    vi.mocked(configService.get).mockReturnValue('test-client-id');

    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
      getPayload: () => ({
        sub: 'google-user-123',
        email: 'customer@example.com',
        email_verified: false,
      }),
    } as any);

    await expect(
      createService().verifyCredential('unverified-credential'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a credential when Google token verification fails', async () => {
    vi.mocked(configService.get).mockReturnValue('test-client-id');

    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(
      new Error('Invalid token'),
    );

    await expect(
      createService().verifyCredential('invalid-credential'),
    ).rejects.toThrow('Invalid or expired Google credential.');
  });
});
