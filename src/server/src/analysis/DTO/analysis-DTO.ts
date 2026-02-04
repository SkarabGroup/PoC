import { IsString, IsNotEmpty, IsUrl, IsOptional, IsEmail } from 'class-validator';

export class AnalysisRequestDTO {
    @IsNotEmpty({ message : "Deve essere fornito un URL"})
    @IsUrl(
        { host_whitelist: ["github.com", "www.github.com"]}, 
        { message : "L'URL fornito non è valido" }
    )
    repoURL: string;

    @IsNotEmpty({message: "deve essere fornita una e-mail"})
    @IsEmail()
    email?: string; 
}