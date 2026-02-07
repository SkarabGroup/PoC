import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GithubCommunicatorService {
    constructor(private readonly httpService: HttpService) {}

    public async checkIfRepositoryExists(owner: string, name: string) : Promise<boolean> {
        const url = `https://api.github.com/repos/${owner}/${name}`;
        try {
            const value = await firstValueFrom(this.httpService.get(url));
            console.log(`[Log di Sistema]: Valore value:${value}`);
            return true; 
        } catch(error) {
            if(error.response?.status === 404) {
                throw new NotFoundException(`La repository ${owner}/${name} non è stata trovata su GitHub`);
            }
            throw error;
        }
    }
}
