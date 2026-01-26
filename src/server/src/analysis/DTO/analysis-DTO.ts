import { IsUrl, IsNotEmpty } from 'class-validator';

export class AnalysisRequestDTO {
    @IsNotEmpty({ message : "Deve essere fornito un URL"})
    @IsUrl(
        { host_whitelist: ["github.com", "www.github.com"]}, 
        { message : "L'URL fornito non è valido" }
    )
    repoURL: string;
}
