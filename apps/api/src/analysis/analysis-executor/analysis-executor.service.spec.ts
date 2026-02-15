import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisExecutorService } from './analysis-executor.service';

describe('AnalysisExecutorService', () => {
  let service: AnalysisExecutorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisExecutorService],
    }).compile();

    service = module.get<AnalysisExecutorService>(AnalysisExecutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
