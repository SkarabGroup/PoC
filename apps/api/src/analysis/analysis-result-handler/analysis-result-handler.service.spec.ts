import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisResultHandlerService } from './analysis-result-handler.service';

describe('AnalysisResultHandlerService', () => {
  let service: AnalysisResultHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisResultHandlerService],
    }).compile();

    service = module.get<AnalysisResultHandlerService>(AnalysisResultHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
