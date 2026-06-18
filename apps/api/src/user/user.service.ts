import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, firstName: string, lastName: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create default tenant (school) if it doesn't exist yet
    let tenant = await this.prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          name: 'The Virtue College',
          shortName: 'TVC',
          domain: 'tvc.edu',
        },
      });
    }

    return this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        tenantId: tenant.id,
        role: 'SCHOOL_ADMIN',
      },
    });
  }

  // FIXED: Changed findUnique to findFirst because email isn't unique alone
  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
      },
    });
  }
}