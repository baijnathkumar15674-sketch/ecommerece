import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
  }

  async updateSettings(dto: UpdateSettingsDto) {
    return this.prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: dto,
      create: {
        id: 'default',
        ...dto,
      },
    });
  }
}
