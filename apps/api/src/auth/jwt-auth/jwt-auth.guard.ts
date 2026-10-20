
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';

type AdminRequest = Request & {
  user?: {
    sub: string;
    role: string;
    tokenVersion: number;
  };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access token is required.');
    }

    const token = authorization.slice('Bearer '.length).trim();

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
        tokenVersion: number;
      }>(token);

      if (payload.role !== 'admin' || !payload.sub) {
        throw new UnauthorizedException('Admin access is required.');
      }

      const credential = await this.prisma.adminCredential.findUnique({
        where: { id: 'default' },
      });

      if (
        !credential ||
        payload.sub.toLowerCase() !== credential.email.toLowerCase() ||
        payload.tokenVersion !== credential.tokenVersion
      ) {
        throw new UnauthorizedException(
          'Session expired. Please sign in again.',
        );
      }

      request.user = {
        sub: payload.sub,
        role: payload.role,
        tokenVersion: payload.tokenVersion,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid, expired, or revoked admin token.',
      );
    }
  }
}
