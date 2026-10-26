import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './create-order.dto.js';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import type { CreatePaymentOrderDto } from './create-payment-order.dto.js';
import type { VerifyPaymentDto } from './verify-payment.dto.js';

@Injectable()

export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
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


constructor(
  private readonly prisma: PrismaService,
  private readonly config: ConfigService,
) {}

private getRazorpay() {
  const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
  const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    throw new InternalServerErrorException(
      'Razorpay payment configuration is missing.',
    );
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}
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

async createPaymentOrder(
  dto: CreatePaymentOrderDto,
  userId?: string,
) {
  if (!dto.items?.length) {
    throw new BadRequestException('Your cart is empty.');
  }

  const { keyId, client } = this.getRazorpay();
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
  let subtotal = new Prisma.Decimal(0);

  const order = await this.prisma.$transaction(
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

      subtotal = new Prisma.Decimal(0);

      for (const product of products) {
        subtotal = subtotal.add(
          product.price.mul(quantities.get(product.id)!),
        );
      }

      const amountInPaise = Number(
        subtotal.mul(100).toFixed(0),
      );

      if (
        !Number.isSafeInteger(amountInPaise) ||
        amountInPaise <= 0
      ) {
        throw new BadRequestException(
          'Invalid payment amount.',
        );
      }

      // Reserve stock atomically to prevent overselling.
      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        const result = await tx.product.updateMany({
          where: {
            id: product.id,
            isActive: true,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (result.count !== 1) {
          throw new BadRequestException(
            `Insufficient stock for ${product.name}.`,
          );
        }
      }

      return tx.order.create({
        data: {
          customerName: dto.customerName.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone.trim(),
          userId: userId ?? null,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          shippingAddress: [
            dto.address.trim(),
            dto.city.trim(),
            dto.state.trim(),
            dto.postalCode.trim(),
          ].join(', '),
          stockReserved: true,
          stockReleased: false,
          items: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: quantities.get(product.id)!,
              unitPrice: product.price,
            })),
          },
        },
      });
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  try {
    const amount = Number(subtotal.mul(100).toFixed(0));

    const razorpayOrder = await client.orders.create({
      amount,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        shoporaOrderId: order.id,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      prefill: {
        name: order.customerName,
        email: order.email,
        contact: order.phone,
      },
    };
  } catch {
    await this.releaseReservedStock(order.id);

    throw new InternalServerErrorException(
      'Unable to initialize payment. Please try again.',
    );
  }
}


async verifyPayment(dto: VerifyPaymentDto) {
  const { client } = this.getRazorpay();

  const order = await this.prisma.order.findUnique({
    where: { id: dto.orderId },
  });

  if (!order || !order.razorpayOrderId) {
    throw new NotFoundException('Payment order not found.');
  }

  if (order.razorpayOrderId !== dto.razorpayOrderId) {
    throw new UnauthorizedException(
      'Payment order does not match.',
    );
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    if (order.razorpayPaymentId === dto.razorpayPaymentId) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: PaymentStatus.PAID,
        alreadyVerified: true,
      };
    }

    throw new ConflictException(
      'This order has already been paid.',
    );
  }

  if (!order.stockReserved || order.stockReleased) {
    throw new ConflictException(
      'The order is no longer eligible for payment.',
    );
  }

  const expectedSignature = createHmac(
    'sha256',
    this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'),
  )
    .update(
      `${order.razorpayOrderId}|${dto.razorpayPaymentId}`,
    )
    .digest();

  let suppliedSignature: Buffer;

  try {
    suppliedSignature = Buffer.from(
      dto.razorpaySignature,
      'hex',
    );
  } catch {
    throw new UnauthorizedException(
      'Invalid payment signature.',
    );
  }

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(expectedSignature, suppliedSignature)
  ) {
    throw new UnauthorizedException(
      'Invalid payment signature.',
    );
  }

  // Verify payment status and amount directly with Razorpay.
  const payment = await client.payments.fetch(
    dto.razorpayPaymentId,
  );

  const expectedAmount = Number(
    order.subtotal.mul(100).toFixed(0),
  );

  if (
    payment.order_id !== order.razorpayOrderId ||
    payment.amount !== expectedAmount ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured'
  ) {
    throw new BadRequestException(
      'Payment has not been captured for the expected amount.',
    );
  }

  return this.prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: order.id },
    });

    if (!current) {
      throw new NotFoundException('Order not found.');
    }

    if (current.paymentStatus === PaymentStatus.PAID) {
      if (
        current.razorpayPaymentId === dto.razorpayPaymentId
      ) {
        return {
          orderId: current.id,
          orderNumber: current.orderNumber,
          paymentStatus: PaymentStatus.PAID,
          alreadyVerified: true,
        };
      }

      throw new ConflictException(
        'This order has already been paid.',
      );
    }

    if (
      current.razorpayOrderId !== dto.razorpayOrderId ||
      !current.stockReserved ||
      current.stockReleased
    ) {
      throw new ConflictException(
        'The order changed while payment was being verified.',
      );
    }

    const updated = await tx.order.update({
      where: { id: current.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        razorpayPaymentId: dto.razorpayPaymentId,
        paidAt: new Date(),
        status: OrderStatus.CONFIRMED,
      },
    });

    if (current.status !== OrderStatus.CONFIRMED) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: current.id,
          previousStatus: current.status,
          newStatus: OrderStatus.CONFIRMED,
          changedBy: 'system:razorpay',
        },
      });
    }

    return {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      paymentStatus: updated.paymentStatus,
      status: updated.status,
    };
  });
}

