import { Test, TestingModule } from '@nestjs/testing';
import { DancerService } from './dancer.service';

describe('DancerService', () => {
  let service: DancerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DancerService],
    }).compile();

    service = module.get<DancerService>(DancerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
