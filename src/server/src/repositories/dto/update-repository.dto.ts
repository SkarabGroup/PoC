import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateRepositoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  url?: string;
}
