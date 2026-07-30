import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    let userRecord: any = null;

    // 1. If the role is STUDENT, check the Student table
    if (payload.role === 'STUDENT') {
      userRecord = await this.prisma.student.findUnique({
        where: { id: payload.sub },
      });
    } 
    // 2. For all other roles (TEACHER, PARENT, SUPER_ADMIN, SCHOOL_ADMIN, ACCOUNTANT), 
    // check the main User table.
    else {
      userRecord = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
    }

    // 3. If we still didn't find them, the token is invalid or the user was deleted
    if (!userRecord) {
      console.error('❌ JWT Validation Failed - Record not found for ID:', payload.sub, 'Role:', payload.role);
      throw new UnauthorizedException('User not found');
    }

    console.log('✅ JWT Validated successfully for role:', payload.role, 'ID:', payload.sub);

    return { 
      userId: userRecord.id, 
      email: userRecord.email, 
      role: payload.role, 
      tenantId: userRecord.tenantId 
    };
  }
}