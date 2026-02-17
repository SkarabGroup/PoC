import { IsUrl, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateAnalysisDto {
    @IsUrl({}, { message: "Must be an URL" })
    @IsNotEmpty()
    repoURL: string;

    @IsMongoId({message : 'Invalid UserID'})
    @IsNotEmpty({message: 'Need a uesrname!'})
    userId:string;
}
