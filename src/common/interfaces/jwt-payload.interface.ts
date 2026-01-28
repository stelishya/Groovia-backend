import { Role } from '../enums/role.enum';

export interface JwtPayload {
  userId: string;
  email?: string;
  username?: string;
  role: Role;

  isSuspended?: boolean;
  suspendedUntil?: Date;
  warningCount?: number;

  // standard jwt fields
  iat?: number;
  exp?: number;
}
