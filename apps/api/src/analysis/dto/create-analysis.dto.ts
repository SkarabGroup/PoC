import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateAnalysisDto {
    @IsUrl({}, { message: "Must be an URL" })
    @IsNotEmpty()
    repoURL: string;
}
