
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [users, orders] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.order.findMany({
        select: {
          id: true,
          customerName: true,
          email: true,
          phone: true,
          createdAt: true,
          userId: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    type CustomerRecord = {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      createdAt: Date;
      orderCount: number;
      registered: boolean;
    };

    const customers = new Map<string, CustomerRecord>();

    for (const user of users) {
      const emailKey = user.email.trim().toLowerCase();

      customers.set(emailKey, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        createdAt: user.createdAt,
        orderCount: user._count.orders,
        registered: true,
      });
    }

    for (const order of orders) {
      const emailKey = order.email.trim().toLowerCase();
      const existing = customers.get(emailKey);

      if (existing) {
        existing.orderCount += 0;
        continue;
      }

      customers.set(emailKey || `order:${order.id}`, {
        id: order.userId ?? `guest:${order.id}`,
        name: order.customerName,
        email: order.email,
        phone: order.phone,
        createdAt: order.createdAt,
        orderCount: 1,
        registered: false,
      });
    }

    const orderCounts = new Map<string, number>();
    for (const order of orders) {
      const key = order.email.trim().toLowerCase();
      if (key) {
        orderCounts.set(key, (orderCounts.get(key) ?? 0) + 1);
      }
    }

    return [...customers.entries()]
      .map(([key, customer]) => ({
        ...customer,
        orderCount: customer.registered
          ? customer.orderCount
          : orderCounts.get(key) ?? 0,
      }))
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
  }
}
