import {
  Body,
  Controller,
  Get,
  Delete,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { AdjustStockDto } from './adjust-stock.dto.js';
import { CreateProductDto } from './create-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  findCategories() {
    return this.productsService.findCategories();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard)
  adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(id, dto);
  }
  @Delete(':id')
@UseGuards(JwtAuthGuard)
async deleteProduct(@Param('id') id: string) {
  return this.productsService.deleteProduct(id);
}
}