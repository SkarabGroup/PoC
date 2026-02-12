import { IsString, IsUrl, IsOptional, IsEmail } from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  @IsUrl()
  repoURL: string;

  // Aggiungi questo blocco
  @IsOptional()
  @IsEmail()
  email?: string;
}