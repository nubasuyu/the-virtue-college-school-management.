import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🟢 100% PUBLIC - NO GUARDS!
  @Post('register')
  async register(@Body() body: any) {
    // Pass the variables individually to match your AuthService
    return this.authService.register(
      body.email, 
      body.password, 
      body.firstName, 
      body.lastName
    );
  }

  // 🟢 100% PUBLIC - NO GUARDS!
  @Post('login')
  async login(@Body() body: any) {
    // Pass the variables individually to match your AuthService
    return this.authService.login(body.email, body.password);
  }
}