import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 👇 FIX: Pass an ARRAY of targets [handler, class]
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are specified, allow access
    if (!requiredRoles) {
      return true;
    }
    
    // Check if the user's role matches any of the required roles
    const { user } = context.switchToHttp().getRequest();
    
    // 👇 FIX: Explicitly type 'role' as string to satisfy TypeScript
    return requiredRoles.some((role: string) => user.role === role);
  }
}