async handleRazorpayWebhook(
  rawBody: Buffer | undefined,
  signature: string | undefined,
  payload: unknown,
) {
  if (!rawBody || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    throw new UnauthorizedException('Invalid webhook signature.');
  }

  const secret = this.config.getOrThrow<string>('RAZORPAY_WEBHOOK_SECRET');

  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest();

  const supplied = Buffer.from(signature, 'hex');

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    throw new UnauthorizedException('Invalid webhook signature.');
  }

  const event = payload as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
        };
      };
    };
  };

  if (event.event !== 'payment.captured') {
    return { received: true, ignored: true };
  }

  const payment = event.payload?.payment?.entity;

  if (
    !payment?.id ||
    !payment.order_id ||
    typeof payment.amount !== 'number' ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured'
  ) {
    throw new BadRequestException('Invalid captured-payment event.');
  }

  const order = await this.prisma.order.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });

  if (!order) {
    throw new NotFoundException('Matching Shopora order not found.');
  }

  const expectedAmount = Number(order.subtotal.mul(100).toFixed(0));

  if (payment.amount !== expectedAmount) {
    this.logger.error(`Payment amount mismatch for order ${order.id}.`);
    throw new BadRequestException('Payment amount does not match.');
  }

  return this.prisma.$transaction(
    async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: order.id },
      });

      if (!current) {
        throw new NotFoundException('Shopora order not found.');
      }

      if (current.paymentStatus === PaymentStatus.PAID) {
        if (current.razorpayPaymentId === payment.id) {
          return { received: true, alreadyProcessed: true };
        }

        this.logger.error(
          `Conflicting captured payment for order ${current.id}; manual review required.`,
        );

        return { received: true, manualReviewRequired: true };
      }

      // A captured payment with released stock requires reconciliation.
      // Never silently restore the order to normal fulfillment.
      if (!current.stockReserved || current.stockReleased) {
        await tx.order.update({
          where: { id: current.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            razorpayPaymentId: payment.id,
            paidAt: new Date(),
          },
        });

        this.logger.error(
          `Order ${current.id} was paid after stock release; manual review or refund required.`,
        );

        return { received: true, manualReviewRequired: true };
      }

      if (
        current.razorpayPaymentId &&
        current.razorpayPaymentId !== payment.id
      ) {
        this.logger.error(
          `Conflicting payment ID for order ${current.id}; manual review required.`,
        );

        return { received: true, manualReviewRequired: true };
      }

      const updated = await tx.order.update({
        where: { id: current.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          razorpayPaymentId: payment.id,
          paidAt: new Date(),
          status: OrderStatus.CONFIRMED,
        },
      });

      if (current.status !== OrderStatus.CONFIRMED) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: current.id,
            previousStatus: current.status,
            newStatus: OrderStatus.CONFIRMED,
            changedBy: 'system:razorpay-webhook',
          },
        });
      }

      return {
        received: true,
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        paymentStatus: updated.paymentStatus,
        status: updated.status,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}


private async releaseReservedStock(orderId: string) {
  await this.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (
      !order ||
      !order.stockReserved ||
      order.stockReleased ||
      order.paymentStatus === PaymentStatus.PAID
    ) {
      return;
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        stockReserved: false,
        stockReleased: true,
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.CANCELLED,
      },
    });
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
