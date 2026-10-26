
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
