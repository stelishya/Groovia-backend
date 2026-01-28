import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Response } from 'express';

function getErrorName(info: unknown): string | null {
  if (typeof info !== 'object' || info === null) return null;
  const name = (info as { name?: unknown }).name;
  return typeof name === 'string' ? name : null;
}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const errorName = getErrorName(info);
    const hasErr = Boolean(err);
    const isUserInvalid =
      user == null ||
      typeof user !== 'object' ||
      Array.isArray(user) ||
      !('id' in (user as Record<string, unknown>)) ||
      typeof (user as Record<string, unknown>).id !== 'string';

    const shouldTreatAsExpired =
      errorName === 'TokenExpiredError' || hasErr || isUserInvalid;

    if (shouldTreatAsExpired) {
      const res = context.switchToHttp().getResponse<Response>();
      res.setHeader(
        'WWW-Authenticate',
        'Bearer error="invalid_token", error_description="refresh token missing or expired"',
      );
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
        isRefreshTokenExpired: true,
      });
    }

    return user;
  }
}
