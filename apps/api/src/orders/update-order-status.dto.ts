
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'Status must be PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, or CANCELLED.',
  })
  status!: OrderStatus;
}
