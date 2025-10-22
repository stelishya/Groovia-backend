import { Test, TestingModule } from '@nestjs/testing';
import { DancerController } from './dancer.controller';

describe('DancerController', () => {
  let controller: DancerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DancerController],
    }).compile();

    controller = module.get<DancerController>(DancerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
