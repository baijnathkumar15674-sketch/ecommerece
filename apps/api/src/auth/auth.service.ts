
import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private configuredEmail(): string {
    const email = this.configService.get<string>('ADMIN_EMAIL');

    if (!email) {
      throw new ServiceUnavailableException(
        'Admin authentication is not configured.',
      );
    }

    return email.trim().toLowerCase();
  }

  private async getCredential() {
    let credential = await this.prisma.adminCredential.findUnique({
      where: { id: 'default' },
    });

    if (!credential) {
      const email = this.configuredEmail();
      const passwordHash =
        this.configService.get<string>('ADMIN_PASSWORD_HASH');

      if (!passwordHash) {
        throw new ServiceUnavailableException(
          'Admin password is not configured.',
        );
      }

      try {
        credential = await this.prisma.adminCredential.create({
          data: {
            id: 'default',
            email,
            passwordHash,
            tokenVersion: 0,
          },
        });
      } catch {
        credential = await this.prisma.adminCredential.findUnique({
          where: { id: 'default' },
        });
      }
    }

    if (!credential) {
      throw new ServiceUnavailableException(
        'Admin credentials could not be initialized.',
      );
    }

    return credential;
  }

  private async issueToken(email: string, tokenVersion: number) {
    const accessToken = await this.jwtService.signAsync({
      sub: email,
      role: 'admin',
      tokenVersion,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
    };
  }

  async login(email: string, password: string) {
    const credential = await this.getCredential();

    if (
      email.trim().toLowerCase() !== credential.email.toLowerCase() ||
      !(await bcrypt.compare(password, credential.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueToken(credential.email, credential.tokenVersion);
  }

  // Reset admin credentials using ADMIN_RESET_SECRET.
  async resetAdminCredentials(
    resetSecret: string,
    newPassword: string,
  ) {
    const expectedSecret =
      this.configService.get<string>('ADMIN_RESET_SECRET');

    if (!expectedSecret) {
      throw new ServiceUnavailableException(
        'Admin reset is not configured.',
      );
    }

    if (resetSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid reset secret.');
    }

    if (newPassword.length < 12 || newPassword.length > 128) {
      throw new BadRequestException(
        'Password must be between 12 and 128 characters.',
      );
    }

    const email = this.configuredEmail();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.adminCredential.upsert({
      where: { id: 'default' },
      update: {
        email,
        passwordHash,
        tokenVersion: { increment: 1 },
      },
      create: {
        id: 'default',
        email,
        passwordHash,
        tokenVersion: 1,
      },
    });

    return {
      success: true,
      message: 'Admin credentials reset successfully.',
    };
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const credential = await this.getCredential();

    if (email.toLowerCase() !== credential.email.toLowerCase()) {
      throw new UnauthorizedException('Admin access is required.');
    }

    if (!(await bcrypt.compare(currentPassword, credential.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'The new password must differ from the current password.',
      );
    }

    await this.prisma.adminCredential.update({
      where: { id: credential.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        tokenVersion: { increment: 1 },
      },
    });

    return {
      message:
        'Password changed successfully. Sign in again with your new password.',
    };
  }

  async changeEmail(
    currentEmail: string,
    currentPassword: string,
    newEmail: string,
  ) {
    const credential = await this.getCredential();
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (currentEmail.toLowerCase() !== credential.email.toLowerCase()) {
      throw new UnauthorizedException('Admin access is required.');
    }

    if (!(await bcrypt.compare(currentPassword, credential.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (normalizedEmail === credential.email.toLowerCase()) {
      throw new BadRequestException(
        'The new email must differ from the current email.',
      );
    }

    const existing = await this.prisma.adminCredential.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('That email address is already in use.');
    }

    await this.prisma.adminCredential.update({
      where: { id: credential.id },
      data: {
        email: normalizedEmail,
        tokenVersion: { increment: 1 },
      },
    });

    return {
      message:
        'Login email changed successfully. Sign in again with your new email.',
    };
  }

  async registerCustomer(
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: passwordHash,
          phone: phone?.trim() || null,
          role: UserRole.CUSTOMER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          tokenVersion: true,
        },
      });

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        role: 'CUSTOMER',
        tokenVersion: user.tokenVersion,
      });

      return {
        user,
        accessToken,
        tokenType: 'Bearer',
        expiresIn: '15m',
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }

      throw error;
    }
  }

  async loginCustomer(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !user ||
      user.role !== UserRole.CUSTOMER ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: 'CUSTOMER',
      tokenVersion: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
    };
  }

  async loginCustomerWithGoogle(googleUser: {
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
  }) {
    const email = googleUser.email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { googleSub: googleUser.googleId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      });

      if (existingEmailUser) {
        throw new ConflictException(
          'An account with this email already exists. Sign in using that account or complete a secure account-linking flow.',
        );
      }

      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.prisma.user.create({
        data: {
          googleSub: googleUser.googleId,
          name: googleUser.name.trim() || email.split('@')[0],
          email,
          password: passwordHash,
          phone: null,
          role: UserRole.CUSTOMER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          tokenVersion: true,
        },
      });
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException(
        'This account cannot sign in through customer Google login.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: 'CUSTOMER',
      tokenVersion: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
    };
  }

  async linkGoogleAccount(
    customerId: string,
    googleUser: {
      googleId: string;
      email: string;
      name: string;
      picture: string | null;
    },
  ) {
    const email = googleUser.email.trim().toLowerCase();

    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        role: true,
        googleSub: true,
      },
    });

    if (!customer || customer.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Customer account not found.');
    }

    if (customer.email.trim().toLowerCase() !== email) {
      throw new ConflictException(
        'Your Google email must match your existing Shopora account email.',
      );
    }

    if (customer.googleSub && customer.googleSub !== googleUser.googleId) {
      throw new ConflictException(
        'A different Google account is already linked to this Shopora account.',
      );
    }

    const linkedGoogleUser = await this.prisma.user.findUnique({
      where: { googleSub: googleUser.googleId },
      select: { id: true },
    });

    if (linkedGoogleUser && linkedGoogleUser.id !== customer.id) {
      throw new ConflictException(
        'This Google account is already linked to another Shopora account.',
      );
    }

    if (customer.googleSub === googleUser.googleId) {
      return { message: 'This Google account is already linked.' };
    }

    try {
      await this.prisma.user.update({
        where: { id: customer.id },
        data: { googleSub: googleUser.googleId },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This Google account is already linked to another account.',
        );
      }

      throw error;
    }

    return { message: 'Google account linked successfully.' };
  }

  async logoutCustomer(customerId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: customerId,
        role: UserRole.CUSTOMER,
      },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });

    return {
      message: 'Logged out successfully.',
    };
  }

  async getCustomerProfile(customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user || user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Customer account not found.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  async updateCustomerProfile(
    userId: string,
    name: string,
    email: string,
    phone?: string | null,
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException(
        'That email address is already in use.',
      );
    }

    try {
      return await this.prisma.user.update({
        where: {
          id: userId,
          role: UserRole.CUSTOMER,
        },
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'That email address or phone number is already in use.',
        );
      }

      throw error;
    }
  }
}
