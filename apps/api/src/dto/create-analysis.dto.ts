import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAnalysisDto {
    @IsString()
    @IsNotEmpty()
    repoURL: string;
}
