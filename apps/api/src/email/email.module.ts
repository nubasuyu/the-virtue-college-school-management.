import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService], // 👈 Crucial: This allows other modules to use EmailService
})
export class EmailModule {}