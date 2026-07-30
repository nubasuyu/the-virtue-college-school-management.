import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// This allows us to use @Roles('ADMIN', 'TEACHER') on our controllers
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);