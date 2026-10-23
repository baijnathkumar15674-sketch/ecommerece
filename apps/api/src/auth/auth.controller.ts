
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard.js';
import { CustomerJwtGuard } from './customer-jwt/customer-jwt.guard.js';
import { GoogleVerificationService } from './google-verification.service.js';

class AdminLoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

class AdminResetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  resetSecret!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}

class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword!: string;
}

class ChangeEmailDto {
  @IsEmail()
  @MaxLength(254)
  newEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword!: string;
}

type AuthenticatedRequest = Request & {
  user: { sub: string; role: string; tokenVersion: number };
};

class CustomerRegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

class UpdateCustomerProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}

class CustomerLoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  credential!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleVerification: GoogleVerificationService,
  ) {}

  @Post('customer/register')
  @HttpCode(HttpStatus.CREATED)
  registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(
      dto.name,
      dto.email,
      dto.password,
      dto.phone,
    );
  }

  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  loginCustomer(@Body() dto: CustomerLoginDto) {
    return this.authService.loginCustomer(dto.email, dto.password);
  }

  @Post('customer/logout')
  @UseGuards(CustomerJwtGuard)
  @HttpCode(HttpStatus.OK)
  logoutCustomer(
    @Req()
    request: Request & {
      user: { sub: string; role: 'CUSTOMER' };
    },
  ) {
    return this.authService.logoutCustomer(request.user.sub);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  // Temporary admin credential reset endpoint.
  // Remove this endpoint after the reset is complete.
  @Post('reset-admin-credentials')
  @HttpCode(HttpStatus.OK)
  resetAdminCredentials(@Body() dto: AdminResetDto) {
    return this.authService.resetAdminCredentials(
      dto.resetSecret,
      dto.newPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      request.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changeEmail(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(
      request.user.sub,
      dto.currentPassword,
      dto.newEmail,
    );
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    const googleUser =
      await this.googleVerification.verifyCredential(dto.credential);

    return this.authService.loginCustomerWithGoogle(googleUser);
  }

  @Post('customer/link-google')
  @UseGuards(CustomerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async linkGoogleAccount(
    @Req()
    request: Request & {
      user: { sub: string; role: 'CUSTOMER' };
    },
    @Body() dto: GoogleLoginDto,
  ) {
    const googleUser =
      await this.googleVerification.verifyCredential(dto.credential);

    return this.authService.linkGoogleAccount(
      request.user.sub,
      googleUser,
    );
  }

  @Get('customer/me')
  @UseGuards(CustomerJwtGuard)
  getCustomerProfile(
    @Req()
    request: Request & {
      user: { sub: string; role: 'CUSTOMER' };
    },
  ) {
    return this.authService.getCustomerProfile(request.user.sub);
  }

  @Post('customer/me')
  @UseGuards(CustomerJwtGuard)
  updateCustomerProfile(
    @Req()
    request: Request & {
      user: { sub: string; role: 'CUSTOMER' };
    },
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.authService.updateCustomerProfile(
      request.user.sub,
      dto.name,
      dto.email,
      dto.phone,
    );
  }
}
