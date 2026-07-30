import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const lowerCaseEmail = email.toLowerCase();

    // 1. First, check the User table (Admins, Teachers, Staff, Parents)
    const user = await this.prisma.user.findFirst({
      where: { email: lowerCaseEmail },
    });

    if (user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result; // Returns id, email, role, tenantId, firstName, lastName, etc.
    }

    // 2. If not found in User table, check the Student table
    const student = await this.prisma.student.findFirst({
      where: { email: lowerCaseEmail },
    });

    if (student && student.passwordHash && (await bcrypt.compare(password, student.passwordHash))) {
      const { passwordHash, ...result } = student;
      return {
        ...result,
        role: 'STUDENT', // Ensure the role is explicitly set to STUDENT for the JWT
      };
    }

    // 3. If neither matches, return null (which triggers Unauthorized)
    return null;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      tenantId: user.tenantId 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}