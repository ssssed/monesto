import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMonthDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  incoming?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mandatory?: number;

  @IsOptional()
  @IsString()
  strategy?: string;
}
