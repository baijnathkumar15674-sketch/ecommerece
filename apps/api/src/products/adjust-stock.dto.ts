
import { IsIn, IsInt, Max, Min } from 'class-validator';

export class AdjustStockDto {
  @IsIn(['add', 'remove'])
  action!: 'add' | 'remove';

  @IsInt()
  @Min(1)
  @Max(100000)
  quantity!: number;
}
