import { Module } from '@nestjs/common';
import { ParentService } from './parent.service';
import { ParentController } from './parent.controller';
import { PrismaModule } from '../prisma/prisma.module'; 
import { EmailModule } from '../email/email.module';

@Module({
    imports: [PrismaModule, EmailModule],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}