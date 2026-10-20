
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard.js';
import { CustomerJwtGuard } from './customer-jwt/customer-jwt.guard.js';
import { GoogleVerificationService } from "./google-verification.service.js";


@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_SECRET');

        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is not configured.');
        }

        return {
          secret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleVerificationService, JwtAuthGuard, CustomerJwtGuard],
exports: [JwtModule, JwtAuthGuard, CustomerJwtGuard],
})
export class AuthModule {}
