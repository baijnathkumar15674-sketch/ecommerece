
import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { OAuth2Client } from "google-auth-library";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleVerificationService {
  private readonly client = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  async verifyCredential(credential: string) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    if (!clientId) {
      throw new ServiceUnavailableException(
        'Google authentication is not configured on the server.',
      );
    }

    if (!credential) {
      throw new UnauthorizedException('Google credential is missing.');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException(
          'Google account could not be verified.',
        );
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? '',
        picture: payload.picture ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'Invalid or expired Google credential.',
      );
    }
  }
}