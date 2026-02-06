import { Test, TestingModule } from '@nestjs/testing';
import { GithubCommunicatorService } from './github-communicator.service';

describe('GithubCommunicatorService', () => {
  let service: GithubCommunicatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubCommunicatorService],
    }).compile();

    service = module.get<GithubCommunicatorService>(GithubCommunicatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
