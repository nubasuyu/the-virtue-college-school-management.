import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Body() body: { to: string }) {
    await this.emailService.sendEmail(
      body.to,
      'Test Email from Virtue College',
      '<h1>Success!</h1><p>If you are reading this, your Nodemailer setup is working perfectly.</p>'
    );
    return { message: 'Test email sent successfully' };
  }
}