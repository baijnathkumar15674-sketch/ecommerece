
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './create-order.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { UpdateOrderStatusDto } from './update-order-status.dto.js';
import type { Request } from 'express';
import { CustomerJwtGuard } from '../auth/customer-jwt/customer-jwt.guard.js';

type AdminRequest = Request & {
  user: {
    sub: string;
    role: string;
  };
};

type CustomerRequest = Request & {
  user: {
    sub: string;
    role: 'CUSTOMER';
  };
};

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.ordersService.findAll();
  }


@Get(':id/status-history')
@UseGuards(JwtAuthGuard)
getStatusHistory(@Param('id') id: string) {
  return this.ordersService.getStatusHistory(id);
}

@Get('my-orders')
@UseGuards(CustomerJwtGuard)
findMyOrders(@Req() request: CustomerRequest) {
  return this.ordersService.findMyOrders(request.user.sub);
}

@Get(':id')
@UseGuards(JwtAuthGuard)
findOne(@Param('id') id: string) {
  return this.ordersService.findOne(id);
}

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: AdminRequest,
  ) {
    return this.ordersService.updateStatus(
      id,
      dto.status,
      request.user.sub,
    );
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
  
  @Post('customer')
@UseGuards(CustomerJwtGuard)
@HttpCode(HttpStatus.CREATED)
createCustomerOrder(
  @Body() dto: CreateOrderDto,
  @Req() request: CustomerRequest,
) {
  return this.ordersService.create(dto, request.user.sub);
}
}
