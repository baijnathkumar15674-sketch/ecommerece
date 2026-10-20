
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './create-order.dto.js';

@Injectable()
export class OrdersService {


async getStatusHistory(orderId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  return this.prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { changedAt: 'desc' },
    select: {
      id: true,
      previousStatus: true,
      newStatus: true,
      changedBy: true,
      changedAt: true,
    },
  });
}


  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      shippingAddress: order.shippingAddress,
      status: order.status,
      subtotal: order.subtotal.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
    }));
  }


  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      shippingAddress: order.shippingAddress,
      status: order.status,
      subtotal: order.subtotal.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
    };
  }

 
async updateStatus(
  id: string,
  status: OrderStatus,
  changedBy: string,
) {
  if (!changedBy?.trim()) {
    throw new BadRequestException('Admin identity is required.');
  }

  return this.prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found.');
    }

    // Avoid unnecessary updates and duplicate history entries.
    if (existingOrder.status === status) {
      return {
        id: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        status: existingOrder.status,
        changed: false,
      };
    }

    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: existingOrder.status,
        newStatus: status,
        changedBy: changedBy.trim(),
      },
    });

    return {
      ...updatedOrder,
      changed: true,
    };
  });
}


  async create(dto: CreateOrderDto, userId?: string) {
  if (!dto.items?.length) {
    throw new BadRequestException('Your cart is empty.');
  }

  const quantities = new Map<string, number>();

  for (const item of dto.items) {
    if (
      !item.productId ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100
    ) {
      throw new BadRequestException('Invalid product or quantity.');
    }

    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const productIds = [...quantities.keys()];

  return this.prisma.$transaction(
    async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'One or more products are unavailable.',
        );
      }

      let subtotal = new Prisma.Decimal(0);

      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        subtotal = subtotal.add(product.price.mul(quantity));
      }

      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        const stockUpdate = await tx.product.updateMany({
          where: {
            id: product.id,
            isActive: true,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (stockUpdate.count !== 1) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}. Please refresh your cart.`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          customerName: dto.customerName.trim(),
          email: dto.email.trim().toLowerCase(),
          userId: userId ?? null,
          status: OrderStatus.PENDING,
          subtotal,
          shippingAddress: [
            dto.address.trim(),
            dto.city.trim(),
            dto.state.trim(),
            dto.postalCode.trim(),
          ].join(', '),
          phone: dto.phone.trim(),
          items: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: quantities.get(product.id)!,
              unitPrice: product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal.toString(),
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
        })),
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
async findMyOrders(userId: string) {
  const orders = await this.prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: { changedAt: 'asc' },
        select: {
          id: true,
          previousStatus: true,
          newStatus: true,
          changedAt: true,
        },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal.toString(),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    })),
    statusHistory: order.statusHistory,
  }));
}
}