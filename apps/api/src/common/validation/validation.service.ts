import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationService {
    validateURL(inputURL: string) : { repoURL: string; repoOwner: string; repoName: string } {
        let url: URL;
        try {
            url = new URL(inputURL);
        } catch {
            throw new BadRequestException({ 
                code: 'INVALID_URL', 
                message: "Must be an URL" 
            });
        }

        if(url.protocol !== 'https:') {
            throw new BadRequestException({ 
                code: 'INVALID_HTTPS_URL', 
                message: "Must have https protocol" 
            });
        }

        if(url.hostname !== 'github.com') {
            throw new BadRequestException({ 
                code: 'INVALID_GITHUB_URL', 
                message: "Must be a github.com URL" 
            });
        }

        const urlBodyParts = url.pathname.split('/').filter(Boolean);
        if(urlBodyParts.length < 2) {
            throw new BadRequestException({ 
                code: 'INVALID_GITHUB_URL',
                message: "URL must be https://github.com/<owner>/<repo>"
            });
        }

        const repoOwner = urlBodyParts[0];
        let repoName = urlBodyParts[1];
        if(repoName.endsWith('.git')) {
            repoName = repoName.slice(0, -4);
        }

        const validCharacters = /^[A-Za-z0-9_.-]+$/;
        if(!validCharacters.test(repoOwner) || !validCharacters.test(repoName)) {
            throw new BadRequestException({
                code: "INVALID_GITHUB_URL",
                message: "repoOwner or repoName are not valid names"
            });
        }

        const repoURL = `https://github.com/${repoOwner}/${repoName}`;
        return { repoURL, repoOwner, repoName };
    }
}
