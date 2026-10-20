
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AdjustStockDto } from './adjust-stock.dto.js';
import { PrismaService } from "../prisma/prisma.service.js";
import type { CreateProductDto } from './create-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
  return this.prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}


async findOne(id: string) {
  return this.prisma.product.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
      ],
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}


  async findCategories() {
  return this.prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

async create(dto: CreateProductDto) {
  const category = await this.prisma.category.findUnique({
    where: { id: dto.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new BadRequestException('Please select a valid category.');
  }

  
try {
  const imageUrls = dto.imageUrls?.length
    ? dto.imageUrls
    : dto.imageUrl?.trim()
      ? [dto.imageUrl.trim()]
      : [];

  return await this.prisma.product.create({
    data: {
      name: dto.name.trim(),
      slug: dto.slug.trim(),
      description: dto.description.trim(),
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.categoryId,
      imageUrl: imageUrls[0] ?? null,
      isActive: true,

      images: {
        create: imageUrls.map((url, index) => ({
          url,
          alt: `${dto.name.trim()} image ${index + 1}`,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      },
    },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'This product slug already exists. Choose another slug.',
    );
  }

  throw error;
}

}

  async adjustStock(id: string, dto: AdjustStockDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        select: { id: true, name: true, stock: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found.');
      }

      if (dto.action === 'remove') {
        const result = await tx.product.updateMany({
          where: {
            id,
            stock: { gte: dto.quantity },
          },
          data: {
            stock: { decrement: dto.quantity },
          },
        });

        if (dto.action === 'remove') {
  const result = await tx.product.updateMany({
    where: {
      id,
      stock: { gte: dto.quantity },
    },
    data: {
      stock: { decrement: dto.quantity },
    },
  });

  console.log('[STOCK REMOVE]', {
    productId: id,
    requestedQuantity: dto.quantity,
    updatedRows: result.count,
  });

  if (result.count !== 1) {
    throw new BadRequestException(
      `Cannot remove ${dto.quantity} units. Current stock is ${product.stock}.`,
    );
  }
}

        if (result.count !== 1) {
          throw new BadRequestException(
            `Cannot remove ${dto.quantity} units. Current stock is ${product.stock}.`,
          );
        }
      } else {
        await tx.product.update({
          where: { id },
          data: {
            stock: { increment: dto.quantity },
          },
        });
      }

      const updated = await tx.product.findUnique({
        where: { id },
        include: { category: true },
      });

      if (!updated) {
        throw new NotFoundException('Product not found.');
      }

      return updated;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
  async deleteProduct(id: string) {
  const product = await this.prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  return this.prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

}
