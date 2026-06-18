import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';

describe('AcademicSessionController', () => {
  let controller: AcademicSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicSessionController],
      providers: [AcademicSessionService],
    }).compile();

    controller = module.get<AcademicSessionController>(AcademicSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
