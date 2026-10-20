import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers, and hyphens only.',
  })
  @MaxLength(150)
  slug!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  price!: number;

  @IsInt()
  @Min(0)
  @Max(1000000)
  stock!: number;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  // Legacy single-image support
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true })
  imageUrl?: string;

  // Multiple product images
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl(
    { require_protocol: true },
    { each: true },
  )
  imageUrls?: string[];
}